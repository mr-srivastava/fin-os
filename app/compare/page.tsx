import { CompareView } from "@/components/compare-view";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const { fund, against } = await searchParams;
  const initialSelection = {
    ...(typeof fund === "string" ? { initialFund: fund } : {}),
    ...(typeof against === "string" ? { initialAgainst: against } : {}),
  };
  return <CompareView {...initialSelection} />;
}
