import { describe, expect, test, vi } from "vitest";
import { ProviderError } from "@/lib/provider";

const listSchemesByCategory = vi.fn();

vi.mock("@/lib/finapi", () => ({ listSchemesByCategory, ProviderError }));

const { GET } = await import("./route");

describe("GET /api/explore", () => {
  test("rejects an unsupported category before calling the provider", async () => {
    const response = await GET(new Request("http://localhost/api/explore?category=Debt"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_query" });
    expect(listSchemesByCategory).not.toHaveBeenCalled();
  });

  test("returns the category browse list", async () => {
    listSchemesByCategory.mockResolvedValueOnce([]);

    const response = await GET(new Request("http://localhost/api/explore?category=Flexi%20Cap"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ category: "Flexi Cap", schemes: [] });
    expect(listSchemesByCategory).toHaveBeenCalledWith("Flexi Cap");
  });

  test("preserves a provider error", async () => {
    listSchemesByCategory.mockRejectedValueOnce(new ProviderError("Rate limited", 429));

    const response = await GET(new Request("http://localhost/api/explore?category=Flexi%20Cap"));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "provider_error",
      message: "Rate limited",
    });
  });
});
