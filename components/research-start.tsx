"use client";

import { CategoryExplorer } from "@/components/category-explorer";
import { FundSearch } from "@/components/fund-search";
import { Separator } from "@/components/ui/separator";

// Illustrative only — not a real NAV series. Renders the hero's ledger sparkline.
const RETURN_PATH = [
  0, 4, 2, 9, 6, 14, 11, 19, 15, 24, 20, 29, 33, 27, 38, 34, 44, 40, 50, 46, 58, 63, 57, 68, 74,
];

function ReturnPathMark() {
  const width = 640;
  const height = 220;
  const max = Math.max(...RETURN_PATH);
  const min = Math.min(...RETURN_PATH);
  const stepX = width / (RETURN_PATH.length - 1);
  const toY = (value: number) => height - ((value - min) / (max - min)) * (height - 24) - 12;
  const points = RETURN_PATH.map((value, index) => [index * stepX, toY(value)] as const);
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="return-path-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.2, 0.4, 0.6, 0.8].map((fraction) => (
        <line
          key={fraction}
          x1={0}
          x2={width}
          y1={height * fraction}
          y2={height * fraction}
          stroke="var(--border)"
          strokeDasharray="2 6"
        />
      ))}
      <path d={fillPath} fill="url(#return-path-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={points.at(-1)?.[0]} cy={points.at(-1)?.[1]} r={4.5} fill="var(--primary)" />
    </svg>
  );
}

export function ResearchStart() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
            Fund research, not fund advice
          </p>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
            Understand a fund’s <em className="text-primary not-italic">return path.</em>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Look up a known fund or browse the eligible equity universe. navnote helps you research
            data; it does not rate, rank, or recommend funds.
          </p>

          <div className="mt-8">
            <h2 className="text-sm font-medium">Search a specific fund</h2>
            <FundSearch />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Examples:</span>
            {["Parag Parikh", "HDFC Flexi Cap", "SBI Contra"].map((example) => (
              <span key={example}>{example}</span>
            ))}
          </div>
        </div>

        <div
          className="ledger-rule hidden h-56 w-80 shrink-0 rounded-md border border-border/70 bg-card/40 p-4 lg:block"
          aria-hidden="true"
        >
          <ReturnPathMark />
        </div>
      </section>
      <Separator />
      <section id="explore" className="scroll-mt-6 py-12 sm:py-16">
        <CategoryExplorer />
      </section>
    </main>
  );
}
