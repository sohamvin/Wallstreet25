const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const { formatISO } = require("date-fns");
const amqp = require("amqplib/callback_api");
const { createClient } = require("redis");

const prisma = new PrismaClient();
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "order_routing";
const redisClient = createClient({ url: "redis://localhost:6379" });

redisClient.on("error", (err) => {
  console.error("[Redis] Client Error:", err);
});

async function setupRedis() {
  try {
    await redisClient.connect();
    console.log("[Redis] Connected successfully");
  } catch (err) {
    console.error("[Redis] Connection Error:", err);
    process.exit(1);
  }
}
setupRedis();

function spacesToUnderscores(str) {
  return str.replace(/ /g, "_");
}


async function main() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to the database!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



const publishToQueue = (order, action) => {
  amqp.connect(RABBITMQ_URL, (error0, connection) => {
    if (error0) {
      console.error("[RabbitMQ] Connection Error:", error0);
      return;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        console.error("[RabbitMQ] Channel Error:", error1);
        connection.close();
        return;
      }
      channel.assertExchange(EXCHANGE, "direct", { durable: false });

      const queueName = `orders_queue_${spacesToUnderscores(order.company_id)}`;
      order.action = action;

      channel.assertQueue(queueName, { durable: true }, (err, q) => {
        if (err) {
          console.error("[RabbitMQ] Queue Assertion Error:", err);
          channel.close();
          connection.close();
          return;
        }
        channel.bindQueue(q.queue, EXCHANGE, queueName);

        const message = JSON.stringify(order);
        channel.publish(EXCHANGE, queueName, Buffer.from(message), {}, (publishErr) => {
          if (publishErr) {
            console.error("[RabbitMQ] Message Not Confirmed:", publishErr);
          } else {
            console.log(`[RabbitMQ] Published ${action} to queue: ${queueName}`, message);
          }
          // Ensure the connection is closed after publishing
          setTimeout(() => {
            channel.close();
            connection.close();
          }, 500);
        });
      });
    });
  });
};


const getAllPendingOrders = async () => {   
  console.log("Getting all pending orders");
  try {
    const pendingOrders = await prisma.order.findMany({
      where: { status: { in: ["PENDING"] } }
    });
    return pendingOrders;
  } catch (error) {
    console.error("[Prisma] Error fetching pending orders:", error);
    return [];
  }
};






const putPendingInQueues = async () => {
  console.log("Putting pending orders in queues");
  const pendingOrders = await getAllPendingOrders();

  if (pendingOrders.length === 0) {
    console.log("No pending orders found.");
  }

  for (let order of pendingOrders) {
    const orderToPublish = {
      order_id: order.order_id,
      time: formatISO(order.datetimePlaced),
      order_type: order.order_type,
      quantity: order.quantity,
      price: parseFloat(order.price),
      company_id: order.companyName,
      user_id: order.userId,
    };
    console.log("order", orderToPublish);
    publishToQueue(orderToPublish, "add");
  }

  // Close Prisma client and Redis connection, then exit
  setTimeout(async () => {
    await prisma.$disconnect();
    await redisClient.quit();
    console.log("Shutting down gracefully...");
    process.exit(0);
  }, 2000);
};

putPendingInQueues();

