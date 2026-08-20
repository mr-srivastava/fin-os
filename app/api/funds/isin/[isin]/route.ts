import { fundService } from "@/lib/fund/fund.service";
import { ProviderError } from "@/lib/providers/provider";
import { isIsin } from "@/lib/fund/fundInput";

export async function GET(_request: Request, context: RouteContext<"/api/funds/isin/[isin]">) {
  const { isin } = await context.params;
  const normalizedIsin = isin.toUpperCase();
  if (!isIsin(normalizedIsin))
    return Response.json(
      { error: "invalid_isin", message: "ISIN must be a valid Indian mutual-fund identifier." },
      { status: 400 },
    );
  try {
    const schemeCode = await fundService.resolveIsin(normalizedIsin);
    if (!schemeCode)
      return Response.json(
        {
          error: "not_found",
          message: "This ISIN does not resolve to an active Direct Growth equity scheme in V0.",
        },
        { status: 404 },
      );
    return Response.json({ schemeCode });
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not resolve this ISIN right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}
