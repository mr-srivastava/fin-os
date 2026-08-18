import { assert, test, vi } from "vitest";
import type { WatchlistDocument } from "./watchlist-types.ts";

const docs: WatchlistDocument[] = [
  {
    _id: "list-1",
    deviceId: "device-a",
    name: "Client: Sharma family",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    schemeCodes: ["120564", "122639"],
  },
  {
    _id: "list-2",
    deviceId: "device-b",
    name: "Other device's list",
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    schemeCodes: [],
  },
];

function matches(doc: WatchlistDocument, filter: Record<string, unknown>) {
  return Object.entries(filter).every(([key, value]) => (doc as never)[key] === value);
}

vi.mock("./mongo.ts", () => ({
  getDb: async () => ({
    collection: () => ({
      find: (filter: Record<string, unknown>) => ({
        sort: () => ({
          toArray: async () => docs.filter((doc) => matches(doc, filter)),
        }),
      }),
      findOne: async (filter: Record<string, unknown>) =>
        docs.find((doc) => matches(doc, filter)) ?? null,
      insertOne: async (doc: WatchlistDocument) => {
        docs.push(doc);
        return { insertedId: doc._id };
      },
      findOneAndUpdate: async (
        filter: Record<string, unknown>,
        update: {
          $set?: Record<string, unknown>;
          $addToSet?: { schemeCodes: string };
          $pull?: { schemeCodes: string };
        },
      ) => {
        const doc = docs.find((candidate) => matches(candidate, filter));
        if (!doc) return null;
        if (update.$set) Object.assign(doc, update.$set);
        if (update.$addToSet && !doc.schemeCodes.includes(update.$addToSet.schemeCodes)) {
          doc.schemeCodes.push(update.$addToSet.schemeCodes);
        }
        if (update.$pull) {
          doc.schemeCodes = doc.schemeCodes.filter((code) => code !== update.$pull!.schemeCodes);
        }
        return doc;
      },
      deleteOne: async (filter: Record<string, unknown>) => {
        const index = docs.findIndex((doc) => matches(doc, filter));
        if (index === -1) return { deletedCount: 0 };
        docs.splice(index, 1);
        return { deletedCount: 1 };
      },
    }),
  }),
}));

const {
  listWatchlists,
  createWatchlist,
  getWatchlist,
  renameWatchlist,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} = await import("./watchlist-service.ts");

test("lists only the requesting device's watchlists", async () => {
  const lists = await listWatchlists("device-a");
  assert.deepEqual(
    lists.map((list) => list.id),
    ["list-1"],
  );
  assert.equal(lists[0]!.count, 2);
});

test("creates a watchlist scoped to the device", async () => {
  const created = await createWatchlist("device-a", "Conservative picks Q3");
  assert.equal(created.name, "Conservative picks Q3");
  assert.equal(created.count, 0);
  assert.ok(await getWatchlist("device-a", created.id));
});

test("does not leak another device's watchlist by id", async () => {
  assert.equal(await getWatchlist("device-a", "list-2"), null);
});

test("rename, add item, remove item, and delete are all device-scoped", async () => {
  assert.equal(await renameWatchlist("device-b", "list-1", "hijack"), null);

  const renamed = await renameWatchlist("device-a", "list-1", "Renamed list");
  assert.equal(renamed?.name, "Renamed list");

  assert.equal(await addWatchlistItem("device-b", "list-1", "999999"), null);
  const withItem = await addWatchlistItem("device-a", "list-1", "141925");
  assert.deepEqual(withItem?.schemeCodes, ["120564", "122639", "141925"]);

  const withoutItem = await removeWatchlistItem("device-a", "list-1", "141925");
  assert.deepEqual(withoutItem?.schemeCodes, ["120564", "122639"]);

  assert.equal(await deleteWatchlist("device-b", "list-1"), false);
  assert.equal(await deleteWatchlist("device-a", "list-1"), true);
  assert.equal(await getWatchlist("device-a", "list-1"), null);
});
