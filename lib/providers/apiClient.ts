/** Shared fetch-and-validate core for the app's `*.client.ts` modules. Each API domain has its
 * own response schemas and its own error contract, so callers supply an `errorSchema` and get
 * back a `request` function typed to that domain's error codes. */
import * as v from "valibot";

export type ApiResult<T, ErrorCode extends string> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: ErrorCode | "invalid_response" | "network_error";
      message: string;
      status: number;
    };

export function createApiClient<ErrorCode extends string>(
  errorSchema: v.GenericSchema<{ error: ErrorCode; message: string }>,
) {
  return async function request<T>(
    path: string,
    schema: v.GenericSchema<T>,
    init?: RequestInit,
  ): Promise<ApiResult<T, ErrorCode>> {
    try {
      const response = await fetch(path, init);
      // No-content responses (e.g. delete) parse as an empty success payload.
      const payload: unknown = response.status === 204 ? {} : await response.json();
      const result = v.safeParse(schema, payload, { abortEarly: true });
      if (response.ok && result.success) return { ok: true, data: result.output };

      const error = v.safeParse(errorSchema, payload, { abortEarly: true });
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
  };
}
