import { expect, test, vi } from "vitest";
import { ProviderError } from "@/lib/provider";

const getFundSnapshots = vi.fn();
vi.mock("@/lib/fund.service", () => ({ fundService: { getFundSnapshots } }));
const { GET } = await import("./route");

test("rejects when no codes are provided", async () => {
  const response = await GET(new Request("http://localhost/api/funds/related-snapshots"));
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: "invalid_scheme_code" });
  expect(getFundSnapshots).not.toHaveBeenCalled();
});

test("rejects an invalid scheme code", async () => {
  const response = await GET(
    new Request("http://localhost/api/funds/related-snapshots?codes=123,abc"),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: "invalid_scheme_code" });
  expect(getFundSnapshots).not.toHaveBeenCalled();
});

test("rejects more than 12 codes", async () => {
  const codes = Array.from({ length: 13 }, (_, i) => 1000 + i).join(",");
  const response = await GET(
    new Request(`http://localhost/api/funds/related-snapshots?codes=${codes}`),
  );
  expect(response.status).toBe(400);
  expect(getFundSnapshots).not.toHaveBeenCalled();
});

test("dedupes codes before calling the fund service", async () => {
  getFundSnapshots.mockResolvedValueOnce(new Map([["1234", { schemeCode: "1234" }]]));
  const response = await GET(
    new Request("http://localhost/api/funds/related-snapshots?codes=1234,1234"),
  );
  expect(response.status).toBe(200);
  expect(getFundSnapshots).toHaveBeenCalledWith(["1234"]);
  await expect(response.json()).resolves.toEqual({ snapshots: { "1234": { schemeCode: "1234" } } });
});

test("maps a provider error to its status and message", async () => {
  getFundSnapshots.mockRejectedValueOnce(new ProviderError("upstream down", 503));
  const response = await GET(
    new Request("http://localhost/api/funds/related-snapshots?codes=1234"),
  );
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
    error: "provider_error",
    message: "upstream down",
  });
});

test("maps an unexpected error to a generic provider error", async () => {
  getFundSnapshots.mockRejectedValueOnce(new Error("boom"));
  const response = await GET(
    new Request("http://localhost/api/funds/related-snapshots?codes=1234"),
  );
  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({
    error: "provider_error",
    message: "We could not load related funds right now.",
  });
});
