# Architecture

navnote uses Next.js App Router to keep third-party market-data requests on the
server while providing a responsive, client-rendered research experience. This
document describes the current V0 boundaries so you can change the app without
blending provider, API, and presentation concerns.

## Request flow

The browser never calls a market-data provider directly. It queries local API
routes, which validate parameters and orchestrate provider requests.

```text
Browser
  -> /api/schemes?q=... -> FinAPI search -> eligible schemes
  -> /api/funds/:schemeCode
       -> FinAPI fund facts and portfolio
       -> TigZig NAV history
       -> TigZig Nifty 500 benchmark
       -> normalized FundResearch response
```

The search experience uses `GET /api/schemes?q=<query>`. It accepts a trimmed
query of 2–80 characters and returns at most 12 eligible schemes. Fund research
uses `GET /api/funds/<schemeCode>`, where the scheme code must contain 4–7
digits.

## Provider boundaries

`lib/finapi.ts` owns FinAPI requests and normalizes the provider's variable
payload into internal types. It also starts the concurrent TigZig NAV and
benchmark requests for a fund detail response. `lib/tigzig-nav.ts` owns the
TigZig request and payload parsing. Both provider adapters use a 10-second
timeout and Next.js revalidation of 300 seconds.

If the FinAPI fund request fails, the detail endpoint returns an error. If
TigZig history fails, the endpoint returns the available facts and portfolio
data together with explicit NAV unavailability metadata. The UI must retain
that degraded behavior.

## Data contracts

`lib/fund-types.ts` defines the internal `FundResearch` contract. Its
`availability` field independently represents NAV history, fund facts, and
portfolio data, allowing the interface to distinguish unavailable data from a
zero or empty value.

`lib/fund-schemas.ts` defines Valibot schemas for browser-facing API responses.
`lib/fund-api.ts` validates every client response against those schemas before
TanStack Query exposes it to UI components. When changing a response, update
the type, schema, route, consumer, and tests as one change.

## Presentation layers

Pages in `app/` are thin route entry points. `components/fund-research.tsx`
renders an individual fund, and `components/compare-view.tsx` renders a
two-fund comparison. Shared calculations live in `lib/analytics.ts`; use those
helpers rather than duplicating return, drawdown, volatility, normalization, or
range-selection logic in components.

## Operational controls

Set `FINAPI_PORTFOLIO_ENABLED=false` to suppress portfolio data. The app still
returns and displays scheme facts and, when available, NAV research. This is
useful if the portfolio provider response is temporarily unsuitable for display.

## Next steps

Read [the development guide](development.md) for local setup and the change
workflow. For product-level onboarding, start with the repository
[README](../README.md).
