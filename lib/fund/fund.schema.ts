import * as v from "valibot";
import { isIsoDate } from "@/lib/shared/date";

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

/** Shape of a POST body carrying a scheme code; the value itself is still checked with `isSchemeCode`. */
export const SchemeCodeBodySchema = v.object({ schemeCode: v.string() });

const schemeFields = {
  schemeCode: v.string(),
  schemeName: v.string(),
  amc: v.string(),
  category: v.string(),
  plan: v.string(),
  option: v.string(),
};

export const SchemeSchema = v.object(schemeFields);
export type Scheme = v.InferOutput<typeof SchemeSchema>;

export const RelatedFundSchema = v.object({
  ...schemeFields,
  nav: v.nullable(NavPointSchema),
  aum: NullableFiniteNumberSchema,
  riskLabel: v.nullable(v.string()),
  oneYearReturn: NullableFiniteNumberSchema,
  threeYearReturn: NullableFiniteNumberSchema,
});
export type RelatedFund = v.InferOutput<typeof RelatedFundSchema>;

const RelatedSnapshotSchema = v.object({
  nav: v.nullable(NavPointSchema),
  aum: NullableFiniteNumberSchema,
  riskLabel: v.nullable(v.string()),
  oneYearReturn: NullableFiniteNumberSchema,
  threeYearReturn: NullableFiniteNumberSchema,
});
export type RelatedSnapshot = v.InferOutput<typeof RelatedSnapshotSchema>;

/** Response of GET /api/funds/related-snapshots, keyed by scheme code. */
export const RelatedSnapshotsSchema = v.object({
  snapshots: v.record(v.string(), RelatedSnapshotSchema),
});

export const SchemeSearchSchema = v.object({ schemes: v.array(SchemeSchema) });
export const CategorySchemeListSchema = v.object({
  category: v.string(),
  schemes: v.array(RelatedFundSchema),
});
const API_ERROR_CODES = [
  "invalid_query",
  "invalid_scheme_code",
  "invalid_isin",
  "invalid_comparison",
  "not_found",
  "provider_error",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const ApiErrorSchema = v.object({
  error: v.picklist(API_ERROR_CODES),
  message: v.string(),
});
export type ApiError = v.InferOutput<typeof ApiErrorSchema>;

const ToneSchema = v.picklist(["gain", "loss", "neutral"]);
export type Tone = v.InferOutput<typeof ToneSchema>;
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
export type PerformanceRangeView = v.InferOutput<typeof PerformanceRangeViewSchema>;
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
});
export type FundResearchView = v.InferOutput<typeof FundResearchViewSchema>;

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
});
export type ComparisonView = v.InferOutput<typeof ComparisonViewSchema>;
