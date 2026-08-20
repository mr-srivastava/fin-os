export const EQUITY_CATEGORIES = [
  "Flexi Cap",
  "Large Cap",
  "Large & Mid Cap",
  "Mid Cap",
  "Small Cap",
  "Focused",
  "Value",
  "Contra",
] as const;

export type EquityCategory = (typeof EQUITY_CATEGORIES)[number];

export function isEquityCategory(value: string): value is EquityCategory {
  return EQUITY_CATEGORIES.includes(value as EquityCategory);
}
