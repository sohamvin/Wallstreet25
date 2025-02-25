const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createClient } = require("redis");
const { tr } = require("faker/lib/locales");
const redisClient = createClient({ url: "redis://localhost:6379" });

redisClient.on("error", (err) => {
  console.error("[Redis] Client Error:", err);
});
function spacesToUnderscores(str) {
    return str.replace(/ /g, "_");
  }
  
  function underscoresToSpaces(str) {
    return str.replace(/_/g, " ");
  }

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



const getCompany=async (req,res)=>{
    try {
        const {companyName}=req.body;

        const company = await prisma.company.findUnique({
            where:{name:companyName},
            select: {
                name  : true,
                ticker:true,
                ceo: true,
                sector: true,
                subsector: true,
                group: true,
                locations: true,
                marketcap: true,
                revenue : true,
                yoy_growth: true,
                pat: true,
                profit_growth: true,
                foreign_trade_exposure: true,
                government_schemes_involvement: true,
                public_sector: true,
                fundamentals: true,
                facevalue: true,
                expansion_plans: true,


            }
        }
        );
        return res.status(200).json(company);
        
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ message: "Internal server error" });
        
    }
}
//GET Type
const getAllCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            select: {
                name: true,
                ticker:true,
                ceo: true,
                sector: true,
                subsector: true,
                totalShares: true,
                
            }
        });
//GET Type
        // Convert BigInt values to strings
        let companiesWithStringBigInts = companies.map(company => ({
            ...company,
            totalShares: company.totalShares.toString(),
        //    outstandingShares: company.outstandingShares?.toString(),
          //  debt: company.debt?.toString(),
        }));

        // Use Promise.all to handle asynchronous operations
        companiesWithStringBigInts = await Promise.all(companiesWithStringBigInts.map(async (company) => {
            if (await redisClient.exists(`${spacesToUnderscores(company.name)}:open`) === 0) {
                company.price = 0;
            } else {
                company.price = await redisClient.get(`${spacesToUnderscores(company.name)}:open`);
            }
            return company;
        }));

        return res.status(200).json(companiesWithStringBigInts);
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// POST TYPE


const getCompanyWiseOrders = async (req, res) => {
    try {
        const u = req.user;
        const userId = u.id;
        const { companyId } = req.body;
        let orders = await prisma.order.findMany({
            where: {
                userId: userId,
                companyName: companyId,
                status: {
                    in: ["COMPLETED", "CANCELED"],
                  },
            },
            orderBy: {
                datetimePlaced: "desc",
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
            }
        });


        orders.forEach((order) => {
            if (order.status === "CANCELED") {

                console.log(`order`, order);
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


module.exports = {
    getAllCompanies,
    getCompanyWiseOrders,
    getCompany
}
