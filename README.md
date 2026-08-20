# MF OS

MF OS is a research tool for active, Direct Growth Indian equity mutual funds.
It's built for distributors doing due diligence, not for retail investors
looking for a buy signal: it shows you what a fund's numbers are and how they
compare, but it never tells you whether a fund is good, bad, or worth
choosing.

It is a research tool, not investment advice. Data can be incomplete,
delayed, or temporarily unavailable. Verify anything here with the fund house
before making an investment decision.

## What you can do

- **Search or browse** the catalogue of eligible schemes by name or by
  category.
- **Research a fund** — NAV history, calculated return and risk metrics,
  fund facts, and reported portfolio holdings, plus related funds (peers and
  other funds from the same AMC) to check next.
- **Compare two funds** side by side on the same normalized return path.
- **Save funds to a watchlist** so you can come back to them later. Watchlists
  don't need an account: they're tied to your browser.
- **Look up a fund by ISIN**, if that's what you have on hand instead of a
  scheme code.

Every page tells you when data is missing or stale rather than guessing or
filling in a gap silently. See [Data and limitations](/data-and-limitations)
in the app for the current detail on provider coverage and freshness.

## Healthcheck

[![Netlify Status](https://api.netlify.com/api/v1/badges/15ee1367-a1e5-425e-b6a6-642fd4260694/deploy-status)](https://app.netlify.com/projects/mfops/deploys)

## Contributing

This repository is the Next.js application MF OS runs on. To set it up
locally, run the test suite, or understand how a change should be scoped,
start with [the development guide](docs/development.md).

- [docs/development.md](docs/development.md) — local setup, environment
  configuration, and the checks to run before opening a pull request.
- [docs/architecture.md](docs/architecture.md) — request flow, provider
  boundaries, and data contracts.
- [DESIGN.md](DESIGN.md) — visual and content conventions.
- [AGENTS.md](AGENTS.md) — product boundaries and working rules for
  contributors and coding agents.
