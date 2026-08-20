import * as v from "valibot";

export const WATCHLIST_NAME_MIN_LENGTH = 1;
export const WATCHLIST_NAME_MAX_LENGTH = 80;
/** Caps provider fan-out: a GET on a watchlist fetches research for every scheme code in it. */
export const WATCHLIST_MAX_ITEMS = 25;
export const WATCHLIST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shape of a POST/PATCH body carrying a watchlist name; the value itself is still checked with `isWatchlistName`. */
export const WatchlistNameBodySchema = v.object({ name: v.string() });

export function isWatchlistName(value: string): boolean {
  return value.length >= WATCHLIST_NAME_MIN_LENGTH && value.length <= WATCHLIST_NAME_MAX_LENGTH;
}

export function isWatchlistId(value: string): boolean {
  return WATCHLIST_ID_PATTERN.test(value);
}
