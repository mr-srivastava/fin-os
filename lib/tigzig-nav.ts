import type { NavPoint } from "./fund-types.ts";
import { isoDateYearsAgo } from "./date.ts";
import { providerIsoDate, providerList, providerNumber, providerRecord } from "./provider-input.ts";
import { ProviderError, toNav } from "./provider.ts";

const BASE_URL = "https://api.tigzig.com/mf/v1";
const MARKET_BASE_URL = "https://api.tigzig.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

export function normalizeTigzigNavPayload(payload: unknown): NavPoint[] | null {
  const envelope = providerRecord(payload);
  if (!envelope || !("data" in envelope)) return null;
  return toNav(envelope.data);
}

export async function getTigzigNav(schemeCode: string): Promise<NavPoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/nav?scheme=${encodeURIComponent(schemeCode)}&since=${navStartDate()}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    );
  } catch {
    throw new ProviderError("NAV data is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("NAV data is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve NAV data right now.", 502);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("NAV data could not be read right now.", 502);
  }
  const nav = normalizeTigzigNavPayload(payload);
  if (nav === null) throw new ProviderError("NAV data could not be read right now.", 502);
  return nav;
}

export function normalizeTigzigMarketSeriesPayload(
  payload: unknown,
  indicatorId: string,
): NavPoint[] | null {
  const envelope = providerRecord(payload);
  const rows = envelope && providerList(envelope.data);
  if (!rows) return null;
  return rows.flatMap((row) => {
    const point = providerRecord(row);
    const date = point && providerIsoDate(point.date);
    const nav = point && providerNumber(point[indicatorId]);
    return date && nav !== null && nav > 0 ? [{ date, nav }] : [];
  });
}

export async function getTigzigMarketSeries(indicatorId: string): Promise<NavPoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
      `${MARKET_BASE_URL}/series?ids=${encodeURIComponent(indicatorId)}&from=${navStartDate()}&format=json`,
      { next: { revalidate: 300 }, signal: controller.signal },
    );
  } catch {
    throw new ProviderError("Benchmark data is unavailable. Try again shortly.", 503);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new ProviderError("Benchmark data is busy. Try again in a moment.", 429);
    throw new ProviderError("We could not retrieve benchmark data right now.", 502);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ProviderError("Benchmark data could not be read right now.", 502);
  }
  const nav = normalizeTigzigMarketSeriesPayload(payload, indicatorId);
  if (nav === null) throw new ProviderError("Benchmark data could not be read right now.", 502);
  return nav;
}

function navStartDate() {
  return isoDateYearsAgo(5);
}
