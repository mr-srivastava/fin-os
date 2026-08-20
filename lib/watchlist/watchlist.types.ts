import * as v from "valibot";

export const WATCHLISTS_COLLECTION = "watchlists";

/** A named, device-scoped list of scheme codes. No auth exists yet, so `deviceId` is the identity boundary. */
export const WatchlistDocumentSchema = v.object({
  _id: v.string(),
  deviceId: v.string(),
  name: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  schemeCodes: v.array(v.string()),
});
export type WatchlistDocument = v.InferOutput<typeof WatchlistDocumentSchema>;
