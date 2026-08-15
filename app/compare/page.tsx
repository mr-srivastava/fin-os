import { redirect } from "next/navigation";
import { parseComparisonSearchParams, toFundResearchHref } from "@/lib/research-route-state";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const routeState = parseComparisonSearchParams(await searchParams);
  const [fund, against] = routeState.schemeCodes;
  if (!fund || !against) redirect("/");
  redirect(
    toFundResearchHref(fund, {
      range: routeState.range,
      showBenchmark: false,
      against,
    }),
  );
}
