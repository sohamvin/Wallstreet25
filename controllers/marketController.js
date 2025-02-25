const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const { formatISO } = require("date-fns");
const amqp = require("amqplib/callback_api");
const { createClient } = require("redis");
// const { MongoClient } = require("mongodb");
const { getDb } = require("./mongoDb"); 

const prisma = new PrismaClient();
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

// const  mongoose  = require('mongoose');
// const mongoUrl =  process.env.MONGO_URI; // Replace with your MongoDB connection URL
// const dbName = 'wallstreet';
// let db; // MongoDB database connection

// Initialize MongoDB connection
// Initialize MongoDB connection
// async function initMongo() {
//     const client = new MongoClient(mongoUrl);
//     await client.connect();
//     db = client.db(dbName);
// }

// initMongo();
// MongoDB connection setup
const marketIsOpen = async (req, res) => {
    const marketStatus = await redisClient.get("market_status");

    if (!marketStatus) {
        return res.status(404).json({ error: "Market status not found" });
    }

    res.status(200).json({ is_open : marketStatus === "open" });
};

const getBuyVolume = async (req, res) => {
    try {
        const { companyName } = req.body;

        const price = redisClient.get(`${spacesToUnderscores(companyName)}_buy_volume`);

        if (!price) {
            return res.status(404).json({ error: "Buy volume not found" });
        }

        res.status(200).json({ price });
    } catch (error) {
        console.error("Error getting buy volume:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getSellVolume = async (req, res) => {
    try {
        const { companyName } = req.body;
        
        const price = redisClient.get(`${spacesToUnderscores(companyName)}_sell_volume`);

        if (!price) {
            return res.status(404).json({ error: "Sell volume not found" });
        }

        res.status(200).json({ price });
    } catch (error) {
        console.error("Error getting sell volume:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const getOpeningPrice = async (req, res) => {
    try {
        const { companyName } = req.body;

        const getCompany = await prisma.company.findUnique({
            where: {
                name: companyName,
            },
        });

        if(!companyName || !getCompany) {
            return res.status(400).json({ error: "Company name is required" });
        }
        
        if(await redisClient.exists(`${spacesToUnderscores(companyName)}:open`) === 0) {
            return res.status(404).json({ error: "Opening price not found" });
        }


        const openingPrice = await redisClient.get(`${spacesToUnderscores(companyName)}:open`);
        res.status(200).json({ openingPrice });
    }
    catch (error) {
        console.error("Error getting opening price:", error);
        res.status(500).json({ error: "Internal server error" });
    }

}

const getClosingPrice = async (req, res) => {
    try {
        const { companyName } = req.body;

        const getCompany = await prisma.company.findUnique({
            where: {
                name: companyName,
            },
        });

        if(!companyName || !getCompany) {
            return res.status(400).json({ error: "Company name is required" });
        }
        
        if(await redisClient.exists(`${spacesToUnderscores(companyName)}:close`) === 0) {
            return res.status(404).json({ error: "Closing price not found" });
        }

        const closingPrice = await redisClient.get(`${spacesToUnderscores(companyName)}:close`);
        res.status(200).json({ closingPrice });
    }
    catch (error) {
        console.error("Error getting closing price:", error);
        res.status(500).json({ error: "Internal server error" });
    }

}


const getHighPrice = async (req, res) => {
    try {
        const { companyName } = req.body;

        const getCompany = await prisma.company.findUnique({
            where: {
                name: companyName,
            },
        });

        if(!companyName || !getCompany) {
            return res.status(400).json({ error: "Company name is required" });
        }
        
        if(await redisClient.exists(`${spacesToUnderscores(companyName)}:high`) === 0) {
            return res.status(404).json({ error: "High price not found" });
        }

        const highPrice = await redisClient.get(`${spacesToUnderscores(companyName)}:high`);
        res.status(200).json({ highPrice });
    }
    catch (error) {
        console.error("Error getting high price:", error);
        res.status(500).json({ error: "Internal server error" });
    }

}


const getLowPrice = async (req, res) => {
    try {
        const { companyName } = req.body;

        const getCompany = await prisma.company.findUnique({
            where: {
                name: companyName,
            },
        });

        if(!companyName || !getCompany) {
            return res.status(400).json({ error: "Company name is required" });
        }
        
        if(await redisClient.exists(`${spacesToUnderscores(companyName)}:low`) === 0) {
            return res.status(404).json({ error: "Low price not found" });
        }

        const lowPrice = await redisClient.get(`${spacesToUnderscores(companyName)}:low`);
        res.status(200).json({ lowPrice });
    }
    catch (error) {
        console.error("Error getting low price:", error);
        res.status(500).json({ error: "Internal server error" });
    }

}

const getMarketPrice = async (req, res) => {
    try {
        const { companyName } = req.body;

        const getCompany = await prisma.company.findUnique({
            where: {
                name: companyName,
            },
        });

        if(!companyName || !getCompany) {
            return res.status(400).json({ error: "Company name is required" });
        }
        
        if(await redisClient.exists(spacesToUnderscores(companyName)) === 0) {
            return res.status(404).json({ error: "Market price not found" });
        }

        const marketPrice = await redisClient.get(spacesToUnderscores(companyName));

        const json = typeof marketPrice === 'string' ? JSON.parse(marketPrice) : marketPrice;
        
        res.status(200).json( {
           price :json.price
        } );
    }
    catch (error) {
        console.error("Error getting market price:", error);
        res.status(500).json({ error: "Internal server error" });
    }


}



const historicalMarketData = async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }
    const collectionName = `${spacesToUnderscores(companyName)}_data`;
    
    const db = getDb(); // Get the initialized db connection
    const data = await db
      .collection(collectionName)
      .find({})
      .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
      .toArray();

    if (data.length === 0) {
      return res.status(404).json({ error: `No data found for company: ${companyName}` });
    }

    // Transform messageData if necessary
    const messageDataOnly = data.map((item) => {
      if (Array.isArray(item.messageData)) {
        const obj = {};
        for (let i = 0; i < item.messageData.length; i += 2) {
          obj[item.messageData[i]] = item.messageData[i + 1];
        }
        return obj;
      }
      return item.messageData;
    });

    res.status(200).json({ message: "Historical market data fetched successfully", data: messageDataOnly });
  } catch (error) {
    console.error("Error fetching company data:", error);
    res.status(500).send("Internal Server Error");
  }
};



// const historicalMarketData = async (req, res) => {

//     try {
//         const {
//             companyName 
//         } = req.body;

//         const companyId = companyName

//         const collectionName = `${spacesToUnderscores(companyId)}_data`;

//         db.collection(collectionName).find({}).toArray((err, result) => {
//             if (err) {
//                 console.error("Error fetching historical market data:", err);
//                 return res.status(500).json({ error: "Error fetching historical market data" });
//             } else {
//                  return res.status(200).json({ message: "Historical market data fetched successfully", data: result });
//             }
//         }
//         );

//         // console.log(collectionName);

//         // const data = await mongoose.connection
//         //     .collection(collectionName)
//         //     .find({})
//         //     .sort({ timestamp: 1 }) // Sort by time in ascending order
//         //     .toArray();

//         // if (data.length === 0) {
//         //     return res.status(404).send(`No data found for company: ${companyId}`);
//         // }

//         // // Convert messageData array to an object
//         // const messageDataOnly = data.map(item => {
//         //     if (Array.isArray(item.messageData)) {
//         //         let obj = {};
//         //         for (let i = 0; i < item.messageData.length; i += 2) {
//         //             obj[item.messageData[i]] = item.messageData[i + 1];
//         //         }
//         //         return obj;
//         //     }
//         //     return item.messageData; // In case messageData is already an object
//         // });

//         // res.send(messageDataOnly); // Send the transformed messageData as an array of objects
//     } catch (error) {
//         console.error('Error fetching company data:', error);
//         res.status(500).send('Internal Server Error');
//     }
// }


// const historicalDepthData = async (req, res) => {
//     const { companyName } = req.body;
//     const companyId = companyName;
//     const collectionName = `${companyId}_depth_data`;
  
//     try {
//       const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//       await client.connect();
//       const database = client.db('orderbooks'); // Replace with your database name
//       const collection = database.collection(collectionName);
  
//       const depthData = await collection.find({}).toArray();
  
//       res.status(200).json({ message: "Historical depth data fetched successfully", data: depthData });
//       await client.close();
//     } catch (error) {
//       console.error("Error fetching historical depth data:", error);
//       res.status(500).json({ error: "Error fetching historical depth data" });
//     }
//   };

module.exports = {
    getOpeningPrice,
    getClosingPrice,
    getHighPrice,
    getLowPrice,
    getMarketPrice,
    historicalMarketData,
    // historicalDepthData,
    getBuyVolume,
    getSellVolume, 
    marketIsOpen
}

