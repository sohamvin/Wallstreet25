import asyncio
import json
import os
import uuid
import signal
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

import aiohttp
import aio_pika
import redis.asyncio as redis

# -----------------------------#
#      Global Configuration    #
# -----------------------------#

# Timezone
ist = timezone(timedelta(hours=5, minutes=30))

load_dotenv()

# API endpoint to fetch pending orders (returns orders for all companies)
API_URL_PENDING_ORDERS = os.getenv('API_URL_PENDING_ORDERS', "http://localhost:8935/api/pending_orders")
print(f"API_URL_PENDING_ORDERS: {os.getenv('API_URL_PENDING_ORDERS')}")

# Threshold (in seconds) for an order to be considered stale/pending
PENDING_THRESHOLD = 60  

# Sensible range threshold (e.g. within 2% deviation of the current market price)
SENSIBLE_RANGE_THRESHOLD = 0.01

# Polling interval for checking pending orders (in seconds)
POLL_INTERVAL = 15

# -----------------------------#
#   RabbitMQ & Redis Settings  #
# -----------------------------#

rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
rabbitmq_password = os.getenv('RABBITMQ_PASSWORD', 'guest')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis://localhost')

# -----------------------------#
#   Helper Connection Methods  #
# -----------------------------#

async def create_rabbit_connection():
    connection = await aio_pika.connect_robust(
        f'amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}:{rabbitmq_port}/'
    )
    return connection

async def create_redis_client():
    return redis.from_url(REDIS_HOST, decode_responses=True)

# -----------------------------#
#   Helper Utility Functions   #
# -----------------------------#

def parse_timestamp(timestamp_str):
    """Parse an ISO formatted timestamp string."""
    try:
        return datetime.fromisoformat(timestamp_str)
    except Exception:
        return None

def counter_order_type(original_type):
    """Return the counter order type: if original is 'buy', return 'sell', and vice versa."""
    return "sell" if original_type.lower() == "buy" else "buy"

async def get_current_market_price(company, redis_client):
    """Fetch the current market price from Redis for the given company."""
    data = await redis_client.get(company)
    data = json.loads(data)
    value = float(data.get("price"))
    try:
        return value if value is not None else 0
    except ValueError:
        return 0

# -----------------------------#
#      CounterOrderBot Class   #
# -----------------------------#

class CounterOrderBot:
    def __init__(self, redis_client, rabbit_channel):
        self.redis_client = redis_client
        self.rabbit_channel = rabbit_channel
        self.running = True
        # Track processed order IDs to avoid duplicate counter orders.
        self.processed_orders = set()

    async def fetch_pending_orders(self):
        """Fetch pending orders for all companies from the global API."""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(API_URL_PENDING_ORDERS) as response:
                    if response.status == 200:
                        orders = await response.json()
                        return orders
                    else:
                        print(f"Error fetching pending orders: HTTP {response.status}")
                        return []
            except Exception as e:
                print(f"Exception while fetching pending orders: {e}")
                return []

    async def process_pending_orders(self):
        """Process each pending order and place a counter order if criteria are met."""
        now = datetime.now(ist)
        orders = await self.fetch_pending_orders()
        for order in orders:
            # Use either "time" or "datetimePlaced" from the order.
            order_time_str = order.get("time") or order.get("datetimePlaced")
            order_time = parse_timestamp(order_time_str)
            if order_time is None:
                continue
            # Only process orders that have been pending longer than the threshold.
            if (now - order_time).total_seconds() < PENDING_THRESHOLD:
                continue

            order_id = order.get("order_id")
            if order_id in self.processed_orders:
                continue

            try:
                pending_price = float(order.get("price", 0))
            except (ValueError, TypeError):
                continue

            # Get the company from the order.
            company = order.get("companyName") or order.get("company_id")
            if not company:
                continue

            current_price = await get_current_market_price(company, self.redis_client)
            print(f"{company} current price: {current_price}")
            if current_price == 0:
                continue

            # Check if the pending order's price deviation is within the sensible range.
            deviation = abs(pending_price - current_price) / current_price
            if deviation <= SENSIBLE_RANGE_THRESHOLD:
                await self.place_counter_order(order, company)
                # self.processed_orders.add(order_id)
            else:
                print(f"[{company}] Order {order_id} deviation {deviation:.2%} is out of range.")

    async def place_counter_order(self, order, company):
        """Place a counter order for a pending order."""
        original_type = order.get("order_type", "")
        qty = order.get("quantity", 0)
        new_order_type = counter_order_type(original_type)
        order_price = float(order.get("price", 0)) 
        if order_price > 0 and qty > 0:
            print(f"[{company}] Placing counter {new_order_type.upper()} order at {order_price:.2f} for pending {original_type.upper()} order.")
            await self.place_order(new_order_type, order_price, qty, company)

    async def place_order(self, order_type, price, quantity, company):
        """Place an order to RabbitMQ and publish market depth data to Redis."""
        queue_name = f"orders_queue_{company}"
        order = {
            "order_id": str(uuid.uuid4()) + "+counter+b",
            "time": str(datetime.now(ist).isoformat()),
            "action": "add",
            "order_type": order_type,
            "quantity": quantity,
            "price": price,
            "company_id": company,
            "user_id": str(uuid.uuid4())
        }
        # Declare queue and exchange, then publish the order.
        queue = await self.rabbit_channel.declare_queue(queue_name, durable=True)
        exchange = await self.rabbit_channel.declare_exchange("order_routing", aio_pika.ExchangeType.DIRECT)
        await queue.bind(exchange, routing_key=queue_name)
        message = json.dumps(order)
        await self.rabbit_channel.default_exchange.publish(
            aio_pika.Message(body=message.encode()),
            routing_key=queue_name
        )
        # Publish market depth update to Redis (for frontend updates).
        data_to_publish = {
            "price": price,
            "quantity": quantity,
            "order_type": order_type
        }
        resp = await self.redis_client.xadd(f"{company}_depth", data_to_publish)
        if not resp:
            print(f"[{company}] ❌ Failed to add to Redis stream.")
        else:
            print(f"[{company}] ✅ Counter order published to RabbitMQ: {resp}")

    async def run(self):
        while self.running:
            await self.process_pending_orders()
            await asyncio.sleep(POLL_INTERVAL)

    async def stop(self):
        self.running = False

# -----------------------------#
#             Main             #
# -----------------------------#

async def main():
    redis_client = await create_redis_client()
    rabbit_connection = await create_rabbit_connection()
    rabbit_channel = await rabbit_connection.channel()

    counter_bot = CounterOrderBot(redis_client, rabbit_channel)
    task = asyncio.create_task(counter_bot.run())

    async def shutdown():
        print("\n🛑 Shutting down CounterOrderBot...")
        await counter_bot.stop()
        task.cancel()
        await redis_client.close()
        await rabbit_connection.close()
        print("✅ Shutdown complete.")

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown()))

    try:
        await asyncio.gather(task)
    except asyncio.CancelledError:
        pass

if __name__ == "__main__":
    asyncio.run(main())
