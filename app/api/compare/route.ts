import { fundService } from "@/lib/fund.service";
import { ProviderError } from "@/lib/provider";
import { isSchemeCode } from "@/lib/fundInput";
import { toComparisonView } from "@/lib/research-view/comparison";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const fund = params.get("fund") ?? "";
  const against = params.get("against") ?? "";
  if (!isSchemeCode(fund) || !isSchemeCode(against) || fund === against)
    return Response.json(
      { error: "invalid_comparison", message: "Choose two different valid fund codes." },
      { status: 400 },
    );
  try {
    return Response.json(
      toComparisonView([fund, against], await fundService.getFundResearchBatch([fund, against])),
    );
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
