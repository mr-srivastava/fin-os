import * as v from "valibot";
import {
  WatchlistApiErrorSchema,
  WatchlistCreatedSchema,
  WatchlistDetailSchema,
  WatchlistListSchema,
} from "@/lib/watchlist-schemas";

export type WatchlistApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message: string; status: number };

async function request<T>(
  path: string,
  schema: v.GenericSchema<T>,
  init?: RequestInit,
): Promise<WatchlistApiResult<T>> {
  try {
    const response = await fetch(path, init);
    if (response.status === 204) {
      // No content responses (e.g. delete) parse as an empty success payload.
      const result = v.safeParse(schema, {}, { abortEarly: true });
      return result.success
        ? { ok: true, data: result.output }
        : { ok: true, data: undefined as T };
    }
    const payload: unknown = await response.json();
    const result = v.safeParse(schema, payload, { abortEarly: true });
    if (response.ok && result.success) return { ok: true, data: result.output };

    const error = v.safeParse(WatchlistApiErrorSchema, payload, { abortEarly: true });
    return {
      ok: false,
      error: error.success ? error.output.error : "invalid_response",
      message: error.success ? error.output.message : "The response was invalid.",
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      error: "network_error",
      message: "The request could not be completed.",
      status: 0,
    };
  }
}

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
  return request(`/api/watchlists/${encodeURIComponent(id)}`, v.object({}), {
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
