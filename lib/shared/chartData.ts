export interface DatedValue {
  date: string;
  value: number;
}

export interface MonthlyComparisonPoint {
  /** Calendar month in YYYY-MM form. */
  month: string;
  /** One latest available value per source series, in input order. */
  values: number[];
}

/**
 * Align independently dated market series to shared calendar months.
 *
 * Providers can report a fund's NAV and its benchmark on different trading
 * dates. Choosing the latest observation in each month gives every plotted
 * comparison point a value for every series, while retaining the most recent
 * value available for that period.
 */
export function alignSeriesByMonth(
  series: readonly (readonly DatedValue[])[],
): MonthlyComparisonPoint[] {
  if (!series.length) return [];

  const valuesBySeries = series.map((points) => {
    const valuesByMonth = new Map<string, DatedValue>();
    for (const point of [...points].sort((left, right) => left.date.localeCompare(right.date))) {
      valuesByMonth.set(point.date.slice(0, 7), point);
    }
    return valuesByMonth;
  });
  const firstSeries = valuesBySeries[0];
  if (!firstSeries) return [];
  const sharedMonths = [...firstSeries.keys()].filter((month) =>
    valuesBySeries.every((valuesByMonth) => valuesByMonth.has(month)),
  );

  return sharedMonths.sort().map((month) => ({
    month,
    values: valuesBySeries.map((valuesByMonth) => valuesByMonth.get(month)!.value),
  }));
}
