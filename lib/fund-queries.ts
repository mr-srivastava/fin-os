import { queryOptions } from "@tanstack/react-query";
import { loadComparison, loadFundResearch, searchFunds, type ApiResult } from "@/lib/fund-api";

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

export const comparisonQueryOptions = (fund: string | undefined, against: string | undefined) =>
  queryOptions({
    queryKey: ["comparison", fund, against] as const,
    queryFn: ({ signal }) => loadComparison(fund!, against!, signal).then(dataOrThrow),
    enabled: Boolean(fund && against),
  });
