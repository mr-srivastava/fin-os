import type { NavPoint } from "./fund-types.ts";
import { ProviderError } from "./provider.ts";
import { providerIsoDate, providerList, providerNumber, providerRecord } from "./provider-input.ts";

const BASE_URL = "https://finapi.upvaly.com/api";
const REQUEST_TIMEOUT_MS = 10_000;

export function normalizeFinapiTriPayload(payload: unknown): NavPoint[] | null {
  const envelope = providerRecord(payload);
  const rows = envelope && providerList(envelope.data);
  if (!rows) return null;
  return rows
    .flatMap((row) => {
      const source = providerRecord(row);
      const date = source && providerIsoDate(source.priceDate);
      const nav = source && providerNumber(source.triValue);
      return date && nav !== null && nav > 0 ? [{ date, nav }] : [];
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function getFinapiTri(indexName: string): Promise<NavPoint[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/nifty-indices?indexName=${encodeURIComponent(indexName)}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
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
  try {
    const nav = normalizeFinapiTriPayload(await response.json());
    if (!nav) throw new Error("invalid payload");
    return nav;
  } catch {
    throw new ProviderError("Benchmark data could not be read right now.", 502);
  }
}
