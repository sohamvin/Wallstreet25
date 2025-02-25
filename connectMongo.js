const { MongoClient } = require("mongodb");
const dotenv = require('dotenv')

dotenv.config();
// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;

// Name of your database
const DB_NAME = "wallstreet";

// Name of your collection
const COLLECTION_NAME = "LarTex_and_Turbo_Limited_data";

async function main() {
  let client;

  try {
    // 1. Create a new MongoClient
    client = new MongoClient(MONGO_URI, {
      // Options are optional in recent versions, but you can still specify them if needed
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    // 2. Connect to the MongoDB server
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");

    // 3. Select the database
    // const db = client.db(DB_NAME);

    // // 4. Select the collection
    // const collection = db.collection(COLLECTION_NAME);

    // // 5. Fetch documents (example: first 10 documents)
    // const docs = await collection.find({}).limit(10).toArray();

    // 6. Print or process the fetched data
    // console.log("📜 Fetched Data:", docs);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    // 7. Close the connection
    if (client) {
      await client.close();
    }
  }
}

// Run the function
main();
