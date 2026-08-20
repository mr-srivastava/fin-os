import { createApiClient, type ApiResult as SharedApiResult } from "@/lib/providers/apiClient";
import {
  ApiErrorSchema,
  CategorySchemeListSchema,
  ComparisonViewSchema,
  FundResearchViewSchema,
  RelatedSnapshotsSchema,
  SchemeSearchSchema,
  type ApiErrorCode,
  type ComparisonView,
  type FundResearchView,
  type RelatedFund,
  type RelatedSnapshot,
  type Scheme,
} from "@/lib/fund/fund.schema";

export type ClientApiErrorCode = ApiErrorCode | "invalid_response" | "network_error";
export type ApiResult<T> = SharedApiResult<T, ApiErrorCode>;

const request = createApiClient(ApiErrorSchema);

export function searchFunds(query: string, signal?: AbortSignal) {
  return request<{ schemes: Scheme[] }>(
    `/api/schemes?q=${encodeURIComponent(query)}`,
    SchemeSearchSchema,
    signal ? { signal } : undefined,
  );
}

export function loadCategoryFunds(category: string, signal?: AbortSignal) {
  return request<{ category: string; schemes: RelatedFund[] }>(
    `/api/explore?category=${encodeURIComponent(category)}`,
    CategorySchemeListSchema,
    signal ? { signal } : undefined,
  );
}

export function loadFundResearch(schemeCode: string, signal?: AbortSignal) {
  return request<FundResearchView>(
    `/api/funds/${encodeURIComponent(schemeCode)}`,
    FundResearchViewSchema,
    signal ? { signal } : undefined,
  );
}

export function loadRelatedFundSnapshots(schemeCodes: readonly string[], signal?: AbortSignal) {
  return request<{ snapshots: Record<string, RelatedSnapshot> }>(
    `/api/funds/related-snapshots?codes=${schemeCodes.map(encodeURIComponent).join(",")}`,
    RelatedSnapshotsSchema,
    signal ? { signal } : undefined,
  );
}

export function loadComparison(fund: string, against: string, signal?: AbortSignal) {
  return request<ComparisonView>(
    `/api/compare?fund=${encodeURIComponent(fund)}&against=${encodeURIComponent(against)}`,
    ComparisonViewSchema,
    signal ? { signal } : undefined,
  );
}
