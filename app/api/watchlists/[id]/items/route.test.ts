import { describe, expect, test, vi } from "vitest";

const addItem = vi.fn();

vi.mock("@/lib/watchlist.service", () => ({ watchlistService: { addItem } }));
vi.mock("@/lib/deviceId", () => ({ getOrCreateDeviceId: async () => "device-a" }));

const { POST } = await import("./route");

const VALID_ID = "11111111-1111-1111-1111-111111111111";

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/watchlists/[id]/items", () => {
  test("rejects an invalid scheme code before calling the service", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ schemeCode: "x" }),
      }),
      context(VALID_ID),
    );
    expect(response.status).toBe(400);
    expect(addItem).not.toHaveBeenCalled();
  });

  test("404s when the watchlist does not belong to this device", async () => {
    addItem.mockResolvedValueOnce(null);
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ schemeCode: "122639" }),
      }),
      context(VALID_ID),
    );
    expect(response.status).toBe(404);
  });

  test("adds the scheme code and returns the updated summary", async () => {
    addItem.mockResolvedValueOnce({
      _id: VALID_ID,
      deviceId: "device-a",
      name: "List",
      createdAt: "x",
      updatedAt: "x",
      schemeCodes: ["122639"],
    });
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ schemeCode: "122639" }),
      }),
      context(VALID_ID),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ watchlist: { count: 1 } });
    expect(addItem).toHaveBeenCalledWith("device-a", VALID_ID, "122639");
  });
});
