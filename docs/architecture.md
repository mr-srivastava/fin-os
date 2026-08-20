# Architecture

MF OS uses Next.js App Router to keep third-party market-data requests on the
server while providing a responsive, client-rendered research experience. This
document describes the current V0 boundaries so you can change the app without
blending provider, API, and presentation concerns.

## Request flow

The browser never calls a market-data provider directly. It queries local API
routes, which validate parameters and orchestrate provider requests.

```text
Browser
  -> /api/schemes?q=...        -> catalogue search (Mongo)  -> eligible schemes
  -> /api/explore?category=... -> catalogue browse (Mongo)  -> eligible schemes
  -> /api/funds/:schemeCode
       -> FinAPI fund facts and portfolio
       -> TigZig NAV history
       -> verified FinAPI total-return benchmark, when mapped
       -> FinAPI rolling-return and related-fund enrichment, when available
       -> semantic single-fund research view
  -> /api/compare?fund=...&against=...
       -> concurrent two-fund research without benchmark requests
       -> semantic comparison view, including partial availability
  -> /api/funds/related-snapshots?codes=...
       -> batched FinAPI lookup for up to 12 scheme codes
       -> lightweight snapshots for related-fund rails (peers, from the same AMC)
  -> /api/funds/isin/:isin      -> scheme-code lookup (Mongo)  -> redirect target
  -> /api/watchlists[...]       -> device-scoped CRUD (Mongo)  -> watchlist data
```

The search experience uses `GET /api/schemes?q=<query>`. It accepts a trimmed
query of 2–80 characters and returns at most 12 eligible schemes, read from the
catalogue rather than FinAPI directly. `GET /api/explore?category=<category>`
browses the catalogue by one supported equity category. Fund research uses
`GET /api/funds/<schemeCode>`, where the scheme code must contain 4–7 digits.
It returns the browser-facing research view rather than the internal
provider-normalized resource - and still calls FinAPI and TigZig live, since
the catalogue only covers discovery, not fund detail. Comparisons use
`GET /api/compare` with two different 4–7 digit scheme codes. A valid
comparison request returns section availability in its body even when one
selected fund cannot be loaded.

## Provider boundaries

`lib/finapi.service.ts` and `lib/tigzig.service.ts` wrap every endpoint the app
uses on each provider - FinAPI's scheme search/browse, fund research, and
index TRI series; TigZig's NAV history, market/TRI series, and scheme
catalogue - and normalize each provider's variable payload into internal
types. Fund research starts the concurrent TigZig NAV request and, when the
fund's declared benchmark has a verified total-return mapping, a FinAPI TRI
request. `lib/benchmarkCatalog.ts` is server-only and contains only verified
total-return mappings. Both provider services use a 10-second timeout and
Next.js revalidation of 300 seconds.

**Neither provider service, nor `lib/mongo.ts`, is imported from `app/`.**
Route handlers and pages only ever import one of two UI-facing facades:
`lib/catalog.service.ts` (discovery) or `lib/fund.service.ts` (live per-scheme
lookup) - see the next two sections. This keeps the provider/DB layer free to
change without touching UI code, and keeps each facade's responsibility
legible from its name.

If the FinAPI fund request fails, the detail endpoint returns an error. If
TigZig history fails, the endpoint returns the available facts and portfolio
data together with explicit NAV unavailability metadata. The UI must retain
that degraded behavior.

## Scheme catalogue

`lib/catalog.service.ts` builds, persists, and serves the eligible-scheme
catalogue in MongoDB (`lib/mongo.ts`). It is TigZig-primary:
`tigzigService.fetchCatalogue()` supplies structural fields and liveness
(`isActive`/`isStale`) for every Direct+Growth scheme in a supported equity
category, exact-matched on TigZig's SEBI `category_sub` label. FinAPI is never
a gate in the catalogue - a passive `finapiCrossCheck` field is reserved for a
future drift-sample comparison, not an eligibility filter. A refresh
(`pnpm catalog:refresh`, calling `catalogService.refresh()`) writes new
documents under a fresh `catalogueVersion`, atomically flips the
`catalogue_meta` "current" pointer, then removes prior-version documents - so
a reader querying by the current version never observes a half-written
catalogue. `/api/schemes` and `/api/explore` read the catalogue directly via
`catalogService.search()`/`catalogService.listByCategory()`; neither calls
FinAPI. See [lib/fundCatalog.types.ts](../lib/fundCatalog.types.ts) for the
full record shape.

## Fund service

`lib/fund.service.ts` is the UI-facing facade for live, per-scheme lookups -
fund research, batched fund research for comparisons, and ISIN resolution. It
is a thin pass-through to `finapiService`; it holds no logic of its own and
exists only so route handlers never import `finapi-service.ts` directly.
`/api/funds/:schemeCode`, `/api/compare`, `/api/funds/isin/:isin`, and the
`/fund/isin/:isin` redirect page all call `fundService` rather than
`finapiService`.

`GET /api/funds/related-snapshots?codes=<schemeCode,...>` batches up to 12
scheme codes into one FinAPI lookup and returns a snapshot per code, keyed by
scheme code. It backs the related-fund rails (peer funds, other funds from the
same AMC) that `loadFundResearch` enriches server-side on the single-fund
research view, so the client can hydrate those rails without a request per
fund.

`GET /api/funds/isin/:isin` resolves an ISIN to a scheme code via the
catalogue (Mongo), not FinAPI. The `/fund/isin/:isin` page is a thin
server-side redirect to `/fund/:schemeCode` once resolved, which lets external
links reference a fund by ISIN even though every other route in the app keys
on scheme code.

## Watchlists

Watchlists let a visitor save funds to a device-scoped list without an account.
`lib/deviceId.ts` issues an anonymous `nn_device_id` cookie (httpOnly,
two-year expiry) on first use; every watchlist read and write is scoped to that
id, and there is no authentication in front of it - a request for another
device's watchlist id must behave exactly as if it does not exist.
`lib/watchlist.service.ts` is Mongo-backed CRUD (collection `watchlists`,
see `lib/watchlist.types.ts` for the document shape) exposed to routes under
`app/api/watchlists/`:

```text
GET/POST     /api/watchlists                    -> list / create
GET/PATCH/DELETE /api/watchlists/:id             -> read / rename / delete
POST/DELETE  /api/watchlists/:id/items/:schemeCode -> add / remove a scheme
```

`lib/watchlist.schema.ts` and `lib/watchlist.client.ts` mirror the
research-facing validation pattern: routes return validated shapes, and the
client validates responses before TanStack Query exposes them to
`components/watchlist-*.tsx` and `components/WatchlistsIndex.tsx`.
Watchlists never call FinAPI or TigZig; they only store scheme codes, not fund
data, so a watchlisted fund still goes through the normal research path when
opened.

## Data contracts

`lib/fund.types.ts` defines the internal `FundResearch` contract. Its
`availability` field independently represents NAV history, fund facts, and
portfolio data, allowing the interface to distinguish unavailable data from a
zero or empty value.

`lib/research-view/` converts that internal contract into semantic browser
read models. It owns cross-provider availability policy, range-specific
performance calculations, portfolio normalization, and comparison joining.
`lib/fund.schema.ts` defines Valibot schemas for browser-facing API responses.
`lib/fund.client.ts` validates every client response against those schemas before
TanStack Query exposes it to UI components. The client retains locale formatting
and visual tokens. When changing a response, update the type, schema, route,
consumer, and tests as one change.

## Presentation layers

Pages in `app/` are thin route entry points. `components/FundResearch.tsx`
renders an individual fund, and `components/FundComparison.tsx` renders a
two-fund comparison. Shared calculations live in `lib/analytics.ts`; use those
helpers rather than duplicating return, drawdown, volatility, normalization, or
range-selection logic in components.

## Operational controls

Set `FINAPI_PORTFOLIO_ENABLED=false` to suppress portfolio data. The app still
returns and displays scheme facts and, when available, NAV research. This is
useful if the portfolio provider response is temporarily unsuitable for display.

`MONGODB_URI` and `MONGODB_DB` (`lib/mongo.ts`) configure the database behind
the scheme catalogue and watchlists. Both are required to run the catalogue
and watchlist routes locally; see [the development guide](development.md) for
setup.

## Next steps

Read [the development guide](development.md) for local setup and the change
workflow. For product-level onboarding, start with the repository
[README](../README.md).
