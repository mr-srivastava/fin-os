import { MongoClient, type Db } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  return new MongoClient(uri).connect();
}

/** Returns a shared MongoClient, reused across warm invocations and dev-server hot reloads. */
export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global.__mongoClientPromise) global.__mongoClientPromise = connect();
    return global.__mongoClientPromise;
  }
  if (!clientPromise) clientPromise = connect();
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB;
  if (!dbName) throw new Error("MONGODB_DB is not set.");
  const client = await getMongoClient();
  return client.db(dbName);
}
