import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatIsoDate } from "@/lib/date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
