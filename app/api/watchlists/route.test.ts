import { describe, expect, test, vi } from "vitest";

const list = vi.fn();
const create = vi.fn();

vi.mock("@/lib/watchlist.service", () => ({ watchlistService: { list, create } }));
vi.mock("@/lib/deviceId", () => ({ getOrCreateDeviceId: async () => "device-a" }));

const { GET, POST } = await import("./route");

describe("GET /api/watchlists", () => {
  test("returns this device's watchlists", async () => {
    list.mockResolvedValueOnce([
      { id: "list-1", name: "Client: Sharma family", count: 3, createdAt: "x", updatedAt: "x" },
    ]);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      watchlists: [{ id: "list-1", name: "Client: Sharma family" }],
    });
    expect(list).toHaveBeenCalledWith("device-a");
  });
});

describe("POST /api/watchlists", () => {
  test("rejects an empty name", async () => {
    const response = await POST(
      new Request("http://localhost/api/watchlists", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_name" });
    expect(create).not.toHaveBeenCalled();
  });

  test("creates a watchlist for this device", async () => {
    create.mockResolvedValueOnce({
      id: "list-2",
      name: "Conservative picks Q3",
      count: 0,
      createdAt: "x",
      updatedAt: "x",
    });
    const response = await POST(
      new Request("http://localhost/api/watchlists", {
        method: "POST",
        body: JSON.stringify({ name: "Conservative picks Q3" }),
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      watchlist: { name: "Conservative picks Q3" },
    });
    expect(create).toHaveBeenCalledWith("device-a", "Conservative picks Q3");
  });
});
