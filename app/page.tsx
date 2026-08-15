import { ResearchStart } from "@/components/research-start";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { mode } = await searchParams;
  return <ResearchStart initialMode={mode === "compare" ? "compare" : "single"} />;
}
