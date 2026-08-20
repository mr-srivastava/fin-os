import { describe, expect, test, vi } from "vitest";
import { handlePost as POST } from "./route";

const addItem = vi.fn();
const deps = { getDeviceId: async () => "device-a", addItem };

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
      deps,
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
      deps,
    );
    expect(response.status).toBe(404);
  });

  test("400s when the watchlist is already at the item limit", async () => {
    addItem.mockResolvedValueOnce("watchlist_item_limit_reached");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ schemeCode: "122639" }),
      }),
      context(VALID_ID),
      deps,
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "watchlist_item_limit_reached",
    });
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
      deps,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ watchlist: { count: 1 } });
    expect(addItem).toHaveBeenCalledWith("device-a", VALID_ID, "122639");
  });
});
