import asyncio
import json
import os
import uuid
import signal
import random
import math
import logging
from datetime import datetime, timedelta, timezone

import aio_pika
import redis.asyncio as redis
from dotenv import load_dotenv

# -----------------------------#
#      Global Configuration    #
# -----------------------------#
ist = timezone(timedelta(hours=5, minutes=30))
load_dotenv()

NEWS_CHANNEL = os.getenv("NEWS_CHANNEL", "news_channel")

# RabbitMQ settings
rabbitmq_host = os.getenv("RABBITMQ_HOST", "localhost")
rabbitmq_port = int(os.getenv("RABBITMQ_PORT", 5672))
rabbitmq_user = os.getenv("RABBITMQ_USER", "guest")
rabbitmq_password = os.getenv("RABBITMQ_PASSWORD", "guest")

# Redis settings
REDIS_HOST = os.getenv('REDIS_HOST', 'redis://localhost')

# Companies (comma-separated in env, or default)
companies = [
    "Titanium Consultancy Services",
    "NextGen Tech Solutions",
    "HCL Systems",
    "W-Tech Limited",
    "BHLIMindtree Limited",
    "Clipla Limited",
    "BondIt Industries Limited",
    "Helio Pharma Industries Limited",
    "Alpha Corporation Limited",
    "SR Chemicals and Fibers Limited",
    "Avani Power Limited",
    "AshLey Motors Limited",
    "Legacy Finance Limited",
    "Legacy Finserv Limited",
    "Legacy Holdings and Investment Limited",
    "Chola Capital Limited",
    "GZ Industries Limited",
    "RailConnect India Corporation Limited",
    "JFS Capital Limited",
    "JFW Steel Limited",
    "LarTex and Turbo Limited",
    "HPCI Limited",
    "TPCI Limited",
    "PowerFund Corporation Limited",
    "Bharat Steel Works Limited",
    "SG Capital Limited",
    "Shriram Money Limited",
    "Titanium Motors Limited",
    "Titan Tubes Investments Limited",
    "Titanium Steel Limited"
]

def spaces_to_underscores(text: str) -> str:
    return text.replace(" ", "_")

comps = [spaces_to_underscores(company) for company in companies]

companies = comps


print(companies)
    
stopBots = {
    
}



redis_client = None

bots = {}
tasks = []
close_bots = {
    
}


step_of_bots = {
    
}

total_bots_cash_per_sec = {
    
}

# -----------------------------#
#     Order Placement Params   #
# -----------------------------#
ORDER_DELAY_CONTINUOUS = 0.78       # seconds between orders
# CONTINUOUS_QUANTITY_RANGE = (40, 500)   # normal order quantity range
NUM_NEWS_ORDERS = 200                 # total orders over which news impact is applied

NUM_BOTS_PER_COMPANY = 3                     

# -----------------------------#
#    Utility Functions         #
# -----------------------------#
async def get_current_market_price(company, redis_client):
    """
    Fetch the current market price for a company from Redis.
    Expected format: JSON string with a "price" field.
    """
    try:
        data = await redis_client.get(company)
        if data is None:
            return 0
        data = json.loads(data)
        price = float(data.get("price", 0))
        return price
    except Exception as e:
        return 0

def order_type_from_news(sentiment):
    """
    Determine order type based on news sentiment:
      - Positive: slightly favor BUY.
      - Negative: slightly favor SELL.
      - Neutral: random choice.
    """
    if sentiment == "positive":
        order_type = random.choices(["BUY", "SELL"], weights=[0.15, 0.85])[0]
    elif sentiment == "negative":
        order_type = random.choices(["BUY", "SELL"], weights=[0.85, 0.15])[0]
    else:
        order_type = random.choice(["BUY", "SELL"])
    return order_type

# -----------------------------#
#         Company Bot          #
# -----------------------------#
class CompanyBot:
    def __init__(self, company, user_id, redis_client, channel, exchange, open_price):
        self.company = company
        self.user_id = user_id
        self.redis_client = redis_client
        self.channel = channel
        self.exchange = exchange
        self.running = True
        self.open_price = open_price  # first price from key <company>:open
        self.severity = 0
        self.circuite_limit = 12
        self.bot_id = uuid.uuid4()
        
        self.chasing_a_target = False
        
        self.upper_limit = self.open_price * (1 + self.circuite_limit / 100)
        self.lower_limit = self.open_price * (1 - self.circuite_limit / 100)
        self.current_stable = self.open_price
        self.target_price = self.open_price

    async def place_order(self, user_id, order_type, price, source="constant"):
        global close_bots
        global total_bots_cash_per_sec
        
        if close_bots[self.company]:
            return
        
        """
        Publish an order using the shared channel and update the Redis market depth.
        """
        
        
        
        quantity = math.ceil(total_bots_cash_per_sec[self.company]/price) if price > 0 else 0
        
        if quantity == 0:
            return
        
        quantity = random.randint(math.ceil(quantity*0.7), quantity)
        
        queue_name = f"orders_queue_{self.company}"
        order = {
            "order_id": str(uuid.uuid4()) + '+newbot+b',
            "time": str(datetime.now(ist).isoformat()),
            "action": "add",
            "order_type": order_type,
            "quantity": quantity,
            "price": price,
            "company_id": self.company,
            "user_id": user_id
        }
        message = json.dumps(order)
        try:
            await self.exchange.publish(
                aio_pika.Message(body=message.encode()),
                routing_key=queue_name
            )
            # Update Redis stream for market depth.
            stream_key = f"{self.company}_depth"
            data_to_publish = {
                "price": price,
                "quantity": quantity,
                "order_type": order_type
            }
            resp = await self.redis_client.xadd(stream_key, data_to_publish)
            if not resp:
                logging.error(f"[{self.company}] Failed to update Redis stream.")
        except Exception as e:
            logging.error(f"[{self.company}] Error publishing order: {e}")
            
    def cosineNext(self, price, currentStep, totalSteps):
        factor = (1 - math.cos(math.pi * currentStep/totalSteps)) / 2
        price = self.current_stable + factor * (self.target_price - self.current_stable)
        return price
    
    def CircularNext(self, currentStep, totalSteps, current, target):
        if totalSteps == 0:
            raise ValueError("totalSteps must be greater than zero")
        
        # Calculate the horizontal distance covered in the current step
        x = abs(target - current) * (currentStep / totalSteps)
        # Calculate the total distance to be covered
        r = abs(target - current)        
        # Calculate the vertical distance using the Pythagorean theorem
        distance = math.sqrt(r**2 - abs(r - x)**2)
        if current < target:
            return current + distance           
        else:
            return current - distance
            
    def priceWiseRandom(self, price):           
        if price < 100:
            adjustment_factor = random.uniform(0.98, 1.08)
        elif price < 200:
            adjustment_factor = random.uniform(0.98, 1.08)
        elif price < 300:
            adjustment_factor = random.uniform(0.98, 1.02)
        elif price < 500:
            adjustment_factor = random.uniform(0.99, 1.01)
        elif price < 1000:
            adjustment_factor = random.uniform(0.9974, 1.0026)
        elif price < 1500:
            adjustment_factor = random.uniform(0.9974, 1.0026)
        elif price < 2000:
            adjustment_factor = random.uniform(0.9974, 1.0026)
        elif price < 5000:
            adjustment_factor = random.uniform(0.9999995, 1.0000005)
        else:
            adjustment_factor = random.uniform(0.99999995, 1.0000005)
        
        if adjustment_factor > 1:
            return min(price * adjustment_factor, self.open_price * (1 + (self.circuite_limit) / 100))
        else :
            return max(price * adjustment_factor, self.open_price * (1 - (self.circuite_limit) / 100))
        
        
    # def priceWiseRandomQuant(self, price):
    #     if price < 100:
    #         quants = 
        
        


    async def continuous_order_placement(self):
        """
        Query the market price once every minute and then place orders around that price.
        If a news event is active, adjust orders gradually.
        Falls back to the open price if no current market price is found.
        """
        currentStep = 1
        alwaysTake_this_many_step = 20
        prevPrice = self.open_price
        
        while self.running:
            base_price = await get_current_market_price(self.company, self.redis_client)
            if base_price == 0:
                if self.open_price != 0:
                    base_price = self.open_price
                else:
                    await asyncio.sleep(ORDER_DELAY_CONTINUOUS)
                    continue
                    
            # quantity = random.randint(5, 10)   
            order_type = random.choice(["BUY", "SELL"])
            order_price = base_price
            
            # if self.company == spaces_to_underscores("Legacy Holdings and Investment Limited"):
            # # if self.company == "LinkedIn":
            #     print(f"\n\nFOR: {self.company} \nCurrent Stable: {self.current_stable}, we open at : {self.open_price} \nTarget Price: {self.target_price}, Base Price: {base_price}, \ncurrentStep: {currentStep} ")
            
            if self.chasing_a_target:
                if abs(self.target_price - base_price) > 5 * self.open_price / 100:
                    if currentStep <= alwaysTake_this_many_step * math.ceil(self.severity):
                        user_id = "bot"
                        order_price = self.CircularNext(currentStep, alwaysTake_this_many_step * self.severity, self.current_stable, self.target_price)
                        order_type = order_type_from_news("positive" if self.target_price > self.current_stable else "negative")
                        currentStep += 1
                    else:
                        currentStep = 1
                        user_id = "bot"
                        order_price = self.priceWiseRandom(self.current_stable)
                        self.current_stable = self.target_price
                        self.chasing_a_target = False
                else:
                    user_id = "bot"
                    self.current_stable = self.target_price
                    order_price = self.priceWiseRandom(self.current_stable)
                    self.chasing_a_target = False
            else:
                user_id = str(uuid.uuid4())
                currentStep = 1
                self.chasing_a_target = False
                order_price = self.priceWiseRandom(self.current_stable)

                
            if self.company == spaces_to_underscores("Legacy Holdings and Investment Limited"):
                
                print(f"Decided Price: {order_price}")
                
            
            
            await self.place_order(user_id, order_type, order_price)
            await asyncio.sleep(ORDER_DELAY_CONTINUOUS)

    def update_news(self, sentiment, severity):
        """
        Update the bot's news state. A new news event resets the adjustment counter.
        """
        self.severity = float(severity)
        self.chasing_a_target = True
        if sentiment == "positive": 
            self.target_price = self.current_stable + (self.upper_limit - self.current_stable) * (float(severity) / 10)
        elif sentiment == "negative":
            self.target_price = self.current_stable - (self.current_stable - self.lower_limit) * (float(severity) / 10)
        else:
            self.target_price = self.current_stable

# -----------------------------#
#      Global News Listener    #
# -----------------------------#
async def news_listener(redis_client, bots):
    """
    Listen on the Redis news channel.
    When a news message arrives, update all bot instances for the affected companies.
    Expected news format:
        {
            "sector": [<company1>, <company2>, ...],
            "sentiment": "positive" | "neutral" | "negative",
            "severity": <float>
        }
    """
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(NEWS_CHANNEL)
    print(f"Global news listener subscribed to '{NEWS_CHANNEL}'...")
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        try:
            news = json.loads(message["data"])
            print(f"News received: {news}")
            sector = news.get("sector", [])
            sentiment = news.get("sentiment", "neutral").lower()
            severity = float(news.get("severity", 0))
            for company in sector:
                if company in bots:
                    for bot in bots[company]:
                        bot.update_news(sentiment, severity)
        except Exception as e:
            logging.error(f"Error processing news message: {e}")
            
            
async def UpdateIfToStopQueue():
    global redis_client
    global close_bots
    global companies
    
    while True:
        for company in companies:
            key = company + ":bot:stop"
            if await redis_client.exists(key):
                value = await redis_client.get(key)
                if value == "1":
                    close_bots[company] = True
                    # print(f"Stopping {company}, {close_bots[company]}")
                else:
                    close_bots[company] = False
            else:
                close_bots[company] = False
        await asyncio.sleep(10)


# -----------------------------#
#             Main             #
# -----------------------------#
async def main():
    print("Starting bot initialization.")
    
    global redis_client
    global bots
    global tasks
    global companies
    global close_bots
    global total_bots_cash_per_sec
    # Create a single Redis client.
    redis_client = await redis.from_url(REDIS_HOST, decode_responses=True)
    print(f"Connected to Redis at {REDIS_HOST}.")

    # Create one RabbitMQ connection and channel.
    rabbitmq_url = f"amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}:{rabbitmq_port}/"
    rabbit_connection = await aio_pika.connect_robust(rabbitmq_url)
    print(f"Connected to RabbitMQ at {rabbitmq_url}.")
    channel = await rabbit_connection.channel()

    # Declare a shared exchange and company-specific queues.
    exchange = await channel.declare_exchange("order_routing", aio_pika.ExchangeType.DIRECT)
    for company in companies:
        queue_name = f"orders_queue_{company}"
        close_bots[company] = False
        queue = await channel.declare_queue(queue_name, durable=True)
        await queue.bind(exchange, routing_key=queue_name)
    
    
    

    for company in companies:
        # Retrieve the "open" price from Redis using key "<company>:open"
        open_price_raw = await redis_client.get(f"{company}:open")
        if open_price_raw is not None:
            try:
                open_price = float(open_price_raw)
            except Exception as e:
                logging.error(f"[{company}] Error parsing open price: {e}")
                open_price = 0
        else:
            logging.warning(f"[{company}] No open price found in Redis.")
            open_price = 0
        
        total_bots_cash_per_sec[company] = math.ceil(10000/NUM_BOTS_PER_COMPANY)
        step_of_bots[company] = 0

        bot_instances = []
        bot_userId = str(uuid.uuid4()) + '+b'
        for i in range(NUM_BOTS_PER_COMPANY):
            bot = CompanyBot(company, bot_userId, redis_client, channel, exchange, open_price)
            bot_instances.append(bot)
            tasks.append(asyncio.create_task(bot.continuous_order_placement()))
            print(f"Started bot instance {i+1} for company: {company}")
        bots[company] = bot_instances

    # Start the global news listener.
    news_task = asyncio.create_task(news_listener(redis_client, bots))
    
    stoping_bots = asyncio.create_task(UpdateIfToStopQueue())
    tasks.append(stoping_bots)
    print("Global news listener started.")

    async def shutdown():
        print("Shutting down bots...")
        for bot_list in bots.values():
            for bot in bot_list:
                bot.running = False
        for task in tasks:
            task.cancel()
        news_task.cancel()
        await redis_client.close()
        await rabbit_connection.close()
        print("Shutdown complete.")

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown()))

    try:
        await asyncio.gather(*tasks, news_task)
    except asyncio.CancelledError:
        print("Tasks cancelled, exiting.")

if __name__ == "__main__":
    asyncio.run(main())
