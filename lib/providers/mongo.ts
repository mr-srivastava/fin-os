import { MongoClient, type Db } from "mongodb";
import { CATALOGUE_META_COLLECTION, SCHEMES_COLLECTION } from "../catalog/fundCatalog.types";
import { WATCHLISTS_COLLECTION } from "../watchlist/watchlist.types";

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

/**
 * Creates every index this app's queries rely on, if not already present. `createIndex` is
 * idempotent (a no-op when an identical index already exists), so this is safe to run on every
 * deploy/refresh rather than requiring a one-time migration step.
 */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db
      .collection(SCHEMES_COLLECTION)
      .createIndex({ catalogueVersion: 1, category: 1 }, { name: "catalogueVersion_category" }),
    db
      .collection(SCHEMES_COLLECTION)
      .createIndex({ schemeName: "text", amc: "text" }, { name: "schemeName_amc_text" }),
    db.collection(CATALOGUE_META_COLLECTION).createIndex({ version: 1 }, { name: "version" }),
    db.collection(WATCHLISTS_COLLECTION).createIndex({ deviceId: 1 }, { name: "deviceId" }),
  ]);
}
