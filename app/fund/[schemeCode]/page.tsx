import { FundResearchView } from "@/components/fund-research";
import { parseFundResearchSearchParams } from "@/lib/research-route-state";

export default async function FundPage({ params, searchParams }: PageProps<"/fund/[schemeCode]">) {
  const { schemeCode } = await params;
  const routeState = parseFundResearchSearchParams(await searchParams);
  return <FundResearchView key={schemeCode} schemeCode={schemeCode} routeState={routeState} />;
}
