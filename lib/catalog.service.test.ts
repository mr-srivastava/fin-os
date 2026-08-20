import { assert, test, vi } from "vitest";
import type { CatalogueEntry, CatalogueMeta } from "./fundCatalog.types.ts";

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
    financials: null,
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
    financials: null,
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

vi.mock("./mongo.ts", () => ({
  getDb: async () => ({
    collection: (name: string) => {
      if (name === "catalogue_meta") return { findOne: async () => meta };
      return {
        find: (filter: { catalogueVersion: string }) => ({
          toArray: async () =>
            entries.filter((entry) => entry.catalogueVersion === filter.catalogueVersion),
        }),
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

test("lists the current version's schemes for one category, sorted by name", async () => {
  const schemes = await listCatalogueByCategory("Flexi Cap");
  assert.deepEqual(
    schemes.map((scheme) => scheme.schemeName),
    [
      "Aditya Birla Sun Life Flexi Cap Fund - Growth - Direct Plan",
      "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
    ],
  );
});

test("excludes a category with no current-version matches", async () => {
  assert.deepEqual(await listCatalogueByCategory("Small Cap"), []);
});
