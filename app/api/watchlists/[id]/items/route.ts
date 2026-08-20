import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isSchemeCode } from "@/lib/fundInput";
import { isWatchlistId } from "@/lib/watchlistInput";
import { watchlistService } from "@/lib/watchlist.service";

export async function POST(request: Request, context: RouteContext<"/api/watchlists/[id]/items">) {
  const { id } = await context.params;
  const deviceId = await getOrCreateDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const body: unknown = await request.json().catch(() => null);
  const schemeCode =
    body && typeof body === "object" && "schemeCode" in body && typeof body.schemeCode === "string"
      ? body.schemeCode
      : "";
  if (!isSchemeCode(schemeCode)) {
    return Response.json(
      { error: "invalid_scheme_code", message: "Fund code must be a valid AMFI scheme code." },
      { status: 400 },
    );
  }
  const watchlist = await watchlistService.addItem(deviceId, id, schemeCode);
  if (!watchlist) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  return Response.json({
    watchlist: {
      id: watchlist._id,
      name: watchlist.name,
      count: watchlist.schemeCodes.length,
      createdAt: watchlist.createdAt,
      updatedAt: watchlist.updatedAt,
    },
  });
}
