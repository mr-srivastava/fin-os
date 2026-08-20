import { assert, test, vi } from "vitest";
import type { CatalogueEntry, CatalogueMeta } from "./fundCatalog.types";

const entries: CatalogueEntry[] = [
  {
    schemeCode: "120564",
    isin: "INF209K01XX1",
    isin2: null,
    schemeName: "Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan",
    amc: "Aditya Birla Sun Life Mutual Fund",
    categorySub: "Flexi Cap Fund",
    category: "Flexi Cap",
    plan: "Direct",
    option: "Growth",
    txicCode: "ABOFXDG",
    liveness: {
      isActive: true,
      isStale: false,
      firstNavDate: "2013-01-02",
      lastNavDate: "2026-08-17",
    },
    finapiCrossCheck: null,
    financials: {
      nav: null,
      aum: null,
      riskLabel: null,
      oneYearReturn: 8.1,
      threeYearReturn: 15.4,
      snapshotAt: "2026-08-18T00:00:00.000Z",
    },
    sourceLastSeenAt: "2026-08-18T00:00:00.000Z",
    catalogueVersion: "v2",
  },
  {
    schemeCode: "122639",
    isin: "INF879O01027",
    isin2: null,
    schemeName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    amc: "PPFAS Mutual Fund",
    categorySub: "Flexi Cap Fund",
    category: "Flexi Cap",
    plan: "Direct",
    option: "Growth",
    txicCode: "PPOFXDG",
    liveness: {
      isActive: true,
      isStale: false,
      firstNavDate: "2013-05-24",
      lastNavDate: "2026-08-17",
    },
    finapiCrossCheck: null,
    financials: {
      nav: null,
      aum: null,
      riskLabel: null,
      oneYearReturn: 12.6,
      threeYearReturn: 11.2,
      snapshotAt: "2026-08-18T00:00:00.000Z",
    },
    sourceLastSeenAt: "2026-08-18T00:00:00.000Z",
    catalogueVersion: "v2",
  },
  {
    schemeCode: "141925",
    isin: "INF846K01B28",
    isin2: null,
    schemeName: "Axis Small Cap Fund - Direct Plan - Growth",
    amc: "Axis Mutual Fund",
    categorySub: "Small Cap Fund",
    category: "Small Cap",
    plan: "Direct",
    option: "Growth",
    txicCode: "AXOSCDG",
    liveness: {
      isActive: true,
      isStale: false,
      firstNavDate: "2013-11-29",
      lastNavDate: "2026-08-17",
    },
    finapiCrossCheck: null,
    financials: null,
    sourceLastSeenAt: "2026-08-18T00:00:00.000Z",
    catalogueVersion: "v1",
  },
];

const meta: CatalogueMeta = {
  _id: "current",
  version: "v2",
  generatedAt: "2026-08-18T00:00:00.000Z",
  totalSchemes: 2,
  tigzigSnapshot: { generatedAt: null, etag: null },
};

/** A fake Mongo query condition, restricted to the shapes this test's filters actually use. */
type FilterValue = string | number | boolean | null | RegExp;

/** A fake Mongo query filter: field-name conditions, a `$or` of nested filters, or a `$text` search. */
type CatalogueFilter = {
  [key: string]: FilterValue | CatalogueFilter[] | { $search: string };
};

function matchesValue(entryValue: FilterValue, condition: FilterValue): boolean {
  if (condition instanceof RegExp) return condition.test(String(entryValue));
  return entryValue === condition;
}

/** Reads a top-level `CatalogueEntry` field as the primitive shape a fake filter compares against. */
function fieldValue(entry: CatalogueEntry, key: string): FilterValue {
  // SAFETY: this test only ever filters on CatalogueEntry's own primitive (string/boolean/null)
  // top-level fields, never its nested objects (`liveness`, `financials`, `finapiCrossCheck`).
  const value = entry[key as keyof CatalogueEntry];
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  throw new Error(`fieldValue: "${key}" is not a primitive field this test fixture can filter on.`);
}

/** Reads a (possibly dotted, e.g. "financials.oneYearReturn") field for the fake cursor's sort. */
function sortValue(entry: CatalogueEntry, path: string): FilterValue {
  const value = path
    .split(".")
    .reduce<unknown>((obj, part) => (obj as Record<string, unknown> | null)?.[part] ?? null, entry);
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  throw new Error(`sortValue: "${path}" is not a primitive field this test fixture can sort on.`);
}

/** Compares two fake-cursor rows across a multi-field sort spec, nulls sorting first. */
function compareBySpec(a: CatalogueEntry, b: CatalogueEntry, spec: Record<string, 1 | -1>): number {
  for (const [field, direction] of Object.entries(spec)) {
    const aValue = sortValue(a, field);
    const bValue = sortValue(b, field);
    if (aValue === bValue) continue;
    if (aValue === null) return -1 * direction;
    if (bValue === null) return 1 * direction;
    return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * direction;
  }
  return 0;
}

/** Approximates a `$text` search over `schemeName`/`amc`: every query word must appear in either field. */
function matchesText(entry: CatalogueEntry, search: string): boolean {
  const haystack = `${entry.schemeName} ${entry.amc}`.toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function matchesFilter(entry: CatalogueEntry, filter: CatalogueFilter): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$or") {
      return (condition as CatalogueFilter[]).some((clause) => matchesFilter(entry, clause));
    }
    if (key === "$text") {
      // SAFETY: `$text` conditions are only ever built as `{ $search: string }` by this file's own callers.
      return matchesText(entry, (condition as { $search: string }).$search);
    }
    return matchesValue(fieldValue(entry, key), condition as FilterValue);
  });
}

function cursor(matched: CatalogueEntry[]) {
  return {
    sort: (spec: Record<string, 1 | -1>) => {
      const sorted = [...matched].sort((a, b) => compareBySpec(a, b, spec));
      return cursor(sorted);
    },
    limit: (count: number) => cursor(matched.slice(0, count)),
    toArray: async () => matched,
  };
}

// mongo.ts has no DI seam; mocking it here swaps only the low-level driver for a faithful
// in-memory query implementation (see `matchesFilter`/`cursor` above), not the service logic
// under test.
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock("../providers/mongo.ts", () => ({
  getDb: async () => ({
    collection: (name: string) => {
      if (name === "catalogue_meta") return { findOne: async () => meta };
      return {
        find: (filter: CatalogueFilter) =>
          cursor(entries.filter((entry) => matchesFilter(entry, filter))),
      };
    },
  }),
  getMongoClient: async () => ({ close: async () => {} }),
}));

const { searchCatalogue, listCatalogueByCategory } = await import("./catalog.service.ts");

test("searches only the current catalogue version by scheme name or AMC", async () => {
  const byName = await searchCatalogue("flexi cap");
  assert.deepEqual(
    byName.map((scheme) => scheme.schemeCode),
    ["120564", "122639"],
  );

  const byAmc = await searchCatalogue("ppfas");
  assert.deepEqual(
    byAmc.map((scheme) => scheme.schemeCode),
    ["122639"],
  );

  const staleVersion = await searchCatalogue("axis small cap");
  assert.deepEqual(staleVersion, []);
});

test("maps a catalogue entry to the client-facing Scheme shape", async () => {
  const [scheme] = await searchCatalogue("Parag Parikh");
  assert.deepEqual(scheme, {
    schemeCode: "122639",
    schemeName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    amc: "PPFAS Mutual Fund",
    category: "Flexi Cap Fund",
    plan: "Direct",
    option: "Growth",
  });
});

test("lists the current version's schemes for one category, sorted by 1-year return", async () => {
  const schemes = await listCatalogueByCategory("Flexi Cap");
  assert.deepEqual(
    schemes.map((scheme) => scheme.schemeName),
    [
      "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
      "Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan",
    ],
  );
});

test("excludes a category with no current-version matches", async () => {
  assert.deepEqual(await listCatalogueByCategory("Small Cap"), []);
});
