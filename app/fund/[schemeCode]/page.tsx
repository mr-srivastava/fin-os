import { FundResearchView } from "@/components/FundResearch";
import { parseFundResearchSearchParams } from "@/lib/research/researchRouteState";

export default async function FundPage({ params, searchParams }: PageProps<"/fund/[schemeCode]">) {
  const { schemeCode } = await params;
  const routeState = parseFundResearchSearchParams(await searchParams);
  return (
    <FundResearchView
      key={schemeCode}
      schemeCode={schemeCode}
      routeState={{
        ...routeState,
        against: routeState.against === schemeCode ? null : routeState.against,
      }}
    />
  );
}
