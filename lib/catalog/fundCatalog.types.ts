import * as v from "valibot";
import { EQUITY_CATEGORIES } from "../fund/fundCategories";

const NullableString = v.nullable(v.string());
const NullableNumber = v.nullable(v.number());

/**
 * The catalogue is TigZig-primary: structural fields and liveness come from TigZig's
 * AMFI-sourced scheme universe. FinAPI is never a gate here - `finapiCrossCheck` is a
 * passive comparison field only, populated by a separate drift-sample pass.
 */
export const CatalogueEntrySchema = v.object({
  schemeCode: v.string(),
  isin: NullableString,
  /** IDCW-reinvestment ISIN. Some schemes carry their identifier only here, not in `isin`. */
  isin2: NullableString,
  schemeName: v.string(),
  amc: v.string(),
  /** TigZig's canonical SEBI sub-category label, e.g. "Flexi Cap Fund". Matched exactly, never by substring. */
  categorySub: v.string(),
  category: v.picklist(EQUITY_CATEGORIES),
  plan: v.literal("Direct"),
  option: v.literal("Growth"),
  /** TigZig's stable scheme identifier; survives AMC-merger scheme-code splits. */
  txicCode: NullableString,
  liveness: v.object({
    /** TigZig: a NAV was published within the last 45 days. */
    isActive: v.boolean(),
    /** TigZig: a data-orphan scheme with only 1-2 NAV rows on record. */
    isStale: v.boolean(),
    firstNavDate: v.string(),
    lastNavDate: v.string(),
  }),
  finapiCrossCheck: v.nullable(
    v.object({
      checkedAt: v.string(),
      activeFieldRaw: v.unknown(),
      categoryRaw: NullableString,
    }),
  ),
  /**
   * A lightweight NAV/facts snapshot taken from FinAPI+TigZig during the refresh run.
   * `null` when the snapshot fetch failed or was skipped for this scheme - the catalogue
   * entry is still valid, just without enriched card data until the next refresh.
   */
  financials: v.nullable(
    v.object({
      nav: v.nullable(v.object({ nav: v.number(), date: v.string() })),
      aum: NullableNumber,
      riskLabel: NullableString,
      /**
       * Annualized (CAGR) return over the trailing year, as a percentage (e.g. 12.3 for +12.3%).
       * Optional (rather than just nullable): a snapshot written before this field existed has
       * the key entirely absent - `hasSnapshotFromDay` in catalog.service.ts checks for exactly
       * that to self-heal such an entry on the next refresh, so this schema must accept both
       * "absent" and "present but null" as distinct states rather than collapsing them.
       */
      oneYearReturn: v.optional(NullableNumber),
      /** Annualized (CAGR) return over the trailing three years, as a percentage. See `oneYearReturn`. */
      threeYearReturn: v.optional(NullableNumber),
      snapshotAt: v.string(),
    }),
  ),
  /** Timestamp of the refresh run that most recently saw this scheme in TigZig's catalogue. */
  sourceLastSeenAt: v.string(),
  /** The catalogue version this document belongs to; see `CatalogueMeta`. */
  catalogueVersion: v.string(),
});
export type CatalogueEntry = v.InferOutput<typeof CatalogueEntrySchema>;

/**
 * Singleton pointer document (`_id: "current"`) recording which `catalogueVersion` is
 * live. A refresh writes new `CatalogueEntry` documents under a fresh version, then
 * flips this pointer in one update - readers never see a half-written catalogue.
 */
export const CatalogueMetaSchema = v.object({
  _id: v.literal("current"),
  version: v.string(),
  generatedAt: v.string(),
  totalSchemes: v.number(),
  tigzigSnapshot: v.object({
    generatedAt: NullableString,
    etag: NullableString,
  }),
});
export type CatalogueMeta = v.InferOutput<typeof CatalogueMetaSchema>;

export const SCHEMES_COLLECTION = "schemes";
export const CATALOGUE_META_COLLECTION = "catalogue_meta";
