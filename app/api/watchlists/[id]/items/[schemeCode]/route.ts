import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isSchemeCode } from "@/lib/fundInput";
import { isWatchlistId } from "@/lib/watchlistInput";
import { watchlistService } from "@/lib/watchlist.service";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/watchlists/[id]/items/[schemeCode]">,
) {
  const { id, schemeCode } = await context.params;
  const deviceId = await getOrCreateDeviceId();
  if (!isWatchlistId(id) || !isSchemeCode(schemeCode)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const watchlist = await watchlistService.removeItem(deviceId, id, schemeCode);
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
