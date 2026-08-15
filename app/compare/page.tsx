import { CompareView } from "@/components/compare-view";
import { parseComparisonSearchParams } from "@/lib/research-route-state";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  return <CompareView routeState={parseComparisonSearchParams(await searchParams)} />;
}
