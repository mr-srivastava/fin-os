import { getOrCreateDeviceId } from "@/lib/device-id";
import { isWatchlistName } from "@/lib/watchlist-input";
import { watchlistService } from "@/lib/watchlist-service";

export async function GET() {
  const deviceId = await getOrCreateDeviceId();
  const watchlists = await watchlistService.list(deviceId);
  return Response.json({ watchlists });
}

export async function POST(request: Request) {
  const deviceId = await getOrCreateDeviceId();
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
  const watchlist = await watchlistService.create(deviceId, name);
  return Response.json({ watchlist }, { status: 201 });
}
