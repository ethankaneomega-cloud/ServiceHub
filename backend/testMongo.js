// testMongo.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

async function run() {
  try {
    await client.connect();
    await client.db("servicehub").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  } finally {
    await client.close();
  }
}

run();