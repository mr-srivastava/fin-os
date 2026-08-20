import { describe, expect, test, vi } from "vitest";
import { handleDelete as DELETE } from "./route";

const removeItem = vi.fn();
const deps = { getDeviceId: async () => "device-a", removeItem };

const VALID_ID = "11111111-1111-1111-1111-111111111111";

function context(id: string, schemeCode: string) {
  return { params: Promise.resolve({ id, schemeCode }) };
}

describe("DELETE /api/watchlists/[id]/items/[schemeCode]", () => {
  test("404s for an invalid scheme code without calling the service", async () => {
    const response = await DELETE(context(VALID_ID, "x"), deps);
    expect(response.status).toBe(404);
    expect(removeItem).not.toHaveBeenCalled();
  });

  test("404s when the watchlist does not belong to this device", async () => {
    removeItem.mockResolvedValueOnce(null);
    const response = await DELETE(context(VALID_ID, "122639"), deps);
    expect(response.status).toBe(404);
  });

  test("removes the item and returns the updated summary", async () => {
    removeItem.mockResolvedValueOnce({
      _id: VALID_ID,
      deviceId: "device-a",
      name: "List",
      createdAt: "x",
      updatedAt: "x",
      schemeCodes: [],
    });
    const response = await DELETE(context(VALID_ID, "122639"), deps);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ watchlist: { count: 0 } });
  });
});
