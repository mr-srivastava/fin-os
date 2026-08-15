import { FundResearchView } from "@/components/fund-research";

export default async function FundPage({ params, searchParams }: PageProps<"/fund/[schemeCode]">) {
  const { schemeCode } = await params;
  const { range, benchmark } = await searchParams;
  const initialChartState = {
    ...(typeof range === "string" ? { initialRange: range } : {}),
    ...(benchmark === "1" ? { initialShowBenchmark: true } : {}),
  };
  return <FundResearchView key={schemeCode} schemeCode={schemeCode} {...initialChartState} />;
}
