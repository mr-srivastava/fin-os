import { Temporal } from "@js-temporal/polyfill";
import type { NavPoint } from "../fund/fund.types";
import { parseIsoDate } from "./date";

const DAYS_IN_YEAR = 365.25;
export const DEFAULT_INITIAL_INVESTMENT = 10_000;

export type PerformanceRange = "6m" | "1y" | "3y" | "5y" | "max";

const RANGE_MONTHS = {
  "6m": 6,
  "1y": 12,
  "3y": 36,
  "5y": 60,
} satisfies Record<Exclude<PerformanceRange, "max">, number>;

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

export interface AlignedReturn {
  date: string;
  fundReturn: number;
  benchmarkReturn: number;
}

/**
 * Pairs fund and benchmark NAV on shared dates, then returns the day-over-day
 * return at each shared date relative to the previous shared date. Dates where
 * either series is missing a point are dropped rather than interpolated, so
 * downstream calculations only see returns both series actually recorded.
 */
export function alignedReturns(fundNav: NavPoint[], benchmarkNav: NavPoint[]): AlignedReturn[] {
  const benchmarkByDate = new Map(sorted(benchmarkNav).map((point) => [point.date, point.nav]));
  const shared = sorted(fundNav)
    .filter((point) => benchmarkByDate.has(point.date))
    .map((point) => ({
      date: point.date,
      fundNav: point.nav,
      benchmarkNav: benchmarkByDate.get(point.date)!,
    }));

  return shared.slice(1).flatMap((point, index) => {
    const previous = shared[index];
    if (!previous || previous.fundNav <= 0 || previous.benchmarkNav <= 0) return [];
    return [
      {
        date: point.date,
        fundReturn: point.fundNav / previous.fundNav - 1,
        benchmarkReturn: point.benchmarkNav / previous.benchmarkNav - 1,
      },
    ];
  });
}

/** Fund's annualized return minus the benchmark's, over the same trailing window. Null if either leg is unavailable. */
export function excessReturn(fundNav: NavPoint[], benchmarkNav: NavPoint[], years: number) {
  const fund = annualizedReturn(fundNav, years);
  const benchmark = annualizedReturn(benchmarkNav, years);
  if (fund === null || benchmark === null) return null;
  return fund - benchmark;
}

const MIN_ALIGNED_OBSERVATIONS = 60;

/** Annualized standard deviation of trailing-1-year daily return differences (fund minus benchmark). */
export function trackingError(fundNav: NavPoint[], benchmarkNav: NavPoint[]) {
  const end = sorted(fundNav).at(-1);
  if (!end) return null;
  const endDate = parseIsoDate(end.date);
  if (!endDate) return null;
  const startDate = endDate.subtract({ years: 1 }).toString();
  const diffs = alignedReturns(fundNav, benchmarkNav)
    .filter((point) => point.date >= startDate)
    .map((point) => point.fundReturn - point.benchmarkReturn);
  if (diffs.length < MIN_ALIGNED_OBSERVATIONS) return null;
  const mean = diffs.reduce((total, value) => total + value, 0) / diffs.length;
  const variance =
    diffs.reduce((total, value) => total + (value - mean) ** 2, 0) / (diffs.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

/** Trailing-1-year excess return divided by trailing-1-year tracking error. Null if either input is unavailable. */
export function informationRatio(fundNav: NavPoint[], benchmarkNav: NavPoint[]) {
  const excess = excessReturn(fundNav, benchmarkNav, 1);
  const error = trackingError(fundNav, benchmarkNav);
  if (excess === null || error === null || error === 0) return null;
  return excess / error;
}

export interface CaptureRatios {
  upside: number | null;
  downside: number | null;
}

function compound(returns: number[]) {
  return returns.reduce((total, value) => total * (1 + value), 1) - 1;
}

/**
 * Compounded fund return divided by compounded benchmark return, restricted to days the
 * benchmark rose (upside) or fell (downside), expressed as a percentage. 100 means the fund
 * matched the benchmark's move on those days; above/below 100 says nothing about which is
 * preferable on its own — that depends on whether the leg is upside or downside.
 */
export function captureRatios(fundNav: NavPoint[], benchmarkNav: NavPoint[]): CaptureRatios {
  const aligned = alignedReturns(fundNav, benchmarkNav);
  if (aligned.length < MIN_ALIGNED_OBSERVATIONS) return { upside: null, downside: null };
  const upside = aligned.filter((point) => point.benchmarkReturn > 0);
  const downside = aligned.filter((point) => point.benchmarkReturn < 0);
  const ratio = (points: AlignedReturn[]) => {
    if (points.length === 0) return null;
    const benchmarkCompound = compound(points.map((point) => point.benchmarkReturn));
    if (benchmarkCompound === 0) return null;
    return (compound(points.map((point) => point.fundReturn)) / benchmarkCompound) * 100;
  };
  return { upside: ratio(upside), downside: ratio(downside) };
}

export interface RollingHitRate {
  /** Fraction of rolling windows where the fund's annualized return exceeded the benchmark's. */
  hitRate: number;
  windowCount: number;
}

/**
 * Steps a trailing `windowYears` annualized-return comparison across the fund's history every
 * six months and reports how often the fund beat the benchmark. Requires at least 4 complete
 * windows so a single lucky/unlucky period can't dominate the figure.
 */
export function rollingHitRate(
  fundNav: NavPoint[],
  benchmarkNav: NavPoint[],
  windowYears = 3,
): RollingHitRate | null {
  const fundSeries = sorted(fundNav);
  const end = fundSeries.at(-1);
  const start = fundSeries[0];
  if (!end || !start) return null;
  const endDate = parseIsoDate(end.date);
  const startDate = parseIsoDate(start.date);
  if (!endDate || !startDate) return null;

  let cursor = startDate.add({ years: windowYears });
  let hits = 0;
  let windows = 0;
  while (Temporal.PlainDate.compare(cursor, endDate) <= 0) {
    const cursorText = cursor.toString();
    const fundWindow = fundSeries.filter((point) => point.date <= cursorText);
    const benchmarkWindow = sorted(benchmarkNav).filter((point) => point.date <= cursorText);
    const fundValue = annualizedReturn(fundWindow, windowYears);
    const benchmarkValue = annualizedReturn(benchmarkWindow, windowYears);
    if (fundValue !== null && benchmarkValue !== null) {
      windows += 1;
      if (fundValue > benchmarkValue) hits += 1;
    }
    cursor = cursor.add({ months: 6 });
  }
  if (windows < 4) return null;
  return { hitRate: hits / windows, windowCount: windows };
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
