import { catalogService } from "@/lib/catalog.service";
import { ProviderError } from "@/lib/provider";
import { isEquityCategory } from "@/lib/fundCategories";

interface RouteDeps {
  listByCategory: typeof catalogService.listByCategory;
}

const defaultDeps: RouteDeps = { listByCategory: catalogService.listByCategory };

export async function handleGet(request: Request, deps: RouteDeps = defaultDeps) {
  const category = new URL(request.url).searchParams.get("category")?.trim() ?? "";
  if (!isEquityCategory(category)) {
    return Response.json(
      { error: "invalid_query", message: "Choose a supported equity category." },
      { status: 400 },
    );
  }
  try {
    return Response.json({ category, schemes: await deps.listByCategory(category) });
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

export async function GET(request: Request) {
  return handleGet(request);
}
