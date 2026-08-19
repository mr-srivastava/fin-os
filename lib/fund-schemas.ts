import * as v from "valibot";
import { isIsoDate } from "@/lib/date";
import type { ApiError, FundResearch, RelatedFund, Scheme } from "@/lib/fund-types";
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

const schemeFields = {
  schemeCode: v.string(),
  schemeName: v.string(),
  amc: v.string(),
  category: v.string(),
  plan: v.string(),
  option: v.string(),
};

export const SchemeSchema: v.GenericSchema<Scheme> = v.object(schemeFields);

export const RelatedFundSchema: v.GenericSchema<RelatedFund> = v.object({
  ...schemeFields,
  nav: v.nullable(NavPointSchema),
  aum: NullableFiniteNumberSchema,
  riskLabel: v.nullable(v.string()),
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
  returnBasis: v.literal("total_return"),
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
  returnConsistency: v.nullable(
    v.object({
      timeframe: v.string(),
      averageReturn: FiniteNumberSchema,
      medianReturn: FiniteNumberSchema,
      minReturn: FiniteNumberSchema,
      maxReturn: FiniteNumberSchema,
      positiveRatio: FiniteNumberSchema,
      negativeRatio: FiniteNumberSchema,
      consistencyScore: NullableFiniteNumberSchema,
    }),
  ),
  relatedFunds: v.object({
    peers: v.array(RelatedFundSchema),
    fromAmc: v.array(RelatedFundSchema),
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
export const CategorySchemeListSchema = v.object({
  category: v.string(),
  schemes: v.array(RelatedFundSchema),
});
export const ApiErrorSchema: v.GenericSchema<ApiError> = v.object({
  error: v.picklist([
    "invalid_query",
    "invalid_scheme_code",
    "invalid_isin",
    "invalid_comparison",
    "not_found",
    "provider_error",
  ]),
  message: v.string(),
});

const ToneSchema = v.picklist(["gain", "loss", "neutral"]);
const DatedValueSchema = v.object({ date: IsoDateSchema, value: FiniteNumberSchema });
const PerformanceRangeViewSchema = v.object({
  label: v.string(),
  series: v.array(v.object({ name: v.string(), points: v.array(DatedValueSchema) })),
  outcomes: v.array(
    v.object({
      name: v.string(),
      returnPercent: NullableFiniteNumberSchema,
      endingValue: NullableFiniteNumberSchema,
      tone: ToneSchema,
    }),
  ),
});
const PerformanceRangesSchema = v.object({
  "6m": PerformanceRangeViewSchema,
  "1y": PerformanceRangeViewSchema,
  "3y": PerformanceRangeViewSchema,
  "5y": PerformanceRangeViewSchema,
  max: PerformanceRangeViewSchema,
});
const UnavailableSectionSchema = v.object({
  status: v.literal("unavailable"),
  message: v.string(),
});
const ReadySection = <T>(schema: v.GenericSchema<T>) =>
  v.object({ status: v.literal("ready"), data: schema });
const SectionSchema = <T>(schema: v.GenericSchema<T>) =>
  v.union([ReadySection(schema), UnavailableSectionSchema]);
const WeightedViewItemSchema = v.object({
  name: v.string(),
  weight: NonNegativeFiniteNumberSchema,
});
const FundPortfolioViewSchema = v.object({
  asOf: v.nullable(IsoDateSchema),
  sectors: v.array(
    v.object({ ...WeightedViewItemSchema.entries, holdings: v.array(WeightedViewItemSchema) }),
  ),
  assetAllocation: v.array(WeightedViewItemSchema),
  marketCapAllocation: v.array(WeightedViewItemSchema),
  topTenConcentration: NullableFiniteNumberSchema,
});

export const FundResearchViewSchema = v.object({
  scheme: SchemeSchema,
  currentNav: v.nullable(NavPointSchema),
  benchmark: v.nullable(v.object({ name: v.string(), returnBasis: v.literal("total_return") })),
  performance: SectionSchema(PerformanceRangesSchema),
  metricGroups: v.array(
    v.object({
      id: v.picklist(["returns", "risk"]),
      metrics: v.array(
        v.object({ id: v.string(), value: NullableFiniteNumberSchema, tone: ToneSchema }),
      ),
    }),
  ),
  returnConsistency: v.nullable(
    v.object({
      timeframe: v.string(),
      averageReturn: FiniteNumberSchema,
      medianReturn: FiniteNumberSchema,
      minReturn: FiniteNumberSchema,
      maxReturn: FiniteNumberSchema,
      positiveRatio: FiniteNumberSchema,
      negativeRatio: FiniteNumberSchema,
      consistencyScore: NullableFiniteNumberSchema,
    }),
  ),
  relatedFunds: v.object({
    peers: v.array(RelatedFundSchema),
    fromAmc: v.array(RelatedFundSchema),
  }),
  facts: v.object({
    aum: NullableFiniteNumberSchema,
    expenseRatio: NullableFiniteNumberSchema,
    portfolioTurnover: NullableFiniteNumberSchema,
    benchmark: v.nullable(v.string()),
    riskLabel: v.nullable(v.string()),
    managers: v.array(v.string()),
  }),
  portfolio: SectionSchema(FundPortfolioViewSchema),
}) satisfies v.GenericSchema<FundResearchView>;

const ComparisonPortfolioViewSchema = v.object({
  reportDates: v.tuple([v.nullable(IsoDateSchema), v.nullable(IsoDateSchema)]),
  sectorAllocation: v.array(
    v.object({
      name: v.string(),
      weights: v.tuple([NullableFiniteNumberSchema, NullableFiniteNumberSchema]),
    }),
  ),
  assetAllocation: v.array(
    v.object({
      name: v.string(),
      weights: v.tuple([NullableFiniteNumberSchema, NullableFiniteNumberSchema]),
    }),
  ),
  marketCapAllocation: v.array(
    v.object({
      name: v.string(),
      weights: v.tuple([NullableFiniteNumberSchema, NullableFiniteNumberSchema]),
    }),
  ),
  concentration: v.tuple([NullableFiniteNumberSchema, NullableFiniteNumberSchema]),
});
const ComparisonSelectionSchema = v.union([
  v.object({
    status: v.literal("ready"),
    scheme: SchemeSchema,
    currentNav: v.nullable(NavPointSchema),
  }),
  v.object({ status: v.literal("unavailable"), schemeCode: v.string(), message: v.string() }),
]);

export const ComparisonViewSchema = v.object({
  selections: v.tuple([ComparisonSelectionSchema, ComparisonSelectionSchema]),
  comparison: SectionSchema(
    v.object({
      fundNames: v.tuple([v.string(), v.string()]),
      performance: SectionSchema(PerformanceRangesSchema),
      metrics: SectionSchema(
        v.array(
          v.object({
            id: v.string(),
            values: v.array(v.object({ value: NullableFiniteNumberSchema, tone: ToneSchema })),
          }),
        ),
      ),
      facts: v.array(
        v.object({
          id: v.string(),
          values: v.array(v.union([v.string(), FiniteNumberSchema, v.null()])),
        }),
      ),
      portfolio: SectionSchema(ComparisonPortfolioViewSchema),
    }),
  ),
}) satisfies v.GenericSchema<ComparisonView>;
