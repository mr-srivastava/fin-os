import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatIsoDate } from "@/lib/shared/date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type-safe lookup into a dictionary whose value type is known but whose keys are an open
 * set at the call site (e.g. a provider-supplied label). Returns `undefined` for keys the
 * dictionary doesn't have instead of widening the dictionary's own type to an index signature.
 */
export function lookup<K extends string, V>(dictionary: Record<K, V>, key: string): V | undefined {
  return Object.hasOwn(dictionary, key)
    ? // SAFETY: `Object.hasOwn` just confirmed `key` names an own property of `dictionary`.
      dictionary[key as K]
    : undefined;
}

export type MetricStatus = "gain" | "loss" | "neutral";

export function statusColorClass(status: MetricStatus) {
  if (status === "loss") return "text-negative";
  if (status === "gain") return "text-positive";
  return "text-foreground";
}

const indianNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const indianPercent = new Intl.NumberFormat("en-IN", {
  style: "percent",
  maximumFractionDigits: 1,
});
const indianRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const compactDateOptions = {
  month: "short",
  year: "2-digit",
} as const;
const fullDateOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
} as const;

export function formatNumber(value: number | null, suffix = "") {
  return value === null ? "—" : `${indianNumber.format(value)}${suffix}`;
}

export function formatPercent(value: number | null) {
  return value === null ? "—" : indianPercent.format(value);
}

export function formatSignedPercent(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${indianPercent.format(value)}`;
}

export function formatRupees(value: number | null) {
  return value === null ? "—" : indianRupees.format(value);
}

export function formatCompactDate(value: string) {
  return formatIsoDate(value, compactDateOptions);
}

export function formatFullDate(value: string) {
  return formatIsoDate(value, fullDateOptions);
}
