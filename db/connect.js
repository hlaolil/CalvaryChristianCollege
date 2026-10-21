const { MongoClient } = require('mongodb');

let _db;

async function connectDB() {
  if (_db) return _db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  _db = client.db(process.env.DB_NAME);
  await ensureIndexes(_db);
  return _db;
}

// Unique indexes back up the duplicate checks in the controllers, which can
// race when two requests arrive at once. If existing data already has
// duplicates, the index is skipped with a warning instead of stopping the app.
async function ensureIndexes(database) {
  const indexes = [
    ['users', { email: 1 }, { unique: true }],
    ['users', { resetToken: 1 }, { sparse: true }],
    ['users', { role: 1, createdAt: -1 }, {}],
    ['applications', { userId: 1 }, { unique: true }],
    ['applications', { submittedAt: -1 }, {}],
    ['alumni', { userId: 1 }, { unique: true }],
    ['alumni', { submittedAt: -1 }, {}],
    ['contacts', { date: -1 }, {}]
  ];
  for (const [collection, keys, options] of indexes) {
    try {
      await database.collection(collection).createIndex(keys, options);
    } catch (err) {
      console.warn(`Could not create index on ${collection} ${JSON.stringify(keys)}: ${err.message}`);
    }
  }
}

function getDb() {
  if (!_db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return _db;
}

module.exports = { connectDB, getDb };
