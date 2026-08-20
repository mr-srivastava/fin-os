import * as v from "valibot";

/** Shape of a POST/PATCH body carrying a watchlist name; the value itself is still checked with `isWatchlistName`. */
export const WatchlistNameBodySchema = v.object({ name: v.string() });

export const WatchlistSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  count: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
});
export type WatchlistSummary = v.InferOutput<typeof WatchlistSummarySchema>;

export const WatchlistListSchema = v.object({ watchlists: v.array(WatchlistSummarySchema) });
export const WatchlistCreatedSchema = v.object({ watchlist: WatchlistSummarySchema });

export const WatchlistItemSummarySchema = v.object({
  schemeCode: v.string(),
  schemeName: v.string(),
  amc: v.string(),
  category: v.string(),
  riskLabel: v.nullable(v.string()),
  aum: v.nullable(v.number()),
  oneYearReturn: v.nullable(v.number()),
  threeYearReturn: v.nullable(v.number()),
  currentNav: v.nullable(v.number()),
});
export type WatchlistItemSummary = v.InferOutput<typeof WatchlistItemSummarySchema>;

export const WatchlistDetailSchema = v.object({
  watchlist: WatchlistSummarySchema,
  funds: v.array(WatchlistItemSummarySchema),
  unavailableSchemeCodes: v.array(v.string()),
});

export const WatchlistApiErrorSchema = v.object({
  error: v.string(),
  message: v.string(),
});

/** Response of DELETE /api/watchlists/:id, which returns no body. */
export const WatchlistDeletedSchema = v.object({});
