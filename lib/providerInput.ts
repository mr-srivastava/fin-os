import * as v from "valibot";
import { isIsoDate } from "./date.ts";

export type ProviderRecord = Record<string, unknown>;

const ProviderRecordSchema: v.GenericSchema<ProviderRecord> = v.looseObject({});
const ProviderListSchema: v.GenericSchema<unknown[]> = v.array(v.unknown());
const TextValueSchema = v.union([v.string(), v.number()]);

export function providerRecord(value: unknown): ProviderRecord | null {
  const result = v.safeParse(ProviderRecordSchema, value, { abortEarly: true });
  return result.success ? result.output : null;
}

export function providerList(value: unknown): unknown[] | null {
  const result = v.safeParse(ProviderListSchema, value, { abortEarly: true });
  return result.success ? result.output : null;
}

export function providerText(value: unknown): string | null {
  const result = v.safeParse(TextValueSchema, value, { abortEarly: true });
  if (!result.success) return null;
  const text = String(result.output).trim();
  return text || null;
}

export function providerNumber(value: unknown): number | null {
  const text = providerText(value);
  if (!text) return null;
  const number = Number(text.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(number) ? number : null;
}

export function providerIsoDate(value: unknown): string | null {
  const date = providerText(value);
  return date && isIsoDate(date) ? date : null;
}

export function providerBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}
