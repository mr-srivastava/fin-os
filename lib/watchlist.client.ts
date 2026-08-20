import { createApiClient, type ApiResult } from "@/lib/apiClient";
import {
  WatchlistApiErrorSchema,
  WatchlistCreatedSchema,
  WatchlistDeletedSchema,
  WatchlistDetailSchema,
  WatchlistListSchema,
} from "@/lib/watchlist.schema";

export type WatchlistApiResult<T> = ApiResult<T, string>;

const request = createApiClient(WatchlistApiErrorSchema);

export function listWatchlists() {
  return request("/api/watchlists", WatchlistListSchema);
}

export function createWatchlist(name: string) {
  return request("/api/watchlists", WatchlistCreatedSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function renameWatchlist(id: string, name: string) {
  return request(`/api/watchlists/${encodeURIComponent(id)}`, WatchlistCreatedSchema, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteWatchlist(id: string) {
  return request(`/api/watchlists/${encodeURIComponent(id)}`, WatchlistDeletedSchema, {
    method: "DELETE",
  });
}

export function loadWatchlistDetail(id: string) {
  return request(`/api/watchlists/${encodeURIComponent(id)}`, WatchlistDetailSchema);
}

export function addWatchlistItem(id: string, schemeCode: string) {
  return request(`/api/watchlists/${encodeURIComponent(id)}/items`, WatchlistCreatedSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schemeCode }),
  });
}

export function removeWatchlistItem(id: string, schemeCode: string) {
  return request(
    `/api/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(schemeCode)}`,
    WatchlistCreatedSchema,
    { method: "DELETE" },
  );
}
