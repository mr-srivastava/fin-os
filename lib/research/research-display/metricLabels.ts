export const labels = {
  oneYear: "1Y return",
  threeYear: "3Y annualised",
  fiveYear: "5Y annualised",
  volatility: "Volatility",
  maxDrawdown: "Max drawdown",
  excessReturnOneYear: "1Y vs benchmark",
  excessReturnThreeYear: "3Y vs benchmark",
  excessReturnFiveYear: "5Y vs benchmark",
  trackingError: "Tracking error",
  informationRatio: "Information ratio",
  upsideCapture: "Upside capture",
  downsideCapture: "Downside capture",
} satisfies Record<string, string>;

export const comparisonLabels = {
  ...labels,
  threeYear: "3Y annualized",
  fiveYear: "5Y annualized",
  volatility: "1Y volatility",
} satisfies Record<string, string>;
