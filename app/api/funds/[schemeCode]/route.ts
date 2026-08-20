import { fundService } from "@/lib/fund.service";
import { ProviderError } from "@/lib/provider";
import { isSchemeCode } from "@/lib/fundInput";
import { toFundResearchView } from "@/lib/research-view/fund";

export async function GET(_request: Request, context: RouteContext<"/api/funds/[schemeCode]">) {
  const { schemeCode } = await context.params;
  if (!isSchemeCode(schemeCode)) {
    return Response.json(
      { error: "invalid_scheme_code", message: "Fund code must be a valid AMFI scheme code." },
      { status: 400 },
    );
  }
  try {
    const fund = await fundService.getFundResearch(schemeCode);
    if (!fund)
      return Response.json(
        { error: "not_found", message: "This is not an active Direct Growth equity scheme in V0." },
        { status: 404 },
      );
    return Response.json(toFundResearchView(fund));
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not load this fund right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}
