import { assert, test } from "vitest";
import {
  alignedReturns,
  annualizedReturn,
  annualizedVolatility,
  captureRatios,
  drawdownVsHistory,
  excessReturn,
  filterSeriesByRange,
  informationRatio,
  investmentOutcome,
  investmentValueFromReturn,
  maxDrawdown,
  normalizeSeries,
  relativeReturnSeries,
  rollingHitRate,
  trackingError,
  volatilityVsHistory,
} from "./analytics";
import { parseIsoDate } from "./date";

const monthly = [
  { date: "2020-01-01", nav: 100 },
  { date: "2021-01-01", nav: 110 },
  { date: "2022-01-01", nav: 121 },
  { date: "2023-01-01", nav: 133.1 },
  { date: "2024-01-01", nav: 146.41 },
  { date: "2025-01-01", nav: 161.051 },
];

test("calculates annualized returns from NAV points", () => {
  const result = annualizedReturn(monthly, 3);
  assert.ok(result !== null);
  assert.ok(Math.abs(result - 0.1) < 0.002);
});

test("does not invent a return when history is too short", () => {
  assert.equal(annualizedReturn(monthly.slice(-2), 3), null);
});

test("finds the deepest peak-to-trough drawdown", () => {
  const drawdown = maxDrawdown([
    { date: "2024-01-01", nav: 100 },
    { date: "2024-01-02", nav: 80 },
    { date: "2024-01-03", nav: 90 },
    { date: "2024-01-04", nav: 70 },
  ]);
  assert.ok(drawdown !== null);
  assert.ok(Math.abs(drawdown + 0.3) < Number.EPSILON);
});

test("normalizes a NAV series to 100", () => {
  assert.deepEqual(
    normalizeSeries([
      { date: "2024-01-01", nav: 20 },
      { date: "2024-01-02", nav: 25 },
    ]),
    [
      { date: "2024-01-01", value: 100 },
      { date: "2024-01-02", value: 125 },
    ],
  );
});

test("expresses a NAV series as returns from the selected-period start", () => {
  assert.deepEqual(
    relativeReturnSeries([
      { date: "2024-01-01", nav: 20 },
      { date: "2024-01-02", nav: 25 },
    ]),
    [
      { date: "2024-01-01", value: 0 },
      { date: "2024-01-02", value: 25 },
    ],
  );
});

test("filters a series to the requested trailing period", () => {
  assert.deepEqual(filterSeriesByRange(monthly, "1y"), [
    { date: "2024-01-01", nav: 146.41 },
    { date: "2025-01-01", nav: 161.051 },
  ]);
});

test("uses calendar arithmetic for leap-day trailing periods", () => {
  assert.deepEqual(
    filterSeriesByRange(
      [
        { date: "2023-02-28", nav: 100 },
        { date: "2024-02-29", nav: 110 },
      ],
      "1y",
    ),
    [
      { date: "2023-02-28", nav: 100 },
      { date: "2024-02-29", nav: 110 },
    ],
  );
});

test("calculates a hypothetical investment outcome", () => {
  assert.deepEqual(
    investmentOutcome([
      { date: "2024-01-01", nav: 20 },
      { date: "2024-01-02", nav: 25 },
    ]),
    {
      value: 12_500,
      returnPercent: 0.25,
    },
  );
});

test("converts a return into the current value of the initial investment", () => {
  assert.equal(investmentValueFromReturn(0), 10_000);
  assert.equal(investmentValueFromReturn(0.25), 12_500);
  assert.equal(investmentValueFromReturn(-0.1), 9_000);
});

test("requires a meaningful daily return sample for volatility", () => {
  assert.equal(annualizedVolatility(monthly), null);
});

/** Generates a daily NAV series with a per-year daily-return standard deviation. */
function dailySeries(startDate: string, days: number, dailyStdDevByYear: number[]) {
  const start = parseIsoDate(startDate);
  if (!start) throw new Error("invalid start date");
  let nav = 100;
  const points = [{ date: start.toString(), nav }];
  for (let day = 1; day < days; day += 1) {
    const yearIndex = Math.floor(day / 252);
    const stdDev = dailyStdDevByYear[Math.min(yearIndex, dailyStdDevByYear.length - 1)] ?? 0;
    // Deterministic alternating +/- swing sized by the target std dev, not random noise.
    const move = day % 2 === 0 ? stdDev : -stdDev;
    nav *= 1 + move;
    points.push({ date: start.add({ days: day }).toString(), nav });
  }
  return points;
}

test("volatilityVsHistory returns null when history is too short", () => {
  assert.equal(volatilityVsHistory(monthly), null);
});

test("reports volatility as near its own history when the daily swing is unchanged", () => {
  const series = dailySeries("2020-01-01", 252 * 4, [0.01, 0.01, 0.01, 0.01]);
  const result = volatilityVsHistory(series);
  assert.ok(result !== null);
  assert.equal(result.direction, "near");
});

test("reports volatility as above its own history when the recent year swings more", () => {
  const series = dailySeries("2020-01-01", 252 * 4, [0.005, 0.005, 0.005, 0.03]);
  const result = volatilityVsHistory(series);
  assert.ok(result !== null);
  assert.equal(result.direction, "above");
});

test("reports volatility as below its own history when the recent year swings less", () => {
  const series = dailySeries("2020-01-01", 252 * 4, [0.03, 0.03, 0.03, 0.005]);
  const result = volatilityVsHistory(series);
  assert.ok(result !== null);
  assert.equal(result.direction, "below");
});

test("drawdownVsHistory returns null when history is too short", () => {
  assert.equal(drawdownVsHistory(monthly.slice(-2)), null);
});

test("reports the recent drawdown as shallower than a deeper historical drawdown", () => {
  const series = [
    { date: "2020-01-01", nav: 100 },
    { date: "2020-06-01", nav: 60 }, // a deep historical crash
    { date: "2020-12-01", nav: 100 },
    { date: "2024-06-01", nav: 105 },
    { date: "2024-12-01", nav: 100 }, // a shallow recent dip
    { date: "2025-01-01", nav: 103 },
  ];
  const result = drawdownVsHistory(series);
  assert.ok(result !== null);
  assert.equal(result.direction, "below");
});

/**
 * Generates fund/benchmark NAV series sharing every date, where each day the fund moves
 * `fundMultiplier` times the benchmark's daily swing. Deterministic alternating +/- moves,
 * like `dailySeries` above, not random noise.
 */
function pairedDailySeries(
  startDate: string,
  days: number,
  benchmarkDailyMove: number,
  fundMultiplier: number,
) {
  const start = parseIsoDate(startDate);
  if (!start) throw new Error("invalid start date");
  let fundNav = 100;
  let benchmarkNav = 100;
  const fund = [{ date: start.toString(), nav: fundNav }];
  const benchmark = [{ date: start.toString(), nav: benchmarkNav }];
  for (let day = 1; day < days; day += 1) {
    const move = day % 2 === 0 ? benchmarkDailyMove : -benchmarkDailyMove;
    benchmarkNav *= 1 + move;
    fundNav *= 1 + move * fundMultiplier;
    const date = start.add({ days: day }).toString();
    fund.push({ date, nav: fundNav });
    benchmark.push({ date, nav: benchmarkNav });
  }
  return { fund, benchmark };
}

test("alignedReturns drops dates the benchmark series doesn't share", () => {
  const fund = [
    { date: "2024-01-01", nav: 100 },
    { date: "2024-01-02", nav: 101 },
    { date: "2024-01-03", nav: 102 },
  ];
  const benchmark = [
    { date: "2024-01-01", nav: 200 },
    { date: "2024-01-03", nav: 204 },
  ];
  const result = alignedReturns(fund, benchmark);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.date, "2024-01-03");
});

test("excessReturn is null when the benchmark leg is unavailable", () => {
  assert.equal(excessReturn(monthly, [], 3), null);
});

/** Generates a NAV series that compounds by the same daily return every day (no alternation, so trend is unambiguous). */
function trendingDailySeries(startDate: string, days: number, dailyReturn: number) {
  const start = parseIsoDate(startDate);
  if (!start) throw new Error("invalid start date");
  let nav = 100;
  const points = [{ date: start.toString(), nav }];
  for (let day = 1; day < days; day += 1) {
    nav *= 1 + dailyReturn;
    points.push({ date: start.add({ days: day }).toString(), nav });
  }
  return points;
}

test("excessReturn is positive when the fund outpaces the benchmark", () => {
  const fund = trendingDailySeries("2020-01-01", 366 * 3, 0.0004);
  const benchmark = trendingDailySeries("2020-01-01", 366 * 3, 0.0002);
  const excess = excessReturn(fund, benchmark, 3);
  assert.ok(excess !== null && excess > 0);
});

test("trackingError is null with less than a year of aligned observations", () => {
  assert.equal(trackingError(monthly, monthly), null);
});

test("trackingError is near zero when the fund tracks the benchmark exactly", () => {
  const { fund, benchmark } = pairedDailySeries("2024-01-01", 252, 0.01, 1);
  const error = trackingError(fund, benchmark);
  assert.ok(error !== null && error < 0.001);
});

test("trackingError is positive when the fund diverges from the benchmark", () => {
  const { fund, benchmark } = pairedDailySeries("2024-01-01", 252, 0.01, 1.5);
  const error = trackingError(fund, benchmark);
  assert.ok(error !== null && error > 0);
});

test("informationRatio is null when tracking error is unavailable", () => {
  assert.equal(informationRatio(monthly, monthly), null);
});

test("captureRatios reports amplified upside and downside when the fund moves 1.5x the benchmark", () => {
  const { fund, benchmark } = pairedDailySeries("2023-01-01", 252 * 2, 0.005, 1.5);
  const { upside, downside } = captureRatios(fund, benchmark);
  assert.ok(upside !== null && upside > 100);
  assert.ok(downside !== null && downside > 100);
});

test("captureRatios is null with less than a year of aligned observations", () => {
  assert.deepEqual(captureRatios(monthly, monthly), { upside: null, downside: null });
});

test("rollingHitRate is null with fewer than 4 complete windows", () => {
  const fund = trendingDailySeries("2023-01-01", 252 * 3, 0.0004);
  const benchmark = trendingDailySeries("2023-01-01", 252 * 3, 0.0002);
  assert.equal(rollingHitRate(fund, benchmark, 3), null);
});

test("rollingHitRate reports a perfect hit rate when the fund always outpaces the benchmark", () => {
  const fund = trendingDailySeries("2015-01-01", 252 * 10, 0.0004);
  const benchmark = trendingDailySeries("2015-01-01", 252 * 10, 0.0002);
  const result = rollingHitRate(fund, benchmark, 3);
  assert.ok(result !== null);
  assert.equal(result.hitRate, 1);
  assert.ok(result.windowCount >= 4);
});
