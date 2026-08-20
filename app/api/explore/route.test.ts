import { describe, expect, test, vi } from "vitest";
import { ProviderError } from "@/lib/providers/provider";
import { handleGet as GET } from "./route";

const listByCategory = vi.fn();
const deps = { listByCategory };

describe("GET /api/explore", () => {
  test("rejects an unsupported category before calling the provider", async () => {
    const response = await GET(new Request("http://localhost/api/explore?category=Debt"), deps);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_query" });
    expect(listByCategory).not.toHaveBeenCalled();
  });

  test("returns the category browse list", async () => {
    listByCategory.mockResolvedValueOnce([]);

    const response = await GET(
      new Request("http://localhost/api/explore?category=Flexi%20Cap"),
      deps,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ category: "Flexi Cap", schemes: [] });
    expect(listByCategory).toHaveBeenCalledWith("Flexi Cap");
  });

  test("preserves a provider error", async () => {
    listByCategory.mockRejectedValueOnce(new ProviderError("Rate limited", 429));

    const response = await GET(
      new Request("http://localhost/api/explore?category=Flexi%20Cap"),
      deps,
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "provider_error",
      message: "Rate limited",
    });
  });
});
