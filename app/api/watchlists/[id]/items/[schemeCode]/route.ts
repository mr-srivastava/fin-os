import { getOrCreateDeviceId } from "@/lib/shared/deviceId";
import { isSchemeCode } from "@/lib/fund/fundInput";
import { isWatchlistId } from "@/lib/watchlist/watchlistInput";
import { watchlistService } from "@/lib/watchlist/watchlist.service";

interface RouteDeps {
  getDeviceId: typeof getOrCreateDeviceId;
  removeItem: typeof watchlistService.removeItem;
}

const defaultDeps: RouteDeps = {
  getDeviceId: getOrCreateDeviceId,
  removeItem: watchlistService.removeItem,
};

export async function handleDelete(
  context: RouteContext<"/api/watchlists/[id]/items/[schemeCode]">,
  deps: RouteDeps = defaultDeps,
) {
  const { id, schemeCode } = await context.params;
  const deviceId = await deps.getDeviceId();
  if (!isWatchlistId(id) || !isSchemeCode(schemeCode)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const watchlist = await deps.removeItem(deviceId, id, schemeCode);
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

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/watchlists/[id]/items/[schemeCode]">,
) {
  return handleDelete(context);
}
