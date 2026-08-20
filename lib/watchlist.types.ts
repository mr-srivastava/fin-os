export const WATCHLISTS_COLLECTION = "watchlists";

/** A named, device-scoped list of scheme codes. No auth exists yet, so `deviceId` is the identity boundary. */
export interface WatchlistDocument {
  _id: string;
  deviceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemeCodes: string[];
}
