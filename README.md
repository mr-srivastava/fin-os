# navnote

navnote is a research interface for active, Direct Growth Indian equity mutual
funds. You can search or browse eligible schemes, examine their NAV history and
calculated performance characteristics, review available fund facts and
portfolio data, compare two funds side by side, and save funds to a
device-scoped watchlist.

It is a research tool, not investment advice. Data can be incomplete, delayed,
or temporarily unavailable. Verify information with the fund house before making
an investment decision.

## Run the project

You need Node.js 24, pnpm 11.18.0, and a MongoDB instance for the scheme
catalogue and watchlists. The application does not require local credentials
for its current public data providers.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set `MONGODB_URI` and `MONGODB_DB` in `.env.local`, then populate the
   catalogue:

   ```bash
   pnpm catalog:refresh
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

See [the development guide](docs/development.md#environment-configuration) for
full environment setup, including a local MongoDB via Docker.

## Validate changes

Run the checks that match your change before opening a pull request.

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm format:check
pnpm build
```

`pnpm preflight:finapi` makes live requests to the upstream providers and
reports whether a small set of representative schemes still returns usable
research data. Run it when changing provider integration or before a deployment
that depends on fresh provider behavior.

`pnpm test` runs deterministic unit and route tests. `pnpm test:e2e` runs the
browser smoke tests and requires Playwright's Chromium browser. Install it once
with `pnpm exec playwright install chromium`.

## Data and scope

navnote deliberately limits its V0 search results to schemes that are active,
Direct, Growth, and within the supported equity categories. The app combines:

- A MongoDB-backed catalogue (refreshed from TigZig) for scheme search and
  category browsing.
- FinAPI for fund facts and reported portfolio data.
- TigZig for up to five years of NAV history and verified total-return
  benchmark histories when available.

Watchlists are stored in the same MongoDB instance, scoped to an anonymous
per-browser device cookie. There is no account system, so a watchlist is only
reachable from the browser that created it.

Server-side requests time out after 10 seconds and are revalidated every five
minutes. If TigZig data is unavailable, fund facts can still render, but
NAV-derived charts and metrics are unavailable. A fund's declared benchmark
remains visible in its facts, but the benchmark chart is hidden unless a
verified total-return history is available. You can set
`FINAPI_PORTFOLIO_ENABLED=false` to hide portfolio data while retaining the
rest of the research experience.

## Project map

The project uses the Next.js App Router and TypeScript.

- `app/` contains routes, pages, and server-side API endpoints.
- `components/` contains the client-side research, search, comparison, and UI
  components.
- `lib/` contains provider adapters, the Mongo-backed catalogue and watchlist
  services, runtime schemas, data types, and analytics.
- `scripts/preflight-finapi.ts` probes the live provider integration.
- `scripts/catalog-refresh.ts` rebuilds the scheme catalogue in MongoDB.

For implementation details, see [the architecture guide](docs/architecture.md)
and [the development guide](docs/development.md). Contributors and coding agents
should also read [AGENTS.md](AGENTS.md).

## Next steps

Start the app, search for an eligible scheme, and use the **Compare funds**
action to evaluate two funds on the same normalized return path.
