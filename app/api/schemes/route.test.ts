import { describe, expect, test, vi } from "vitest";
import { ProviderError } from "@/lib/provider";

const search = vi.fn();

vi.mock("@/lib/catalog.service", () => ({ catalogService: { search } }));

const { GET } = await import("./route");

describe("GET /api/schemes", () => {
  test("rejects an invalid query before calling the provider", async () => {
    const response = await GET(new Request("http://localhost/api/schemes?q=x"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_query" });
    expect(search).not.toHaveBeenCalled();
  });

  test("returns eligible schemes from the provider", async () => {
    search.mockResolvedValueOnce([
      {
        schemeCode: "122639",
        schemeName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
        amc: "PPFAS Mutual Fund",
        category: "Flexi Cap",
        plan: "Direct Plan",
        option: "Growth",
      },
    ]);

    const response = await GET(new Request("http://localhost/api/schemes?q=Parag%20Parikh"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ schemes: [expect.any(Object)] });
  });

  test("preserves the provider error status and safe message", async () => {
    search.mockRejectedValueOnce(new ProviderError("Rate limited", 429));

    const response = await GET(new Request("http://localhost/api/schemes?q=Parag%20Parikh"));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "provider_error",
      message: "Rate limited",
    });
  });
});
