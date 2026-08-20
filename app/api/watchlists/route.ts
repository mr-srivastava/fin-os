import { parseJsonBody } from "@/lib/apiRoute";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { isWatchlistName } from "@/lib/watchlistInput";
import { WatchlistNameBodySchema } from "@/lib/watchlist.schema";
import { watchlistService } from "@/lib/watchlist.service";

interface RouteDeps {
  getDeviceId: typeof getOrCreateDeviceId;
  list: typeof watchlistService.list;
  create: typeof watchlistService.create;
}

const defaultDeps: RouteDeps = {
  getDeviceId: getOrCreateDeviceId,
  list: watchlistService.list,
  create: watchlistService.create,
};

export async function handleGet(deps: RouteDeps = defaultDeps) {
  const deviceId = await deps.getDeviceId();
  const watchlists = await deps.list(deviceId);
  return Response.json({ watchlists });
}

export async function handlePost(request: Request, deps: RouteDeps = defaultDeps) {
  const deviceId = await deps.getDeviceId();
  const body = await parseJsonBody(request, WatchlistNameBodySchema);
  const name = body?.name.trim() ?? "";
  if (!isWatchlistName(name)) {
    return Response.json(
      { error: "invalid_name", message: "Give the watchlist a name up to 80 characters." },
      { status: 400 },
    );
  }
  const watchlist = await deps.create(deviceId, name);
  return Response.json({ watchlist }, { status: 201 });
}

export async function GET() {
  return handleGet();
}

export async function POST(request: Request) {
  return handlePost(request);
}
