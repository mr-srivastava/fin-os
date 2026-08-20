export const WATCHLIST_NAME_MIN_LENGTH = 1;
export const WATCHLIST_NAME_MAX_LENGTH = 80;
export const WATCHLIST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isWatchlistName(value: string): boolean {
  return value.length >= WATCHLIST_NAME_MIN_LENGTH && value.length <= WATCHLIST_NAME_MAX_LENGTH;
}

export function isWatchlistId(value: string): boolean {
  return WATCHLIST_ID_PATTERN.test(value);
}
