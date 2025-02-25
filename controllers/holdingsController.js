const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  redisClient,
  spacesToUnderscores,
  underscoresToSpaces
} = require('../redisClient');


// const portfolio=async(req,res)=>{
//     try {
//         const user = req.user;
//         const userId = user.id;
  
//         const userPortfolio = await prisma.user.findUnique({
//             where: { id: userId },
//             select: {
//                 holdings: {  // ✅ Corrected from UserHoldings to holdings
//                     select: {
//                         companyName: true,
//                         quantity: true,
//                         amountInvestedDelivery: true
//                     }
//                 },
                
//             }
//         });
  
//         if (!userPortfolio) {
//             return res.status(404).json({ message: 'User not found' });
//         }
  
//         res.json(userPortfolio);
//     } catch (error) {
//         console.error('Error fetching user portfolio:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

// const pendinguserorders=async(req,res)=>{
//     try {
//         const { userId } = req.params;
    
//         const orders = await prisma.order.findMany({
//           where: {
//             userId: userId,
//             status: {
//               in: ["PENDING"],
//             },
//           },
//           orderBy: {
//             datetimePlaced: "desc", // Orders sorted by most recent first
//           },
//         });
    
//         res.status(200).json({ success: true, data: orders });
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//       }
// }

// const completedeleteorder=async(req,res)=>{
//     try {
//         const { userId } = req.params;
    
//         const orders = await prisma.order.findMany({
//           where: {
//             userId: userId,
//             status: {
//               in: ["COMPLETED", "CANCELED"],
//             },
//           },
//           orderBy: {
//             datetimePlaced: "desc", // Orders sorted by most recent first
//           },
//         });
    
//         res.status(200).json({ success: true, data: orders });
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//       }
// }

const getUserCash = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const userCash = await prisma.user.findUnique({
      where: { id: userId },
      select: { cash: true },
      });
    if (!userCash) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userCash);
  } catch (error) {
    console.error("Error fetching user cash:", error);
    res.status(500).json({ message: "Internal server error" });
    }
};

const getPendingOrders = async (req, res) => {
  try {
    const u = req.user;
    const userId = u.id;

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: {
          in: ["PENDING"],
        },
      },
      orderBy: {
        datetimePlaced: "desc", // Orders sorted by most recent first
      },
      select: {
        order_id: true,
        companyName: true,
        quantity: true,
        price: true,
        order_type: true,
        status: true,
        datetimePlaced: true,
      },
      });

    

    res.status(200).json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

const getCompletedOrders = async (req, res) => {
  try {
    const u = req.user;
    const userId = u.id;
    let orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: {
          in: ["COMPLETED", "CANCELED"],
        },
      },
      orderBy: {
        datetimePlaced: "desc", // Orders sorted by most recent first
      },
      select: {
        order_id: true,
        companyName: true,
        quantity: true,
        price: true,
        order_type: true,
        status: true,
        datetimePlaced: true,
        transactions:true
      },
      });


      orders.forEach((order) => {
        if (order.status === "CANCELED") {
          // Initialize values before accumulating
          order.shares_transacted = 0;
          order.money_exchanged = 0;
      
          if (order.transactions) {
            order.transactions.forEach((transaction) => {
              order.shares_transacted += parseInt(transaction.quantity, 10) || 0;
              order.money_exchanged += 
                (parseFloat(transaction.quantity) * parseFloat(transaction.price)) || 0;
            });
          }
        }
        delete order.transactions;
      });
      

      res.status(200).json(orders);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
}


const getQuantityAndCashForNetWorth = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;

    const userHoldings = await prisma.userHolding.findMany({
      where: {
        userId: userId,
        quantity: {
          not: 0,
        }
      },
      select: {
        quantity: true,
        companyName: true,
      },
    });

    const userCash = await prisma.user.findUnique({
      where: { id: userId },
      select: { cash: true },
    });

    res.status(200).json({ userHoldings, userCash });

  } catch (error) {
    console.error("Error fetching user holdings and cash:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const individualHoldings = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;

    let userHoldings = await prisma.userHolding.findMany({
      where: {
        userId: userId,
        quantity: {
          not: 0,
        }
      },
      select: {
        quantity: true,
        companyName: true,
        averagePrice: true,
      },
    });


    for (const holding of userHoldings) {
      const key = `${spacesToUnderscores(holding.companyName)}:open`;
      const exists = await redisClient.exists(key);
    
      if (exists === 0) {
        holding.price = 0;
      } else {
        holding.price = parseFloat(await redisClient.get(key)) || 0;
      }
    }
    

    res.status(200).json(userHoldings);

  } catch (error) {
    console.error("Error fetching user holdings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const getCompanyHoldings = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    console.log(req.body);
    const { company } = req.body;

    if (!company) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const companyHoldings = await prisma.userHolding.findUnique({
      where: {
        userId_companyName: {
          userId: userId,
          companyName: company
        }
      },
      select: {
        quantity: true,
      },
    });

    if (!companyHoldings) {
      res.status(200).json({ quantity: 0 });
    } else {
      const response = { quantity: companyHoldings.quantity };
      res.status(200).json(response);
    }

  } catch (error) {
    console.error("Error fetching user holdings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { getCompletedOrders, getPendingOrders, getUserCash, getQuantityAndCashForNetWorth, individualHoldings, getCompanyHoldings };