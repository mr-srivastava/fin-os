import * as v from "valibot";
import {
  ApiErrorSchema,
  CategorySchemeListSchema,
  ComparisonViewSchema,
  FundResearchViewSchema,
  SchemeSearchSchema,
} from "@/lib/fund-schemas";
import type { ApiErrorCode, Scheme } from "@/lib/fund-types";
import type { ComparisonView, FundResearchView } from "@/lib/research-view/types";

export type ClientApiErrorCode = ApiErrorCode | "invalid_response" | "network_error";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ClientApiErrorCode; message: string; status: number };

async function request<T>(
  path: string,
  schema: v.GenericSchema<T>,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, signal ? { signal } : {});
    const payload: unknown = await response.json();
    const result = v.safeParse(schema, payload, { abortEarly: true });
    if (response.ok && result.success) return { ok: true, data: result.output };

    const error = v.safeParse(ApiErrorSchema, payload, { abortEarly: true });
    return {
      ok: false,
      error: error.success ? error.output.error : "invalid_response",
      message: error.success ? error.output.message : "The response was invalid.",
      status: response.status,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      ok: false,
      error: "network_error",
      message: "The request could not be completed.",
      status: 0,
    };
  }
}

export function searchFunds(query: string, signal?: AbortSignal) {
  return request<{ schemes: Scheme[] }>(
    `/api/schemes?q=${encodeURIComponent(query)}`,
    SchemeSearchSchema,
    signal,
  );
}

export function loadCategoryFunds(category: string, signal?: AbortSignal) {
  return request<{ category: string; schemes: Scheme[] }>(
    `/api/explore?category=${encodeURIComponent(category)}`,
    CategorySchemeListSchema,
    signal,
  );
}

export function loadFundResearch(schemeCode: string, signal?: AbortSignal) {
  return request<FundResearchView>(
    `/api/funds/${encodeURIComponent(schemeCode)}`,
    FundResearchViewSchema,
    signal,
  );
}

export function loadComparison(fund: string, against: string, signal?: AbortSignal) {
  return request<ComparisonView>(
    `/api/compare?fund=${encodeURIComponent(fund)}&against=${encodeURIComponent(against)}`,
    ComparisonViewSchema,
    signal,
  );
}
