import { normalizeFundPayload } from "../lib/finapi-service.ts";
import { annualizedReturn } from "../lib/analytics.ts";
import { getTigzigNav } from "../lib/tigzig-service.ts";

const schemes = [
  ["PPFAS Flexi Cap", "122639"],
  ["HDFC Flexi Cap", "118955"],
  ["ICICI Prudential Equity", "148990"],
  ["SBI Small Cap", "119718"],
  ["Kotak Mid Cap", "120166"],
] as const;

async function inspect(name: string, schemeCode: string) {
  const [response, nav] = await Promise.all([
    fetch(`https://finapi.upvaly.com/api/mf/scheme-code/${schemeCode}`),
    getTigzigNav(schemeCode),
  ]);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const fund = normalizeFundPayload(await response.json());
  if (!fund) throw new Error(`${name}: did not return an eligible Direct Growth target scheme`);
  return {
    scheme: name,
    code: schemeCode,
    finapiFacts: fund.availability.facts.available ? "yes" : "no",
    portfolioDate: fund.portfolio?.asOf ?? "not supplied",
    portfolioEnabled: fund.availability.portfolio.available ? "yes" : "no",
    holdings: fund.portfolio?.holdings.length ?? 0,
    tigzigNavDate: nav.at(-1)?.date ?? "missing",
    tigzigNavRows: nav.length,
    fiveYearMetric: annualizedReturn(nav, 5) === null ? "unavailable" : "yes",
  };
}

async function main() {
  const results = await Promise.allSettled(
    schemes.map(([name, schemeCode]) => inspect(name, schemeCode)),
  );
  const rows = results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          scheme: schemes[index]?.[0] ?? "Unknown scheme",
          code: schemes[index]?.[1] ?? "unknown",
          finapiFacts: "error",
          portfolioDate: result.reason instanceof Error ? result.reason.message : "error",
          portfolioEnabled: "no",
          holdings: 0,
          tigzigNavDate: "error",
          tigzigNavRows: 0,
          fiveYearMetric: "error",
        },
  );
  console.table(rows);
  if (results.some((result) => result.status === "rejected")) process.exitCode = 1;
}

void main();
