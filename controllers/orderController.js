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

const publishToQueue = (order, action) => {
  amqp.connect(RABBITMQ_URL, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      channel.assertExchange(EXCHANGE, "direct", { durable: false });

      const queueName = `orders_queue_${order.company_id}`;
      order.action = action;

      console.log(`name of queue: ${queueName}`);

      channel.assertQueue(queueName, { durable: true }, (err, q) => {
        if (err) {
          throw err;
        }
        channel.bindQueue(q.queue, EXCHANGE, queueName);

        const message = JSON.stringify(order);
        channel.publish(EXCHANGE, queueName, Buffer.from(message));
        console.log(`[RabbitMQ] Published ${action} message to queue: ${queueName}`, message);
      });
    });
  });
};

const addOrderToStream = async (companyId, order) => {
  try {
    console.log(`[Redis] Adding order to stream for company ${companyId}:`, order);
    const response = await redisClient.xAdd(
        `${companyId}_depth`,
        '*',
        'price',
        order.price,
        'quantity',
        order.quantity,
        'order_type',
        order.order_type
      );
  
      const publishResponse = await redisClient.publish(
        `${companyId}_depth_socket`,
        JSON.stringify(order)
      );
    console.log(`[Redis] Published order update to socket:`, publishResponse);
  } catch (err) {
    console.error("[Redis] Error publishing to Redis:", err);
  }
};

const placeBuyOrder = async (req, res) => {
  const { companyName, quantity, price } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findFirst({ where: { id: userId } });

    if (user.userLocked) {
      return res.status(403).json({ error: "User is blocked" });
    }

    if (user.cash < quantity * price) {
      return res.status(400).json({ error: "Not enough cash to buy" });
    }

    const order = {
      order_id: uuidv4(),
      time: formatISO(new Date()),
      order_type: "BUY",
      quantity,
      price,
      company_id: companyName,
      user_id: userId,
    };

    await prisma.user.update({
      where: { id: userId },
      data: { cash: { decrement: quantity * price } },
    });

    await prisma.order.create({
      data: {
        order_id: order.order_id,
        datetimePlaced: new Date(order.time),
        order_type: order.order_type,
        quantity: order.quantity,
        price: order.price,
        companyName: order.company_id,
        userId: order.user_id,
      },
    });

    publishToQueue(order, "add");
    await addOrderToStream(companyName, order);

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Error placing order" });
  }
};

const placeSellOrder = async (req, res) => {
  const { companyName, quantity, price } = req.body;
  const userId = req.user.id;

  try {
    const folio = await prisma.userHolding.findFirst({
      where: { userId, companyName },
    });

    if (!folio || folio.quantity < quantity) {
      return res.status(400).json({ error: "Not enough shares to sell" });
    }

    const order = {
      order_id: uuidv4(),
      time: formatISO(new Date()),
      order_type: "SELL",
      quantity,
      price,
      company_id: companyName,
      user_id: userId,
    };

    await prisma.order.create({
      data: {
        order_id: order.order_id,
        datetimePlaced: new Date(order.time),
        order_type: order.order_type,
        quantity: order.quantity,
        price: order.price,
        companyName: order.company_id,
        userId: order.user_id,
      },
    });

    await prisma.userHolding.update({
      where: {
        userId_companyName: {
          userId: order.user_id,
          companyName: order.company_id,
        },
      },
      data: {
        quantity: { decrement: order.quantity },
      },
    });

    publishToQueue(order, "add");
    await addOrderToStream(companyName, order);

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Error placing order" });
  }
};

const deleteOrder = async (req, res) => {
  const { order_id } = req.body;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findFirst({ where: { order_id, userId } });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    

    const deletePayload = {
      action: "delete",
      order_id: order.order_id,
      order_procedure: order.order_type,
      price: order.price,
      company_id: order.companyName,
      time: order.time,
    };

    publishToQueue(deletePayload, "delete");

    res.status(200).json({ message: "Order deleted successfully", order: deletePayload });
  } catch (error) {
    res.status(500).json({ error: "Error deleting order" });
  }
};






module.exports = { placeBuyOrder, placeSellOrder, deleteOrder };
