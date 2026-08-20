import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isWatchlistId, isWatchlistName } from "@/lib/watchlistInput";
import { watchlistService } from "@/lib/watchlist.service";
import { fundService } from "@/lib/fund.service";
import { toWatchlistItemSummary } from "@/lib/watchlistView";

export async function GET(_request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  const { id } = await context.params;
  const deviceId = await getOrCreateDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const watchlist = await watchlistService.get(deviceId, id);
  if (!watchlist) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const results = watchlist.schemeCodes.length
    ? await fundService.getFundResearchBatch(watchlist.schemeCodes)
    : [];
  const funds = results.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [toWatchlistItemSummary(result.value)] : [],
  );
  const unavailableSchemeCodes = watchlist.schemeCodes.filter(
    (schemeCode) => !funds.some((fund) => fund.schemeCode === schemeCode),
  );
  return Response.json({
    watchlist: {
      id: watchlist._id,
      name: watchlist.name,
      count: watchlist.schemeCodes.length,
      createdAt: watchlist.createdAt,
      updatedAt: watchlist.updatedAt,
    },
    funds,
    unavailableSchemeCodes,
  });
}

export async function PATCH(request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  const { id } = await context.params;
  const deviceId = await getOrCreateDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const body: unknown = await request.json().catch(() => null);
  const name =
    body && typeof body === "object" && "name" in body && typeof body.name === "string"
      ? body.name.trim()
      : "";
  if (!isWatchlistName(name)) {
    return Response.json(
      { error: "invalid_name", message: "Give the watchlist a name up to 80 characters." },
      { status: 400 },
    );
  }
  const watchlist = await watchlistService.rename(deviceId, id, name);
  if (!watchlist) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  return Response.json({ watchlist });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  const { id } = await context.params;
  const deviceId = await getOrCreateDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const deleted = await watchlistService.remove(deviceId, id);
  if (!deleted) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
