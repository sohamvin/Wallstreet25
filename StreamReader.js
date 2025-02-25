// const { Redis } = require('ioredis'); // Import Redis from ioredis
// const { MongoClient } = require('mongodb');
// const { formatISO } = require("date-fns");
// const dotenv = require('dotenv');
// const {PrismaClient} = require('@prisma/client');
// const prisma = new PrismaClient();
// // const mongoose = require('./mongooseConnection');
// const moment = require('moment-timezone');

// const ist = "Asia/Kolkata";

// dotenv.config();
// // Initialize Redis connection
// const redis = new Redis(); // Connect to default Redis server (localhost:6379)

// // List of company names, each corresponding to a different stream

// const companies = [
//     "Titanium Consultancy Services",
//     "NextGen Tech Solutions",
//     "HCL Systems",
//     "W-Tech Limited",
//     "BHLIMindtree Limited",
//     "Clipla Limited",
//     "BondIt Industries Limited",
//     "Helio Pharma Industries Limited",
//     "Alpha Corporation Limited",
//     "SR Chemicals and Fibers Limited",
//     "Avani Power Limited",
//     "AshLey Motors Limited",
//     "Legacy Finance Limited",
//     "Legacy Finserv Limited",
//     "Legacy Holdings and Investment Limited",
//     "Chola Capital Limited",
//     "GZ Industries Limited",
//     "RailConnect India Corporation Limited",
//     "JFS Capital Limited",
//     "JFW Steel Limited",
//     "LarTex and Turbo Limited",
//     "HPCI Limited",
//     "TPCI Limited",
//     "PowerFund Corporation Limited",
//     "Bharat Steel Works Limited",
//     "SG Capital Limited",
//     "Shriram Money Limited",
//     "Titanium Motors Limited",
//     "Titan Tubes Investments Limited",
//     "Titanium Steel Limited"
// ];
// function spacesToUnderscores(str) {
//     return str.replace(/ /g, "_");
//   }
  
//   function underscoresToSpaces(str) {
//     return str.replace(/_/g, " ");
//   }
// const mongoUrl =  process.env.MONGO_URI; // Replace with your MongoDB connection URL
// const dbName = 'wallstreet';
// let db; // MongoDB database connection

// // Initialize MongoDB connection
// // Initialize MongoDB connection
// async function initMongo() {
//     const client = new MongoClient(mongoUrl);
//     await client.connect();
//     db = client.db(dbName);
// }

// const insertOne =  async (document, name) => {
//     const result = await db.collection(name).insertOne(document);
//     return result
// }


// const insertMany =  async (documents, name) => {
//     const result = await db.collection(name).insertMany(documents);
//     return result
// }



// // Initialize an object to track lastId for each stream
// const lastIds = companies.reduce((acc, company) => {
//     acc[company] = '0'; // Initialize with '0' for each company
//     return acc;
// }, {});

// // Function to listen to a Redis stream and insert data into MongoDB
// async function listenToStream(sName, lastId) {
//     while (true) {
//         try {
//             // Read messages from the stream, blocking until new data arrives
//             const result = await redis.xread('BLOCK', 500, 'COUNT', 20, 'STREAMS', sName + '_market', lastId);

//             if (result && result.length > 0) {
//                 const messages = result[0][1]; // Extract messages

//                 console.log(`Documents that we got in bulk read = ${messages}`)

//                 const documents = [];
//                 for (const message of messages) {
//                     const messageId = message[0];
//                     let messageData = message[1];
                
//                     console.log(`Message data before conversion: ${messageData}`);
                
//                     // Convert the time string (index 1) to ISO format
//                     messageData[1] = moment().tz(ist).format("YYYY-MM-DD HH:mm:ss");;
                
//                     console.log(`Message data after conversion: ${messageData}`);
                
//                     // Prepare the document for insertion into MongoDB
//                     documents.push({
//                         messageId,
//                         messageData,
//                         timestamp: moment().tz(ist).format("YYYY-MM-DD HH:mm:ss")// current timestamp in ISO format
//                     });

//                     console.log(documents)
                
//                     // Acknowledge the message deletion from Redis
//                     await redis.xdel(sName + '_market', messageId);
//                 }
                
//                 // Insert the documents into the corresponding MongoDB collection
//                 // const collection = db.collection(`${companyId}_data`);

//                 if (documents.length > 1) {
//                     try {
//                         await insertMany(documents, sName + '_data');
//                         console.log(`Inserted ${documents.length} documents into ${sName}_data`);
//                     } catch (error) {
//                         console.error('Error inserting documents:', error);
//                     }
                    
//                 }

//                 // Update lastId to the last processed message's ID
//                 lastId = messages[messages.length - 1][0];
//             } else {
//                 console.log(`No new messages in ${sName}_market. Checking again...`);
//             }
//         } catch (error) {
//             console.error(`Error reading from ${sName}_market:`, error);
//             await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
//         }
//     }
// }

// // Start listening to all streams concurrently
// async function startListening() {
//     // Initialize MongoDB connection
//     await initMongo();

//     const listeners = companies.map(company => {
//         const streamName = `${spacesToUnderscores(company)}`; // Use the original casing as per your publishing
//         let lastId = lastIds[company]; // Use the lastId from the tracking object
//         return listenToStream(streamName, lastId);
//     });

//     await Promise.all(listeners); // Run all listeners concurrently
// }

// startListening();
const { Redis } = require('ioredis'); // Import Redis from ioredis
const { MongoClient } = require('mongodb');
const { formatISO } = require("date-fns");
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// const mongoose = require('./mongooseConnection');
const moment = require('moment-timezone');

const ist = "Asia/Kolkata";

dotenv.config();

// Initialize Redis connection
const redis = new Redis(); // Connect to default Redis server (localhost:6379)

// List of company names, each corresponding to a different stream
const companies = [
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
];

function spacesToUnderscores(str) {
    return str.replace(/ /g, "_");
}

function underscoresToSpaces(str) {
    return str.replace(/_/g, " ");
}

const mongoUrl = process.env.MONGO_URI; // Replace with your MongoDB connection URL
const dbName = 'wallstreet';
let db; // MongoDB database connection

// Initialize MongoDB connection
async function initMongo() {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
}

const insertOne = async (document, name) => {
    const result = await db.collection(name).insertOne(document);
    return result;
};

const insertMany = async (documents, name) => {
    const result = await db.collection(name).insertMany(documents);
    return result;
};

// Helper functions to persist lastId in Redis
async function getLastId(streamName) {
    const lastId = await redis.get(`lastId:${streamName}`);
    return lastId || '0';
}

async function setLastId(streamName, lastId) {
    await redis.set(`lastId:${streamName}`, lastId);
}

// Function to listen to a Redis stream and insert data into MongoDB
async function listenToStream(sName, lastId) {
    while (true) {
        try {
            // Read messages from the stream, blocking until new data arrives
            const result = await redis.xread('BLOCK', 500, 'COUNT', 20, 'STREAMS', sName + '_market', lastId);
            if (result && result.length > 0) {
                const messages = result[0][1]; // Extract messages
                console.log(`Documents that we got in bulk read = ${JSON.stringify(messages)}`);
                const documents = [];
                for (const message of messages) {
                    const messageId = message[0];
                    let messageData = message[1];
                    console.log(`Message data before conversion: ${messageData}`);
                    
                    // Convert the time string (index 1) to the current timestamp in IST format
                    messageData[1] = moment().tz(ist).format("YYYY-MM-DD HH:mm:ss");
                    console.log(`Message data after conversion: ${messageData}`);
                    
                    // Prepare the document for insertion into MongoDB
                    documents.push({
                        messageId,
                        messageData,
                        timestamp: moment().tz(ist).format("YYYY-MM-DD HH:mm:ss")
                    });
                    console.log(documents);
                    
                    // Acknowledge (delete) the message from Redis
                    await redis.xdel(sName + '_market', messageId);
                }
                
                // Insert the documents into the corresponding MongoDB collection if there are any
                if (documents.length > 0) {
                    try {
                        await insertMany(documents, sName + '_data');
                        console.log(`Inserted ${documents.length} documents into ${sName}_data`);
                    } catch (error) {
                        console.error('Error inserting documents:', error);
                    }
                }
                
                // Update lastId to the last processed message's ID and persist it in Redis
                lastId = messages[messages.length - 1][0];
                await setLastId(sName, lastId);
            } else {
                console.log(`No new messages in ${sName}_market. Checking again...`);
            }
        } catch (error) {
            console.error(`Error reading from ${sName}_market:`, error);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retrying
        }
    }
}

// Start listening to all streams concurrently
async function startListening() {
    // Initialize MongoDB connection
    await initMongo();
    // For each company, get the persisted lastId from Redis and start a listener
    const listeners = companies.map(async company => {
        const streamName = spacesToUnderscores(company);
        const lastId = await getLastId(streamName);
        return listenToStream(streamName, lastId);
    });
    await Promise.all(listeners); // Run all listeners concurrently
}

startListening();

