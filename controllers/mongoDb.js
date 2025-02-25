const { MongoClient } = require("mongodb");

const mongoUrl = process.env.MONGO_URI; // Ensure this is defined in your environment
const dbName = "wallstreet";
let db; // MongoDB database connection

// Initialize MongoDB connection and return a promise
async function initMongo() {
  const client = new MongoClient(mongoUrl); // Options like useNewUrlParser and useUnifiedTopology are no longer needed in version 4.x
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB");
  return db;
}

// Export the initialization function and a getter for the connection
function getDb() {
  if (!db) {
    throw new Error("MongoDB not initialized");
  }
  return db;
}

module.exports = { initMongo, getDb };
