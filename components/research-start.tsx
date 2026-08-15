"use client";

import { GitCompareArrowsIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FundSearch } from "@/components/fund-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toComparisonHref } from "@/lib/research-route-state";
import type { Scheme } from "@/lib/fund-types";

type ResearchMode = "single" | "compare";

interface ResearchStartProps {
  initialMode: ResearchMode;
}

export function ResearchStart({ initialMode }: ResearchStartProps) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [firstScheme, setFirstScheme] = useState<Scheme | null>(null);

  function chooseMode(nextMode: ResearchMode) {
    setMode(nextMode);
    setFirstScheme(null);
  }

  function chooseScheme(scheme: Scheme) {
    if (mode === "single") {
      router.push(`/fund/${scheme.schemeCode}`);
      return;
    }

    if (!firstScheme) {
      setFirstScheme(scheme);
      return;
    }

    router.push(
      toComparisonHref({
        schemeCodes: [firstScheme.schemeCode, scheme.schemeCode],
        range: "3y",
      }),
    );
  }

  return (
    <main id="main-content" className="mx-auto flex max-w-6xl flex-col px-4 py-6 sm:px-6">
      <section className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <Badge variant="secondary" className="w-fit">
          India mutual fund research · V0
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Understand a fund’s return path.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Research an active Direct Growth equity fund on its own, or compare two funds side by
          side. navnote does not provide investment advice or recommendations.
        </p>

        <fieldset
          className="mt-8 flex w-fit gap-1 rounded-lg border bg-muted/30 p-1"
          aria-label="Research type"
        >
          <Button
            type="button"
            size="sm"
            variant={mode === "single" ? "secondary" : "ghost"}
            aria-pressed={mode === "single"}
            onClick={() => chooseMode("single")}
          >
            <SearchIcon data-icon="inline-start" />
            Analyze a fund
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "compare" ? "secondary" : "ghost"}
            aria-pressed={mode === "compare"}
            onClick={() => chooseMode("compare")}
          >
            <GitCompareArrowsIcon data-icon="inline-start" />
            Compare two funds
          </Button>
        </fieldset>

        {mode === "compare" && firstScheme ? (
          <div className="mt-6 flex max-w-2xl items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Fund 1</p>
              <p className="truncate text-sm font-medium">{firstScheme.schemeName}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFirstScheme(null)}>
              <XIcon data-icon="inline-start" />
              Change
            </Button>
          </div>
        ) : null}

        <div className="mt-6">
          {mode === "compare" ? (
            <>
              <h2 className="text-sm font-medium">
                {firstScheme ? "Choose fund 2 of 2" : "Choose fund 1 of 2"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search active Direct Growth equity schemes to compare their reported data.
              </p>
            </>
          ) : (
            <h2 className="text-sm font-medium">Choose a fund to analyze</h2>
          )}
          <FundSearch
            key={`${mode}-${firstScheme?.schemeCode ?? "empty"}`}
            onSelect={chooseScheme}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Try a fund house or scheme:</span>
          {["Parag Parikh", "HDFC Flexi Cap", "SBI Contra"].map((example) => (
            <Badge key={example} variant="outline">
              {example}
            </Badge>
          ))}
        </div>
      </section>
    </main>
  );
}
