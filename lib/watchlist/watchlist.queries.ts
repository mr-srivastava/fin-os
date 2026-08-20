import { queryOptions } from "@tanstack/react-query";
import {
  listWatchlists,
  loadWatchlistDetail,
  type WatchlistApiResult,
} from "@/lib/watchlist/watchlist.client";

function dataOrThrow<T>(result: WatchlistApiResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.message);
}

export const watchlistsQueryOptions = queryOptions({
  queryKey: ["watchlists"] as const,
  queryFn: () => listWatchlists().then(dataOrThrow),
  staleTime: 60_000,
});

export const watchlistDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["watchlist", id] as const,
    queryFn: () => loadWatchlistDetail(id).then(dataOrThrow),
    enabled: Boolean(id),
  });
