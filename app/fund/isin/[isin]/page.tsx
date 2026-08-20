import { notFound, redirect } from "next/navigation";
import { fundService } from "@/lib/fund.service";
import { isIsin } from "@/lib/fundInput";
import { parseFundResearchSearchParams, toFundResearchHref } from "@/lib/researchRouteState";

export default async function IsinFundPage({
  params,
  searchParams,
}: PageProps<"/fund/isin/[isin]">) {
  const { isin } = await params;
  const normalizedIsin = isin.toUpperCase();
  if (!isIsin(normalizedIsin)) notFound();
  const schemeCode = await fundService.resolveIsin(normalizedIsin);
  if (!schemeCode) notFound();
  redirect(toFundResearchHref(schemeCode, parseFundResearchSearchParams(await searchParams)));
}
