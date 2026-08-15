import { redirect } from "next/navigation";
import { CompareView } from "@/components/compare-view";
import { parseComparisonSearchParams } from "@/lib/research-route-state";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const routeState = parseComparisonSearchParams(await searchParams);
  if (routeState.schemeCodes.length !== 2) redirect("/?mode=compare");
  return <CompareView routeState={routeState} />;
}
