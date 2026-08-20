import type { NavPoint } from "./fund.types.ts";
import { parseIsoDate } from "./date.ts";

const DAYS_IN_YEAR = 365.25;
export const DEFAULT_INITIAL_INVESTMENT = 10_000;

export type PerformanceRange = "6m" | "1y" | "3y" | "5y" | "max";

const RANGE_MONTHS: Record<Exclude<PerformanceRange, "max">, number> = {
  "6m": 6,
  "1y": 12,
  "3y": 36,
  "5y": 60,
};

function sorted(points: NavPoint[]) {
  return [...(points ?? [])].sort((a, b) => a.date.localeCompare(b.date));
}

function daysBetween(start: string, end: string) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  return startDate && endDate ? startDate.until(endDate, { largestUnit: "day" }).days : null;
}

export function annualizedReturn(points: NavPoint[], years: number) {
  const series = sorted(points);
  const end = series.at(-1);
  if (!end) return null;

  const endDate = parseIsoDate(end.date);
  if (!endDate) return null;
  const targetDate = endDate.subtract({ years }).toString();
  const start = series.find((point) => point.date >= targetDate);
  if (!start || start.nav <= 0) return null;

  const duration = daysBetween(start.date, end.date);
  if (duration === null || duration < years * DAYS_IN_YEAR * 0.9) return null;
  return (end.nav / start.nav) ** (DAYS_IN_YEAR / duration) - 1;
}

export function annualizedVolatility(points: NavPoint[]) {
  const series = sorted(points);
  const end = series.at(-1);
  if (!end) return null;
  const endDate = parseIsoDate(end.date);
  if (!endDate) return null;
  const startDate = endDate.subtract({ years: 1 }).toString();
  const window = series.filter((point) => point.date >= startDate);
  const returns = window.slice(1).flatMap((point, index) => {
    const previous = window[index];
    return previous ? [point.nav / previous.nav - 1] : [];
  });
  if (returns.length < 60) return null;
  const mean = returns.reduce((total, value) => total + value, 0) / returns.length;
  const variance =
    returns.reduce((total, value) => total + (value - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function maxDrawdown(points: NavPoint[]) {
  const series = sorted(points);
  const first = series[0];
  if (!first || series.length < 2) return null;
  let peak = first.nav;
  let maximum = 0;
  for (const point of series) {
    peak = Math.max(peak, point.nav);
    maximum = Math.min(maximum, point.nav / peak - 1);
  }
  return maximum;
}

export interface HistoricalComparison {
  current: number;
  historicalAverage: number;
  direction: "above" | "below" | "near";
}

/** Values within this relative distance of each other are reported as "near" rather than forced above/below. */
const NEAR_THRESHOLD = 0.1;

function compareToHistorical(current: number, historicalAverage: number): HistoricalComparison {
  if (historicalAverage === 0) {
    return { current, historicalAverage, direction: current === 0 ? "near" : "above" };
  }
  const relativeDiff = (current - historicalAverage) / Math.abs(historicalAverage);
  const direction =
    Math.abs(relativeDiff) <= NEAR_THRESHOLD ? "near" : relativeDiff > 0 ? "above" : "below";
  return { current, historicalAverage, direction };
}

/**
 * Compares a fund's current (trailing 1-year) volatility to the average of its own
 * volatility over each of the preceding `years` 1-year periods. Descriptive only —
 * says where the current value sits relative to the fund's own history, not whether
 * that is good or bad.
 */
export function volatilityVsHistory(points: NavPoint[], years = 3): HistoricalComparison | null {
  const series = sorted(points);
  const end = series.at(-1);
  if (!end) return null;
  const endDate = parseIsoDate(end.date);
  if (!endDate) return null;

  const current = annualizedVolatility(series);
  if (current === null) return null;

  const samples: number[] = [];
  for (let yearsAgo = 1; yearsAgo <= years; yearsAgo += 1) {
    const windowEnd = endDate.subtract({ years: yearsAgo }).toString();
    const window = series.filter((point) => point.date <= windowEnd);
    const value = annualizedVolatility(window);
    if (value !== null) samples.push(value);
  }
  if (samples.length === 0) return null;

  const historicalAverage = samples.reduce((total, value) => total + value, 0) / samples.length;
  return compareToHistorical(current, historicalAverage);
}

/**
 * Compares a fund's most recent 1-year drawdown to its deepest drawdown over the
 * full available history. Direction is based on drawdown *severity* (magnitude of
 * decline), so "above" means a deeper drawdown, matching the intuitive reading of
 * `volatilityVsHistory`. `current`/`historicalAverage` remain the actual signed
 * drawdown values for display. Descriptive only, see `volatilityVsHistory`.
 */
export function drawdownVsHistory(points: NavPoint[]): HistoricalComparison | null {
  const series = sorted(points);
  if (series.length < 3) return null;
  const end = series.at(-1);
  if (!end) return null;
  const endDate = parseIsoDate(end.date);
  if (!endDate) return null;

  const startDate = endDate.subtract({ years: 1 }).toString();
  const recentWindow = series.filter((point) => point.date >= startDate);
  const current = maxDrawdown(recentWindow);
  const historicalAverage = maxDrawdown(series);
  if (current === null || historicalAverage === null) return null;

  const severityComparison = compareToHistorical(Math.abs(current), Math.abs(historicalAverage));
  return { current, historicalAverage, direction: severityComparison.direction };
}

/** Renders a `HistoricalComparison` as a short, descriptive sentence fragment. */
export function historicalContextText(comparison: HistoricalComparison | null): string | undefined {
  if (!comparison) return undefined;
  switch (comparison.direction) {
    case "above":
      return "above this fund's own history";
    case "below":
      return "below this fund's own history";
    case "near":
      return "in line with this fund's own history";
  }
}

export function normalizeSeries(points: NavPoint[]) {
  const series = sorted(points);
  const first = series[0];
  if (!first || first.nav <= 0) return [];
  return series.map((point) => ({ date: point.date, value: (point.nav / first.nav) * 100 }));
}

export function relativeReturnSeries(points: NavPoint[]) {
  const series = sorted(points);
  const first = series[0];
  if (!first || first.nav <= 0) return [];
  return series.map((point) => ({ date: point.date, value: (point.nav / first.nav - 1) * 100 }));
}

export function filterSeriesByRange(points: NavPoint[], range: PerformanceRange) {
  const series = sorted(points);
  const end = series.at(-1);
  if (!end || range === "max") return series;

  const endDate = parseIsoDate(end.date);
  if (!endDate) return [];
  const startDate = endDate.subtract({ months: RANGE_MONTHS[range] }).toString();
  return series.filter((point) => point.date >= startDate);
}

export function investmentOutcome(
  points: NavPoint[],
  initialInvestment = DEFAULT_INITIAL_INVESTMENT,
) {
  const series = sorted(points);
  const first = series[0];
  const last = series.at(-1);
  if (!first || !last || first.nav <= 0) return null;

  const multiple = last.nav / first.nav;
  return { value: initialInvestment * multiple, returnPercent: multiple - 1 };
}

export function investmentValueFromReturn(
  returnPercent: number,
  initialInvestment = DEFAULT_INITIAL_INVESTMENT,
) {
  return initialInvestment * (1 + returnPercent);
}

export function sampleSeries(points: NavPoint[], maximum = 90) {
  if (points.length <= maximum) return points;
  const step = Math.ceil(points.length / maximum);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}
