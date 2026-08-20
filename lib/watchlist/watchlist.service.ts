/** Mongo-backed CRUD for device-scoped watchlists. Every read/write is scoped by `deviceId` -
 * there is no auth, so a request for a watchlist id that belongs to a different device must
 * behave exactly like the id does not exist. */
import { randomUUID } from "node:crypto";
import { getDb } from "../providers/mongo";
import { WATCHLIST_MAX_ITEMS } from "./watchlistInput";
import { WATCHLISTS_COLLECTION, type WatchlistDocument } from "./watchlist.types";
import type { WatchlistSummary } from "./watchlist.schema";

export const WATCHLIST_ITEM_LIMIT_REACHED = "watchlist_item_limit_reached" as const;

function toSummary(doc: WatchlistDocument): WatchlistSummary {
  return {
    id: doc._id,
    name: doc.name,
    count: doc.schemeCodes.length,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function collection() {
  const db = await getDb();
  return db.collection<WatchlistDocument>(WATCHLISTS_COLLECTION);
}

export async function listWatchlists(deviceId: string): Promise<WatchlistSummary[]> {
  const col = await collection();
  const docs = await col.find({ deviceId }).sort({ createdAt: 1 }).toArray();
  return docs.map(toSummary);
}

export async function createWatchlist(deviceId: string, name: string): Promise<WatchlistSummary> {
  const now = new Date().toISOString();
  const doc: WatchlistDocument = {
    _id: randomUUID(),
    deviceId,
    name,
    createdAt: now,
    updatedAt: now,
    schemeCodes: [],
  };
  const col = await collection();
  await col.insertOne(doc);
  return toSummary(doc);
}

/** Returns the raw document (including `schemeCodes`) only when it belongs to `deviceId`. */
export async function getWatchlist(
  deviceId: string,
  id: string,
): Promise<WatchlistDocument | null> {
  const col = await collection();
  return col.findOne({ _id: id, deviceId });
}

export async function renameWatchlist(
  deviceId: string,
  id: string,
  name: string,
): Promise<WatchlistSummary | null> {
  const col = await collection();
  const updatedAt = new Date().toISOString();
  const result = await col.findOneAndUpdate(
    { _id: id, deviceId },
    { $set: { name, updatedAt } },
    { returnDocument: "after" },
  );
  return result ? toSummary(result) : null;
}

export async function deleteWatchlist(deviceId: string, id: string): Promise<boolean> {
  const col = await collection();
  const { deletedCount } = await col.deleteOne({ _id: id, deviceId });
  return deletedCount === 1;
}

/**
 * Adds `schemeCode` unless doing so would push the watchlist past `WATCHLIST_MAX_ITEMS` -
 * a cap on provider fan-out, since every item in a watchlist is fetched on every read.
 * Returns `WATCHLIST_ITEM_LIMIT_REACHED` when the watchlist exists but is already full
 * (and doesn't already contain `schemeCode`), or `null` when it doesn't belong to `deviceId`.
 */
export async function addWatchlistItem(
  deviceId: string,
  id: string,
  schemeCode: string,
): Promise<WatchlistDocument | null | typeof WATCHLIST_ITEM_LIMIT_REACHED> {
  const col = await collection();
  const updatedAt = new Date().toISOString();
  const updated = await col.findOneAndUpdate(
    {
      _id: id,
      deviceId,
      $expr: {
        $or: [
          { $in: [schemeCode, "$schemeCodes"] },
          { $lt: [{ $size: "$schemeCodes" }, WATCHLIST_MAX_ITEMS] },
        ],
      },
    },
    { $addToSet: { schemeCodes: schemeCode }, $set: { updatedAt } },
    { returnDocument: "after" },
  );
  if (updated) return updated;
  const existing = await col.findOne({ _id: id, deviceId });
  return existing ? WATCHLIST_ITEM_LIMIT_REACHED : null;
}

export async function removeWatchlistItem(
  deviceId: string,
  id: string,
  schemeCode: string,
): Promise<WatchlistDocument | null> {
  const col = await collection();
  const updatedAt = new Date().toISOString();
  return col.findOneAndUpdate(
    { _id: id, deviceId },
    { $pull: { schemeCodes: schemeCode }, $set: { updatedAt } },
    { returnDocument: "after" },
  );
}

export const watchlistService = {
  list: listWatchlists,
  create: createWatchlist,
  get: getWatchlist,
  rename: renameWatchlist,
  remove: deleteWatchlist,
  addItem: addWatchlistItem,
  removeItem: removeWatchlistItem,
};
