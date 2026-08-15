import { CompareView } from "@/components/compare-view";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { fund, against, range } = await searchParams;
  const initialSelection = {
    ...(typeof fund === "string" ? { initialFund: fund } : {}),
    ...(typeof against === "string" ? { initialAgainst: against } : {}),
    ...(typeof range === "string" ? { initialRange: range } : {}),
  };
  return <CompareView {...initialSelection} />;
}
