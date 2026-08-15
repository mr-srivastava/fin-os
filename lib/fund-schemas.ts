import * as v from "valibot";
import { isIsoDate } from "@/lib/date";
import type { ApiError, FundResearch, Scheme } from "@/lib/fund-types";
import type { ComparisonView, FundResearchView } from "@/lib/research-view/types";

const FiniteNumberSchema = v.pipe(v.number(), v.finite());
const NullableFiniteNumberSchema = v.nullable(FiniteNumberSchema);
const NonNegativeFiniteNumberSchema = v.pipe(FiniteNumberSchema, v.minValue(0));
const PositiveFiniteNumberSchema = v.pipe(FiniteNumberSchema, v.gtValue(0));
const IsoDateSchema = v.pipe(
  v.string(),
  v.isoDate(),
  v.custom<string>(isIsoDate, "Expected a valid ISO calendar date."),
);

export const NavPointSchema = v.object({
  date: IsoDateSchema,
  nav: PositiveFiniteNumberSchema,
});

export const SchemeSchema: v.GenericSchema<Scheme> = v.object({
  schemeCode: v.string(),
  schemeName: v.string(),
  amc: v.string(),
  category: v.string(),
  plan: v.string(),
  option: v.string(),
});

const MetricSchema = v.object({
  label: v.string(),
  value: NullableFiniteNumberSchema,
});

const DataAvailabilitySchema = v.union([
  v.object({ available: v.literal(true) }),
  v.object({ available: v.literal(false), reason: v.string() }),
]);

const NavHistoryAvailabilitySchema = v.union([
  v.object({ available: v.literal(true), source: v.literal("TigZig") }),
  v.object({ available: v.literal(false), source: v.null(), reason: v.string() }),
]);

const AllocationItemSchema = v.object({
  name: v.string(),
  weight: NonNegativeFiniteNumberSchema,
});

const PortfolioItemSchema = v.object({
  name: v.string(),
  weight: NonNegativeFiniteNumberSchema,
  sector: v.nullable(v.string()),
});

const PortfolioSchema = v.object({
  asOf: v.nullable(v.string()),
  holdings: v.array(PortfolioItemSchema),
  sectors: v.array(AllocationItemSchema),
  assetAllocation: v.array(AllocationItemSchema),
  marketCapAllocation: v.array(AllocationItemSchema),
  topTenConcentration: NullableFiniteNumberSchema,
});

const BenchmarkSchema = v.object({
  name: v.string(),
  nav: v.array(NavPointSchema),
});

export const FundResearchSchema: v.GenericSchema<FundResearch> = v.object({
  scheme: SchemeSchema,
  nav: v.array(NavPointSchema),
  benchmark: v.nullable(BenchmarkSchema),
  currentNav: v.nullable(NavPointSchema),
  facts: v.object({
    aum: NullableFiniteNumberSchema,
    expenseRatio: NullableFiniteNumberSchema,
    portfolioTurnover: NullableFiniteNumberSchema,
    benchmark: v.nullable(v.string()),
    riskLabel: v.nullable(v.string()),
    managers: v.array(v.string()),
  }),
  portfolio: v.nullable(PortfolioSchema),
  availability: v.object({
    navHistory: NavHistoryAvailabilitySchema,
    facts: DataAvailabilitySchema,
    portfolio: DataAvailabilitySchema,
  }),
  metrics: v.object({
    oneYear: MetricSchema,
    threeYear: MetricSchema,
    fiveYear: MetricSchema,
    volatility: MetricSchema,
    maxDrawdown: MetricSchema,
  }),
});

export const SchemeSearchSchema = v.object({ schemes: v.array(SchemeSchema) });
export const ApiErrorSchema: v.GenericSchema<ApiError> = v.object({
  error: v.picklist([
    "invalid_query",
    "invalid_scheme_code",
    "invalid_comparison",
    "not_found",
    "provider_error",
  ]),
  message: v.string(),
});

// Read models are produced by this application but still validated at the browser boundary.
// Their detailed invariants are covered by the pure mapper tests.
export const FundResearchViewSchema: v.GenericSchema<FundResearchView> = v.custom<FundResearchView>(
  (input) =>
    typeof input === "object" && input !== null && "scheme" in input && "performance" in input,
  "Expected a fund research view.",
);
export const ComparisonViewSchema: v.GenericSchema<ComparisonView> = v.custom<ComparisonView>(
  (input) =>
    typeof input === "object" && input !== null && "selections" in input && "comparison" in input,
  "Expected a comparison view.",
);
