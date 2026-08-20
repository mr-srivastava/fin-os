import { expect, test, vi } from "vitest";

const getFundResearchBatch = vi.fn();
vi.mock("@/lib/fund.service", () => ({ fundService: { getFundResearchBatch } }));
const { GET } = await import("./route");

test("rejects duplicate comparison codes without provider work", async () => {
  const response = await GET(new Request("http://localhost/api/compare?fund=1234&against=1234"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: "invalid_comparison" });
  expect(getFundResearchBatch).not.toHaveBeenCalled();
});
