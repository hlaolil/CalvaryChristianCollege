const { MongoClient } = require('mongodb');
require('dotenv').config();

let _db;

async function connectDB() {
  if (_db) return _db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  _db = client.db(process.env.DB_NAME);
  console.log('✅ Connected to MongoDB (Native Driver)');
  return _db;
}

function getDb() {
  if (!_db) {
    throw new Error('❌ Database not initialized. Call connectDB first.');
  }
  return _db;
}

module.exports = { connectDB, getDb };
