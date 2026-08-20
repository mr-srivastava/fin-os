import type { EquityCategory } from "./fundCategories.ts";

/**
 * The catalogue is TigZig-primary: structural fields and liveness come from TigZig's
 * AMFI-sourced scheme universe. FinAPI is never a gate here - `finapiCrossCheck` is a
 * passive comparison field only, populated by a separate drift-sample pass.
 */
export interface CatalogueEntry {
  schemeCode: string;
  isin: string | null;
  /** IDCW-reinvestment ISIN. Some schemes carry their identifier only here, not in `isin`. */
  isin2: string | null;
  schemeName: string;
  amc: string;
  /** TigZig's canonical SEBI sub-category label, e.g. "Flexi Cap Fund". Matched exactly, never by substring. */
  categorySub: string;
  category: EquityCategory;
  plan: "Direct";
  option: "Growth";
  /** TigZig's stable scheme identifier; survives AMC-merger scheme-code splits. */
  txicCode: string | null;
  liveness: {
    /** TigZig: a NAV was published within the last 45 days. */
    isActive: boolean;
    /** TigZig: a data-orphan scheme with only 1-2 NAV rows on record. */
    isStale: boolean;
    firstNavDate: string;
    lastNavDate: string;
  };
  finapiCrossCheck: {
    checkedAt: string;
    activeFieldRaw: unknown;
    categoryRaw: string | null;
  } | null;
  /**
   * A lightweight NAV/facts snapshot taken from FinAPI+TigZig during the refresh run.
   * `null` when the snapshot fetch failed or was skipped for this scheme - the catalogue
   * entry is still valid, just without enriched card data until the next refresh.
   */
  financials: {
    nav: { nav: number; date: string } | null;
    aum: number | null;
    riskLabel: string | null;
    snapshotAt: string;
  } | null;
  /** Timestamp of the refresh run that most recently saw this scheme in TigZig's catalogue. */
  sourceLastSeenAt: string;
  /** The catalogue version this document belongs to; see `CatalogueMeta`. */
  catalogueVersion: string;
}

/**
 * Singleton pointer document (`_id: "current"`) recording which `catalogueVersion` is
 * live. A refresh writes new `CatalogueEntry` documents under a fresh version, then
 * flips this pointer in one update - readers never see a half-written catalogue.
 */
export interface CatalogueMeta {
  _id: "current";
  version: string;
  generatedAt: string;
  totalSchemes: number;
  tigzigSnapshot: {
    generatedAt: string | null;
    etag: string | null;
  };
}

export const SCHEMES_COLLECTION = "schemes";
export const CATALOGUE_META_COLLECTION = "catalogue_meta";
