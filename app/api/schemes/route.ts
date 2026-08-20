import { catalogService } from "@/lib/catalog/catalog.service";
import { ProviderError } from "@/lib/providers/provider";
import { isSearchQuery } from "@/lib/fund/fundInput";

interface RouteDeps {
  search: typeof catalogService.search;
}

const defaultDeps: RouteDeps = { search: catalogService.search };

export async function handleGet(request: Request, deps: RouteDeps = defaultDeps) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!isSearchQuery(query)) {
    return Response.json(
      { error: "invalid_query", message: "Enter 2–80 characters to search funds." },
      { status: 400 },
    );
  }
  try {
    return Response.json({ schemes: await deps.search(query) });
  } catch (error) {
    const provider =
      error instanceof ProviderError
        ? error
        : new ProviderError("We could not search funds right now.");
    return Response.json(
      { error: "provider_error", message: provider.message },
      { status: provider.status },
    );
  }
}

export async function GET(request: Request) {
  return handleGet(request);
}
