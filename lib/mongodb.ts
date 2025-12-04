import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || '';
const options = {};

if (!uri) {
  console.warn('MONGODB_URI not set - falling back to localStorage-only mode');
}

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export async function connectToDatabase() {
  if (!uri || !clientPromise) {
    throw new Error('MONGODB_URI not configured');
  }
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB || 'yassen-pro';
  const db = client.db(dbName);
  return { client, db };
}
