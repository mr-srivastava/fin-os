import { queryOptions } from "@tanstack/react-query";
import {
  loadCategoryFunds,
  loadComparison,
  loadFundResearch,
  loadRelatedFundSnapshots,
  searchFunds,
  type ApiResult,
} from "@/lib/fund.client";

function dataOrThrow<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.message);
}

export const fundQueryOptions = (schemeCode: string) =>
  queryOptions({
    queryKey: ["fund", schemeCode] as const,
    queryFn: ({ signal }) => loadFundResearch(schemeCode, signal).then(dataOrThrow),
    enabled: Boolean(schemeCode),
  });

export const schemeSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["scheme-search", query] as const,
    queryFn: ({ signal }) => searchFunds(query, signal).then(dataOrThrow),
    enabled: query.length >= 2,
  });

export const categoryFundsQueryOptions = (category: string | null) =>
  queryOptions({
    queryKey: ["category-funds", category] as const,
    queryFn: ({ signal }) => loadCategoryFunds(category!, signal).then(dataOrThrow),
    enabled: Boolean(category),
  });

export const relatedSnapshotsQueryOptions = (schemeCodes: readonly string[]) =>
  queryOptions({
    queryKey: ["related-snapshots", ...schemeCodes] as const,
    queryFn: ({ signal }) => loadRelatedFundSnapshots(schemeCodes, signal).then(dataOrThrow),
    enabled: schemeCodes.length > 0,
  });

export const comparisonQueryOptions = (fund: string | undefined, against: string | undefined) =>
  queryOptions({
    queryKey: ["comparison", fund, against] as const,
    queryFn: ({ signal }) => loadComparison(fund!, against!, signal).then(dataOrThrow),
    enabled: Boolean(fund && against),
  });
