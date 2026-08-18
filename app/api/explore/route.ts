import { catalogService } from "@/lib/catalog-service";
import { ProviderError } from "@/lib/provider";
import { isEquityCategory } from "@/lib/fund-categories";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category")?.trim() ?? "";
  if (!isEquityCategory(category)) {
    return Response.json(
      { error: "invalid_query", message: "Choose a supported equity category." },
      { status: 400 },
    );
  }
  try {
    return Response.json({ category, schemes: await catalogService.listByCategory(category) });
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not load this category right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}
