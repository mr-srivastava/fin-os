"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { watchlistsQueryOptions } from "@/lib/watchlist.queries";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

export function SiteHeader() {
  const watchlistsQuery = useQuery(watchlistsQueryOptions);
  const totalWatchlists = watchlistsQuery.data?.watchlists.length ?? 0;

  return (
    <header className="border-b border-border/60 px-4 py-5 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between"
      >
        <Link
          href="/"
          className="font-heading text-xl font-medium tracking-tight text-foreground italic"
        >
          navnote<span className="text-brand not-italic">.</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore
          </Link>
          <Link
            href="/watchlists"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Watchlists
            {totalWatchlists > 0 ? <Badge variant="secondary">{totalWatchlists}</Badge> : null}
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
