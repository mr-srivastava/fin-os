import { fundService } from "@/lib/fund/fund.service";
import { ProviderError } from "@/lib/providers/provider";
import { isSchemeCode } from "@/lib/fund/fundInput";
import { toComparisonView } from "@/lib/research/research-view/comparison";

interface RouteDeps {
  getFundResearchBatch: typeof fundService.getFundResearchBatch;
}

const defaultDeps: RouteDeps = { getFundResearchBatch: fundService.getFundResearchBatch };

export async function handleGet(request: Request, deps: RouteDeps = defaultDeps) {
  const params = new URL(request.url).searchParams;
  const fund = params.get("fund") ?? "";
  const against = params.get("against") ?? "";
  if (!isSchemeCode(fund) || !isSchemeCode(against) || fund === against)
    return Response.json(
      { error: "invalid_comparison", message: "Choose two different valid fund codes." },
      { status: 400 },
    );
  try {
    const [fundResult, againstResult] = await deps.getFundResearchBatch([fund, against]);
    // SAFETY: getFundResearchBatch settles one result per input scheme code, in order.
    return Response.json(toComparisonView([fund, against], [fundResult!, againstResult!]));
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not compare these funds right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}

export async function GET(request: Request) {
  return handleGet(request);
}
