import * as v from "valibot";
import { isIsoDate } from "../shared/date";

/**
 * Any value a JSON provider response can contain. Narrower than `unknown` — it rules out
 * functions, symbols, and other non-JSON JS values — while still requiring every provider
 * helper below to check shape before use, since none of the branches are assumed present.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ProviderRecord = Record<string, JsonValue>;

// SAFETY: `looseObject({})` accepts any object and passes its properties through unvalidated,
// which is exactly ProviderRecord's contract (an object of not-yet-parsed JSON values).
const ProviderRecordSchema = v.looseObject({}) as v.GenericSchema<ProviderRecord>;
const ProviderListSchema: v.GenericSchema<JsonValue[]> = v.array(
  v.unknown() as v.GenericSchema<JsonValue>,
);
const TextValueSchema = v.union([v.string(), v.number()]);

export function providerRecord(value: JsonValue): ProviderRecord | null {
  const result = v.safeParse(ProviderRecordSchema, value, { abortEarly: true });
  return result.success ? result.output : null;
}

export function providerList(value: JsonValue): JsonValue[] | null {
  const result = v.safeParse(ProviderListSchema, value, { abortEarly: true });
  return result.success ? result.output : null;
}

export function providerText(value: JsonValue): string | null {
  const result = v.safeParse(TextValueSchema, value, { abortEarly: true });
  if (!result.success) return null;
  const text = String(result.output).trim();
  return text || null;
}

export function providerNumber(value: JsonValue): number | null {
  const text = providerText(value);
  if (!text) return null;
  const number = Number(text.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(number) ? number : null;
}

export function providerIsoDate(value: JsonValue): string | null {
  const date = providerText(value);
  return date && isIsoDate(date) ? date : null;
}

export function providerBoolean(value: JsonValue): boolean | null {
  return typeof value === "boolean" ? value : null;
}
