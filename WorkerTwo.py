import aio_pika
import asyncio
import json
import time
import dotenv
from BookTwo import OrderManager
import os
dotenv.load_dotenv()
from OrderTwo import Order
import redis
from datetime import datetime, timedelta
import pytz


ist = pytz.timezone('Asia/Kolkata')

rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
rabbitmq_user = os.getenv('RABBITMQ_USER', 'guest')
rabbitmq_password = os.getenv('RABBITMQ_PASSWORD', 'guest')
redis_port = os.getenv('REDIS_PORT', 6379)
redis_host = os.getenv('REDIS_HOST', 'localhost')


# Queue names (Each thread listens to one queue)
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

workerStop = {
    
}

map_of_books = {
}

redis_client = None

averages = {}

steps = {
    
}

for company in companies:
    map_of_books[company] = OrderManager(name=company)  

lastTimeStamp = {
    
}

compCount = {
    
}

timeUpdates = {
    
}

def connect_redis():
        global redis_client
        global redis_host
        global redis_port
        while True:
            try:
                redis_client = redis.Redis(host=redis_host, port=redis_port, socket_connect_timeout=5)
                redis_client.ping()  # Check connection
                return redis_client
            except redis.ConnectionError:
                print("❌ Redis connection failed, retrying in 5 seconds...")
                time.sleep(5)

connections = []

#Evereything is asynchrounous
async def on_message_received(message: aio_pika.IncomingMessage, channel: aio_pika.Channel, queue_name: str):
    global map_of_books
    global companies

    """Callback function when a message is received."""
    async with message.process():
        
        #Use Either of Two strategies to clean up the order book
                
        message_data = json.loads(message.body)
        action = message_data.get("action")
        exchange = await channel.declare_exchange('complete_delete', aio_pika.ExchangeType.DIRECT)
        complete_queue = await channel.declare_queue("COMPLETE", durable=True)
        delete_queue = await channel.declare_queue("DELETE", durable=True)

        await complete_queue.bind(exchange, routing_key="COMPLETE")
        await delete_queue.bind(exchange, routing_key="DELETE")

        if action == "delete":
            dictionary = map_of_books[queue_name].delete_an_order(message_data["order_id"])
            await exchange.publish(
                aio_pika.Message(body=json.dumps(dictionary).encode('utf-8')),
                routing_key="DELETE"
            )
        else:
            order = Order(
                order_id=message_data["order_id"],
                time=message_data["time"],
                order_type=message_data["order_type"],
                quantity=message_data["quantity"],
                price=message_data["price"],
                company_id=message_data.get("company_id"),
                user_id=message_data["user_id"]
            )

            array = map_of_books[queue_name].process_incoming_order(order=order)
            if array:
                for obj in array:
                    if("+b" not in obj.order_id):
                        await exchange.publish( 
                            aio_pika.Message(body=json.dumps(obj.__dict__).encode('utf-8')),
                            routing_key="COMPLETE"
                            )

                update_redis(queue_name)



def update_redis(name):
        global map_of_books
        global redis_client
        global averages
        global steps
        global compCount
        global lastTimeStamp
        global ist
        global timeUpdates
        current_time = datetime.now(ist)  # Correct IST time
            
            
        if (current_time - lastTimeStamp[name]).seconds > 10:

            lastTimeStamp[name] = current_time
            map_of_books[name].cleanup_bot_orders()

        
        if True:
            if steps[name] <= 10:

                map_of_books[name].till_market += map_of_books[name].market
                steps[name] += 1
            else:
                # price = map_of_books[name].CosineCalculation() if map_of_books[name].CosineCalculation() > 0 else map_of_books[name].market
                # Too much volitility    

                price = map_of_books[name].till_market/10
                map_of_books[name].till_market = 0
                steps[name] = 1
                

                print(f"📈 Updating Redis for {name} with price: {price}")
                
            
                
                data_to_publish = {
                    "time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "price": price,
                }
            
                try:
                    redis_client.xadd(name + "_market", data_to_publish)
                    response = redis_client.publish(name, json.dumps(data_to_publish))
                    redis_client.set(name, json.dumps(data_to_publish))
                    
                    if redis_client.exists(name+ ":low"):
                        if price < float(redis_client.get(name + ":low")) and  float(redis_client.get(name + ":low")) != 0:
                            redis_client.publish(name + ":low:pub", float(price))
                            redis_client.set(name + ":low", float(price))
                    else:
                        redis_client.set(name + ":low", float(price))
                        redis_client.publish(name + ":low:pub", float(price))
                    
                    if redis_client.exists(name+ ":high"):
                        if price > float(redis_client.get(name + ":high")) and float(redis_client.get(name + ":high")) != 0:
                            redis_client.set(name + ":high", float(price))
                            redis_client.publish(name + ":high:pub", float(price))
                    else:
                        redis_client.set(name + ":high", float(price))
                        redis_client.publish(name + ":high:pub", float(price))
                        
                    if map_of_books[name].total_buy_volume > 0:
                        redis_client.set(name + "_buy_volume", float(map_of_books[name].total_buy_volume))
                        redis_client.publish(name + "_buy_volume", float(map_of_books[name].total_buy_volume))
                    
                    
                    if map_of_books[name].total_sell_volume > 0:
                        redis_client.set(name + "_sell_volume", float(map_of_books[name].total_sell_volume))
                        redis_client.publish(name + "_sell_volume", float(map_of_books[name].total_sell_volume))
                    
                except redis.ConnectionError:
                    print("❌ Redis connection lost, reconnecting...")
                    redis_client = connect_redis()

def algorithm(sell_wt, buy_wt, sell_qt, buy_qt):
        if sell_qt + buy_qt == 0:
            return -1
        return (sell_wt + buy_wt) / (sell_qt + buy_qt)


async def create_connection():
    global rabbitmq_host
    global rabbitmq_port
    global rabbitmq_user
    global rabbitmq_password
    """Create a new RabbitMQ connection using aio-pika."""
    connection = await aio_pika.connect_robust(
        f'amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}:{rabbitmq_port}/',
    )
    return connection


async def consume_from_queue(queue_name, id: int):
    """Consumer function for a single queue that can pause/resume consumption."""
    global connections, workerStop  # ensure workerStop is a global dictionary
    # Create a channel for each queue
    async with connections[id].channel() as channel:
        qos = int(os.getenv('QOS', 1))  # This is a reliability to speed tradeoff
        await channel.set_qos(prefetch_count=qos)
        queue = await channel.declare_queue(f"orders_queue_{queue_name}", durable=True)

        consumer_tag = None  # Will hold the tag returned by queue.consume

        while True:
            # Resume consuming if not stopped and not already consuming
            if not workerStop[queue_name] and consumer_tag is None:
                consumer_tag = await queue.consume(
                    lambda message: on_message_received(message, channel, queue_name)
                )
                print(f"✅ [Thread-{queue_name}] Listening for messages...")

            # Pause consuming if workerStop is True and we are currently consuming
            elif workerStop[queue_name] and consumer_tag is not None:
                await queue.cancel(consumer_tag)
                consumer_tag = None
                print(f"⏸️ [Thread-{queue_name}] Consumption paused.")

            # Sleep briefly before checking again (adjust as needed)
            await asyncio.sleep(1)



async def UpdateIfToStopQueue():
    global redis_client
    global workerStop
    global companies
    
    while True:
        for company in companies:
            if redis_client.exists(company + ":order:stop"):
                if redis_client.get(company + ":order:stop") == b'1':
                    
                    workerStop[company] = True
                    
                    print(f"Stopping {company}, {workerStop[company]}\n\n\n\n")
                
                else:
                    workerStop[company] = False
                    
            else:
                workerStop[company] = False
        await asyncio.sleep(10)


async def main():
    """Main function to start consumers."""
    global connections, companies, redis_client, averages, ist, steps, timeUpdates, workerStop
    redis_client = redis.Redis(host="localhost", port=6379, socket_connect_timeout=5)

    # Create connections (using a connection pool, e.g., one per 10 companies)
    for i in range(int(len(companies) / 10)):
        connection = await create_connection()
        connections.append(connection)

    tasks = []
    for j, queue in enumerate(companies):
        # Initialize state for each company/queue
        averages[queue] = 0
        compCount[queue] = 0
        workerStop[queue] = False  # Start in a “resumed” state
        lastTimeStamp[queue] = datetime.now(ist)
        timeUpdates[queue] = datetime.now(ist)
        steps[queue] = 1

        # Start the consumer task for each queue
        task = asyncio.create_task(consume_from_queue(queue, int(j % len(connections))))
        tasks.append(task)
        
        
    redis_update = asyncio.create_task(UpdateIfToStopQueue())
    
    
    tasks.append(redis_update)

    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        print("🛑 Stopping consumers...")
        for connection in connections:
            await connection.close()

if __name__ == "__main__":
    asyncio.run(main())
