import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const externalLinkClassName = "font-medium text-foreground underline underline-offset-4";

export default function DataAndLimitationsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeftIcon data-icon="inline-start" />
        Search funds
      </Link>
      <header className="mt-10">
        <p className="text-sm font-medium text-muted-foreground">About navnote data</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Data and limitations
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          navnote is a research tool for exploring Indian equity mutual funds. It does not provide
          investment advice or recommendations.
        </p>
      </header>
      <div className="mt-10 space-y-10 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">What is included</h2>
          <p className="mt-3">
            navnote covers active Direct Growth schemes in supported equity categories. You can view
            NAV performance, selected fund details, and reported portfolio allocations when data is
            available.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Data sources</h2>
          <p className="mt-3">
            NAV history and the Nifty 500 benchmark are provided by TigZig. Scheme discovery, fund
            details, and reported portfolio data are provided by FinAPI.
          </p>
          <p className="mt-3">
            <a
              className={externalLinkClassName}
              href="https://www.tigzig.com/apis/mf-nav"
              target="_blank"
              rel="noreferrer"
            >
              TigZig NAV data
            </a>{" "}
            ·{" "}
            <a
              className={externalLinkClassName}
              href="https://finapi.upvaly.com/"
              target="_blank"
              rel="noreferrer"
            >
              FinAPI fund data
            </a>
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            How to read the data
          </h2>
          <p className="mt-3">
            Returns, volatility, and drawdown are calculated from available NAV history. The growth
            illustration is based on NAV movement over the selected period and excludes taxes and
            transaction costs. Past performance does not predict future outcomes.
          </p>
          <p className="mt-3">
            Portfolio data is a reported snapshot, not a live view of holdings. When a report date
            is available, navnote shows it alongside the portfolio; otherwise it identifies that the
            report date is unavailable.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Availability and scope
          </h2>
          <p className="mt-3">
            Data can be delayed, incomplete, or temporarily unavailable. NAV history, fund details,
            and portfolio data may be available independently, so some parts of a fund&apos;s
            research page can remain visible when another part cannot be shown.
          </p>
          <p className="mt-3">
            navnote does not provide ratings, rankings, recommendations, portfolio-overlap analysis,
            or claims about portfolio changes. Verify important information with the fund house
            before making an investment decision.
          </p>
        </section>
      </div>
    </main>
  );
}
