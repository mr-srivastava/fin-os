import { expect, test, vi } from "vitest";
import { handleGet as GET } from "./route";

const getFundResearchBatch = vi.fn();
const deps = { getFundResearchBatch };

test("rejects duplicate comparison codes without provider work", async () => {
  const response = await GET(
    new Request("http://localhost/api/compare?fund=1234&against=1234"),
    deps,
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: "invalid_comparison" });
  expect(getFundResearchBatch).not.toHaveBeenCalled();
});
