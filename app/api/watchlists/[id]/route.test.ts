import { describe, expect, test, vi } from "vitest";

const get = vi.fn();
const rename = vi.fn();
const remove = vi.fn();
const getFundResearchBatch = vi.fn();

vi.mock("@/lib/watchlist.service", () => ({
  watchlistService: { get, rename, remove },
}));
vi.mock("@/lib/fund.service", () => ({
  fundService: { getFundResearchBatch },
}));
vi.mock("@/lib/deviceId", () => ({ getOrCreateDeviceId: async () => "device-a" }));

const { GET, PATCH, DELETE } = await import("./route");

const VALID_ID = "11111111-1111-1111-1111-111111111111";

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/watchlists/[id]", () => {
  test("404s for a malformed id without hitting the service", async () => {
    const response = await GET(new Request("http://localhost"), context("not-a-uuid"));
    expect(response.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  test("404s when the watchlist does not belong to this device", async () => {
    get.mockResolvedValueOnce(null);
    const response = await GET(new Request("http://localhost"), context(VALID_ID));
    expect(response.status).toBe(404);
  });

  test("resolves scheme codes into fund summaries via the batch API", async () => {
    get.mockResolvedValueOnce({
      _id: VALID_ID,
      deviceId: "device-a",
      name: "Client: Sharma family",
      createdAt: "x",
      updatedAt: "x",
      schemeCodes: ["122639", "999999"],
    });
    getFundResearchBatch.mockResolvedValueOnce([
      {
        status: "fulfilled",
        value: {
          scheme: {
            schemeCode: "122639",
            schemeName: "Parag Parikh Flexi Cap Fund",
            amc: "PPFAS Mutual Fund",
            category: "Flexi Cap",
            plan: "Direct",
            option: "Growth",
          },
          currentNav: { date: "2026-08-17", nav: 100 },
          facts: {
            aum: 500,
            expenseRatio: 1,
            portfolioTurnover: null,
            benchmark: null,
            riskLabel: "High",
            managers: [],
          },
          metrics: {
            oneYear: { label: "1Y", value: 12 },
            threeYear: { label: "3Y", value: 18 },
            fiveYear: { label: "5Y", value: null },
            volatility: { label: "Vol", value: null },
            maxDrawdown: { label: "MDD", value: null },
          },
        },
      },
      { status: "fulfilled", value: null },
    ]);

    const response = await GET(new Request("http://localhost"), context(VALID_ID));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.funds).toHaveLength(1);
    expect(body.funds[0]).toMatchObject({ schemeCode: "122639", oneYearReturn: 12 });
    expect(body.unavailableSchemeCodes).toEqual(["999999"]);
  });
});

describe("PATCH /api/watchlists/[id]", () => {
  test("rejects an invalid name", async () => {
    const response = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ name: "" }) }),
      context(VALID_ID),
    );
    expect(response.status).toBe(400);
    expect(rename).not.toHaveBeenCalled();
  });

  test("404s when rename affects no document", async () => {
    rename.mockResolvedValueOnce(null);
    const response = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ name: "New" }) }),
      context(VALID_ID),
    );
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/watchlists/[id]", () => {
  test("404s when nothing was deleted", async () => {
    remove.mockResolvedValueOnce(false);
    const response = await DELETE(new Request("http://localhost"), context(VALID_ID));
    expect(response.status).toBe(404);
  });

  test("204s on success", async () => {
    remove.mockResolvedValueOnce(true);
    const response = await DELETE(new Request("http://localhost"), context(VALID_ID));
    expect(response.status).toBe(204);
  });
});
