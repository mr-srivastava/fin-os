import { notFound, redirect } from "next/navigation";
import { resolveIsin } from "@/lib/finapi";
import { isIsin } from "@/lib/fund-input";
import { parseFundResearchSearchParams, toFundResearchHref } from "@/lib/research-route-state";

export default async function IsinFundPage({
  params,
  searchParams,
}: PageProps<"/fund/isin/[isin]">) {
  const { isin } = await params;
  const normalizedIsin = isin.toUpperCase();
  if (!isIsin(normalizedIsin)) notFound();
  const schemeCode = await resolveIsin(normalizedIsin);
  if (!schemeCode) notFound();
  redirect(toFundResearchHref(schemeCode, parseFundResearchSearchParams(await searchParams)));
}
