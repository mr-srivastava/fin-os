import { EQUITY_CATEGORIES, type EquityCategory } from "./fundCategories.ts";

/** One-line, plain-language definitions for terms shown bare in the UI. Descriptive only — never evaluative. */
export const TERM_DEFINITIONS = {
  AUM: "Assets Under Management — the total value of all investor money the scheme currently holds.",
  NAV: "Net Asset Value — the price of one unit of the scheme, calculated daily after deducting expenses.",
  AMC: "Asset Management Company — the firm that manages the scheme on behalf of investors.",
  "Expense ratio":
    "The scheme's annual operating costs (management, admin, distribution), shown as a percentage of its average assets and deducted before NAV is calculated.",
  Benchmark:
    "The index a scheme's performance is measured against, chosen to reflect the market segment it invests in.",
  "Direct Growth":
    "The Direct plan skips distributor commissions (lower expense ratio than Regular), and Growth reinvests gains into the NAV instead of paying them out.",
} as const satisfies Record<string, string>;

export type GlossaryTerm = keyof typeof TERM_DEFINITIONS;

export const EQUITY_CATEGORY_DEFINITIONS = {
  "Large Cap":
    "Invests at least 80% of assets in large-cap companies (ranked 1st–100th by market capitalization) — typically the most established, liquid companies.",
  "Mid Cap":
    "Invests at least 65% of assets in mid-cap companies (ranked 101st–250th) — higher growth potential than large caps, with higher volatility.",
  "Large & Mid Cap":
    "Invests at least 35% of assets in large-cap and at least 35% in mid-cap companies, blending the two.",
  "Small Cap":
    "Invests at least 65% of assets in small-cap companies (ranked 251st onward) — highest growth potential among the three, and typically the most volatile and least liquid.",
  "Flexi Cap":
    "Invests at least 65% of assets in equity, with no fixed allocation by market-cap segment — the fund manager can move across large-, mid-, and small-cap companies as conditions change.",
  Focused:
    "Holds a concentrated portfolio of at most 30 stocks — a wrong stock selection has a larger impact on a smaller portfolio, and so does a correct one.",
  Value:
    "Selects stocks that are currently undervalued but expected to perform well over time as the value is unlocked.",
  Contra:
    "Takes a contrarian view — buys underperforming stocks and sectors at low price points, expecting them to recover over the long run.",
} as const satisfies Record<EquityCategory, string>;

export function equityCategoryDefinition(category: string): string | null {
  return EQUITY_CATEGORIES.includes(category as EquityCategory)
    ? EQUITY_CATEGORY_DEFINITIONS[category as EquityCategory]
    : null;
}

/**
 * Plain-language description of what a SEBI riskometer tier means, keyed by the
 * provider-supplied label text. Describes the disclosure, not a verdict on the fund.
 */
export const RISK_LABEL_DEFINITIONS: Record<string, string> = {
  "Low Risk": "SEBI riskometer tier — principal is expected to be at low risk.",
  "Low to Moderate Risk":
    "SEBI riskometer tier — principal is expected to be at low to moderate risk.",
  "Moderate Risk": "SEBI riskometer tier — principal is expected to be at moderate risk.",
  "Moderately High Risk":
    "SEBI riskometer tier — principal is expected to be at moderately high risk.",
  "High Risk": "SEBI riskometer tier — principal is expected to be at high risk.",
  "Very High Risk": "SEBI riskometer tier — principal is expected to be at very high risk.",
};

export function riskLabelDefinition(riskLabel: string): string | null {
  return RISK_LABEL_DEFINITIONS[riskLabel] ?? null;
}
