import * as v from "valibot";

export const WatchlistSummarySchema = v.object({
  id: v.string(),
  name: v.string(),
  count: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
});

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

export const WatchlistDetailSchema = v.object({
  watchlist: WatchlistSummarySchema,
  funds: v.array(WatchlistItemSummarySchema),
  unavailableSchemeCodes: v.array(v.string()),
});

export const WatchlistApiErrorSchema = v.object({
  error: v.string(),
  message: v.string(),
});
