import { fundService } from "@/lib/fund/fund.service";
import { isSchemeCode } from "@/lib/fund/fundInput";
import { ProviderError } from "@/lib/providers/provider";

/** Bounds one request to the related-fund count `loadFundResearch` enriches server-side for a
 * batch load (6 peers + 6 fromAmc) - the client never has a reason to ask for more than that. */
const MAX_CODES = 12;

interface RouteDeps {
  getFundSnapshots: typeof fundService.getFundSnapshots;
}

const defaultDeps: RouteDeps = { getFundSnapshots: fundService.getFundSnapshots };

export async function handleGet(request: Request, deps: RouteDeps = defaultDeps) {
  const url = new URL(request.url);
  const codes = [...new Set(url.searchParams.get("codes")?.split(",").filter(Boolean) ?? [])];
  if (codes.length === 0 || codes.length > MAX_CODES || !codes.every(isSchemeCode)) {
    return Response.json(
      { error: "invalid_scheme_code", message: "Provide up to 12 valid AMFI scheme codes." },
      { status: 400 },
    );
  }
  try {
    const snapshots = await deps.getFundSnapshots(codes);
    return Response.json({ snapshots: Object.fromEntries(snapshots) });
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not load related funds right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}

export async function GET(request: Request) {
  return handleGet(request);
}
