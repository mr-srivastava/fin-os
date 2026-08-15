import { assert, test } from "vitest";
import {
  annualizedReturn,
  annualizedVolatility,
  filterSeriesByRange,
  investmentOutcome,
  maxDrawdown,
  normalizeSeries,
  relativeReturnSeries,
} from "./analytics.ts";

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

test("requires a meaningful daily return sample for volatility", () => {
  assert.equal(annualizedVolatility(monthly), null);
});
