import { catalogService } from "@/lib/catalog-service";
import { ProviderError } from "@/lib/provider";
import { isSearchQuery } from "@/lib/fund-input";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!isSearchQuery(query)) {
    return Response.json(
      { error: "invalid_query", message: "Enter 2–80 characters to search funds." },
      { status: 400 },
    );
  }
  try {
    return Response.json({ schemes: await catalogService.search(query) });
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
