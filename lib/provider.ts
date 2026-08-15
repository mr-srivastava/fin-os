import type { NavPoint } from "./fund-types.ts";
import { providerIsoDate, providerList, providerNumber, providerRecord } from "./provider-input.ts";

export class ProviderError extends Error {
  public status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export function toNav(value: unknown): NavPoint[] {
  return (providerList(value) ?? [])
    .flatMap((item) => {
      const source = providerRecord(item);
      const date = source && providerIsoDate(source.date ?? source.navDate);
      const nav = source && providerNumber(source.nav ?? source.value ?? source.navValue);
      return date && nav !== null && nav > 0 ? [{ date, nav }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
