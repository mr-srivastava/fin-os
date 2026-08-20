import { parseJsonBody } from "@/lib/apiRoute";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isWatchlistId, isWatchlistName } from "@/lib/watchlistInput";
import { WatchlistNameBodySchema } from "@/lib/watchlist.schema";
import { watchlistService } from "@/lib/watchlist.service";
import { fundService } from "@/lib/fund.service";
import { toWatchlistItemSummary } from "@/lib/watchlistView";

interface RouteDeps {
  getDeviceId: typeof getOrCreateDeviceId;
  get: typeof watchlistService.get;
  rename: typeof watchlistService.rename;
  remove: typeof watchlistService.remove;
  getFundResearchBatch: typeof fundService.getFundResearchBatch;
}

const defaultDeps: RouteDeps = {
  getDeviceId: getOrCreateDeviceId,
  get: watchlistService.get,
  rename: watchlistService.rename,
  remove: watchlistService.remove,
  getFundResearchBatch: fundService.getFundResearchBatch,
};

export async function handleGet(
  context: RouteContext<"/api/watchlists/[id]">,
  deps: RouteDeps = defaultDeps,
) {
  const { id } = await context.params;
  const deviceId = await deps.getDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const watchlist = await deps.get(deviceId, id);
  if (!watchlist) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const results = watchlist.schemeCodes.length
    ? await deps.getFundResearchBatch(watchlist.schemeCodes)
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

export async function handlePatch(
  request: Request,
  context: RouteContext<"/api/watchlists/[id]">,
  deps: RouteDeps = defaultDeps,
) {
  const { id } = await context.params;
  const deviceId = await deps.getDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const body = await parseJsonBody(request, WatchlistNameBodySchema);
  const name = body?.name.trim() ?? "";
  if (!isWatchlistName(name)) {
    return Response.json(
      { error: "invalid_name", message: "Give the watchlist a name up to 80 characters." },
      { status: 400 },
    );
  }
  const watchlist = await deps.rename(deviceId, id, name);
  if (!watchlist) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  return Response.json({ watchlist });
}

export async function handleDelete(
  context: RouteContext<"/api/watchlists/[id]">,
  deps: RouteDeps = defaultDeps,
) {
  const { id } = await context.params;
  const deviceId = await deps.getDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const deleted = await deps.remove(deviceId, id);
  if (!deleted) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}

export async function GET(_request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  return handleGet(context);
}

export async function PATCH(request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  return handlePatch(request, context);
}

export async function DELETE(_request: Request, context: RouteContext<"/api/watchlists/[id]">) {
  return handleDelete(context);
}
