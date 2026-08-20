import * as v from "valibot";

import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isSchemeCode, SchemeCodeBodySchema } from "@/lib/fundInput";
import { isWatchlistId } from "@/lib/watchlistInput";
import { watchlistService, WATCHLIST_ITEM_LIMIT_REACHED } from "@/lib/watchlist.service";
import { WATCHLIST_MAX_ITEMS } from "@/lib/watchlistInput";

interface RouteDeps {
  getDeviceId: typeof getOrCreateDeviceId;
  addItem: typeof watchlistService.addItem;
}

const defaultDeps: RouteDeps = {
  getDeviceId: getOrCreateDeviceId,
  addItem: watchlistService.addItem,
};

export async function handlePost(
  request: Request,
  context: RouteContext<"/api/watchlists/[id]/items">,
  deps: RouteDeps = defaultDeps,
) {
  const { id } = await context.params;
  const deviceId = await deps.getDeviceId();
  if (!isWatchlistId(id)) {
    return Response.json({ error: "not_found", message: "Watchlist not found." }, { status: 404 });
  }
  const parsed = v.safeParse(SchemeCodeBodySchema, await request.json().catch(() => null));
  const schemeCode = parsed.success ? parsed.output.schemeCode : "";
  if (!isSchemeCode(schemeCode)) {
    return Response.json(
      { error: "invalid_scheme_code", message: "Fund code must be a valid AMFI scheme code." },
      { status: 400 },
    );
  }
  const watchlist = await deps.addItem(deviceId, id, schemeCode);
  if (watchlist === WATCHLIST_ITEM_LIMIT_REACHED) {
    return Response.json(
      {
        error: "watchlist_item_limit_reached",
        message: `Watchlists are limited to ${WATCHLIST_MAX_ITEMS} funds.`,
      },
      { status: 400 },
    );
  }
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

export async function POST(request: Request, context: RouteContext<"/api/watchlists/[id]/items">) {
  return handlePost(request, context);
}
