const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const { formatISO } = require("date-fns");
const amqp = require("amqplib/callback_api");
// const { createClient } = require("redis");
// const { use } = require("../routes/marketRoutes");
const {
  redisClient,
  spacesToUnderscores
} = require("../redisClient");
const prisma = new PrismaClient();
const RABBITMQ_URL = "amqp://localhost";
const EXCHANGE = "order_routing";
// const redisClient = createClient({ url: "redis://localhost:6379" });

// redisClient.on("error", (err) => {
//   console.error("[Redis] Client Error:", err);
// });


// async function setupRedis() {
//   try {
//     await redisClient.connect();
//     console.log("[Redis] Connected successfully");
//   } catch (err) {
//     console.error("[Redis] Connection Error:", err);
//     process.exit(1);
//   }
// }
// setupRedis();

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

      const queueName = `orders_queue_${spacesToUnderscores(order.company_id)}`;
      order.action = action;

      console.log(`name of queue: ${queueName}`);

      channel.assertQueue(queueName, { durable: true }, (err, q) => {
        if (err) {
          throw err;
        }
        channel.bindQueue(q.queue, EXCHANGE, queueName);

        const message = JSON.stringify(order);
        channel.publish(EXCHANGE, queueName, Buffer.from(message), {}, (publishErr, ok) => {
          if (publishErr) {
            console.error("Message not confirmed!", publishErr);
          } else {
            console.log("Message confirmed by broker.");
          }
        });
        console.log(`[RabbitMQ] Published ${action} to queue: ${queueName}`, message);
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
        `${spacesToUnderscores(companyId)}_depth_socket`,
        JSON.stringify(order)
      );
    console.log(`[Redis] Published order update to socket:`, publishResponse);
  } catch (err) {
    console.error("[Redis] Error publishing to Redis:", err);
  }
};

const placeBuyOrder = async (req, res) => {
//   const { companyName, quantity, price, userId } = req.body;
//   console.log("placeBuyOrder called with", `${JSON.stringify(req.body)}`);
    // const{
    //     user_id,
    //     company_id,
    //     order_id,
    //     time,
    //     order_type,
    //     quantity,
    //     price

    // } = req.body;

  // if (! user_id || !company_id) {
  //   return res.status(400).json({ error: "userId and companyName are required" });
  // }

  try {

    const u = req.user;
    const userId = u.id;

    const {
      companyName,
      quantity,
      price,

    } = req.body;

    if(!userId){
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await prisma.user.findFirst({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
        quantity: quantity,
        price: price,
        company_id: companyName,
        user_id: userId,
      };

    await prisma.user.update({
      where: { id: order.user_id },
      data: { cash: { decrement: quantity * price } },
    });

    let folio = await prisma.userHolding.findFirst({
      where: { userId: order.user_id, companyName: companyName },
    });

    if (folio) {
      await prisma.order.create({
        data: {
          order_id: order.order_id,
          datetimePlaced: new Date(order.time),
          order_type: order.order_type,
          quantity: order.quantity,
          price: order.price,
          companyName: order.company_id,
          userId: order.user_id,
          holdingId: folio.id,
        },
      });
    } else {
      folio = await prisma.userHolding.create({
        data: {
          userId: order.user_id,
          companyName: order.company_id,
          quantity: 0,
        },
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
          holdingId: folio.id,
        },
      });
    }

    publishToQueue(order, "add");
    // await addOrderToStream(companyName, order);

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing buy order:", error);
    res.status(500).json({ error: "Error placing order" });
  }
};

const placeSellOrder = async (req, res) => {
  // console.log(req.body);

  // const {
  //   user_id,
  //   company_id,
  //   order_id,
  //   time,
  //   order_type,
  //   quantity,
  //   price
  // } = req.body;
  try {

    const u = req.user;
    const userId = u.id;

    const {
      companyName,
      quantity,
      price,

    } = req.body;

    if(!userId){
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await prisma.user.findFirst({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.userLocked) {
      return res.status(403).json({ error: "User is blocked" });
    }

    const folio = await prisma.userHolding.findFirst({
      where: { userId: userId, companyName: companyName },
    });

    if (!folio || folio.quantity < quantity) {
      console.error(`Validation Error: Not enough shares to sell. Folio: ${folio} Quantity: ${quantity}`);
      return res.status(400).json({ error: "Not enough shares to sell" });
    }

    const order = {
      order_id: uuidv4(),
      time: formatISO(new Date()),
      order_type: "SELL",
      quantity: quantity,
      price: price,
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
        holdingId: folio.id,
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
        lockedSharesForSell: { increment: order.quantity },
      },
    });

    // Convert BigInt values to strings

    publishToQueue(order, "add");
    // await addOrderToStream(companyName, order);

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing sell order:", error);
    res.status(500).json({ error: "Error placing order" });
  }
};

const deleteOrder = async (req, res) => {


  try {

    const u = req.user;
    const userId = u.id;

    const { order_id } = req.body;

    console.log("order_id", order_id);

    console.log("placeBuyOrder called with", `${JSON.stringify(req.body)}`);

    const order = await prisma.order.findUnique({ 
      where: 
        { 
          order_id: order_id,
        } 
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const MarketOpen = await redisClient.get("market_status");


    if(MarketOpen === "open"){
      const deletePayload = {
        action: "delete",
        order_id: order.order_id,
        order_procedure: order.order_type,
        price: order.price,
        company_id: order.companyName,
        time: order.time,
      };
      publishToQueue(deletePayload, "delete");
  
      return res.status(200).json({ message: "Order deleted successfully", order: deletePayload });
    } else {

      const updatePrisma = await prisma.order.update({
        where: {
          order_id: order_id,
        },
        data: {
          status: "CANCELED",
          datetimeCompleted: new Date(formatISO(new Date())),
        },
        select: {
          price: true,
          quantity: true,
          order_type: true,
          companyName: true
        }
      });


      if(updatePrisma.order_type === "SELL"){
        await prisma.userHolding.update({
          where: {
            userId_companyName: {
              userId: userId,
              companyName: updatePrisma.companyName,
            },
          },
          data: {
            quantity: { increment: updatePrisma.quantity },
            lockedSharesForSell: { decrement: updatePrisma.quantity },
          },
        });
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: { cash: { increment: updatePrisma.price * updatePrisma.quantity } },
        });
      }

      return res.status(200).json({ message: "Order deleted successfully"
      });
    }

  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Error deleting order" });
  }
};


const GetALLPendingForBot = async (req, res) => {
  try{
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["PENDING"],
        },
      },
      orderBy: {
        datetimePlaced: "asc", // Orders sorted by most recent first
      },
      select: {
        order_id: true,
        companyName: true,
        quantity: true,
        price: true,
        order_type: true,
        status: true,
        datetimePlaced: true,
      }
    });

    return res.status(200).json(orders);

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }

}


const deleteWhenClose = async (req, res) => {
  try {

    const user = req.user;
    const userId = user.id;


    const { order_id } = req.body;
    const order = await prisma.order.findUnique({
      where: {
        order_id: order_id,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if(updatePrisma.order_type === "SELL"){
      await prisma.userHolding.update({
        where: {
          userId_companyName: {
            userId: userId,
            companyName: updatePrisma.companyName,
          },
        },
        data: {
          quantity: { increment: updatePrisma.quantity },
          lockedSharesForSell: { decrement: updatePrisma.quantity },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { cash: { increment: updatePrisma.price * updatePrisma.quantity } },
      });

    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ error: "Error deleting order" });
  }
};


module.exports = { placeBuyOrder, placeSellOrder, deleteOrder, GetALLPendingForBot, deleteWhenClose };
