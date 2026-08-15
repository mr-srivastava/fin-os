import * as v from "valibot";
import { ApiErrorSchema, FundResearchSchema, SchemeSearchSchema } from "@/lib/fund-schemas";
import type { ApiErrorCode, FundResearch, Scheme } from "@/lib/fund-types";

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

export function loadFundResearch(schemeCode: string, signal?: AbortSignal) {
  return request<FundResearch>(
    `/api/funds/${encodeURIComponent(schemeCode)}`,
    FundResearchSchema,
    signal,
  );
}
