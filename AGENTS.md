# Agent guide

This document gives coding agents the project context and working rules needed
to make safe, focused changes to navnote.

## Product boundaries

navnote is a research tool for active Direct Growth Indian equity mutual funds,
used by distributors doing due diligence rather than by individual investors
self-directing trades. Do not present content or calculations as investment
advice, and do not rank or recommend funds. The product can show partial
research when an upstream provider fails, so preserve the existing
availability states and user-facing error handling.

Contextualizing existing data is allowed and encouraged; judging it is not.
It is fine to tell a user what a number means or how it compares to a
known, factual reference point (its category, a SEBI-mandated limit, its own
history) — for example, "expense ratio is within the SEBI cap for this
category" or "volatility is higher than this fund's 3-year average." It is
not fine to tell a user whether that makes the fund good, safe, or worth
choosing — no green/red "verdict" styling, no wording like "good value" or
"strong fund," and no CTA implying a decision has been made for the user
(prefer wishlist/watchlist actions over "Invest"/"Start SIP"). When in doubt,
prefer descriptive language ("above," "below," "within") over evaluative
language ("good," "bad," "risky choice").

## Repository map

- `app/` contains App Router pages and API route handlers.
- `components/` contains client components and the local UI primitives.
- `lib/` contains provider adapters, the Mongo-backed catalogue and watchlist
  services, schemas, types, date helpers, and analytics.
- `scripts/preflightFinapi.ts` validates representative live provider responses.
- `scripts/catalogRefresh.ts` rebuilds the scheme catalogue in MongoDB.
- `docs/` contains architecture and contributor guidance.

Keep provider-specific parsing in `lib/`. Route handlers validate untrusted
parameters and turn `ProviderError` instances into the documented API response
shape. Client components must use `lib/fund.client.ts` and its Valibot schemas
instead of assuming API responses are valid.

## File naming

- React components: `PascalCase.tsx` (e.g. `FundCard.tsx`). shadcn primitives
  under `components/ui/` keep their upstream kebab-case instead.
- Hooks: `useCamelCase.ts` — `.ts`, not `.tsx`, unless the hook itself returns
  JSX.
- Next.js special files (`page.tsx`, `route.ts`, `layout.tsx`, etc.) and route
  folders follow Next.js conventions and stay lowercase/kebab-case.
- `lib/` modules: `camelCase.ts`, with a role suffix when the file plays that
  role — `.service.ts` (server-side data access), `.client.ts` (client fetch
  wrappers, kept distinct from `.service.ts` so the two layers can't collide),
  `.queries.ts` (TanStack Query definitions), `.schema.ts` (Valibot schemas),
  `.types.ts` (domain types). Plain utility modules take no suffix.
- Tests match their source file's new name plus `.test.ts[x]`.

Rename a file's imports along with the file itself — don't leave stale
kebab-case import specifiers pointing at a renamed module.

## Data behavior

A MongoDB-backed catalogue (`lib/catalog.service.ts`, refreshed from TigZig via
`pnpm catalog:refresh`) drives scheme search and category browsing. FinAPI
supplies fund facts and reported portfolio data for a single scheme. TigZig
supplies NAV history and the Nifty 500 benchmark. Requests are cached for five
minutes and time out after 10 seconds. Provider behavior is not guaranteed, so
add or update normalization tests whenever you change a provider payload.

Only active Direct Growth schemes in the supported equity categories are
eligible in V0. `FINAPI_PORTFOLIO_ENABLED=false` disables portfolio display for
operational use without disabling facts or NAV research. `MONGODB_URI` and
`MONGODB_DB` must be set for the catalogue and watchlist routes to work; see
[docs/development.md](docs/development.md#environment-configuration).

Watchlists (`lib/watchlist.service.ts`) are Mongo-backed, device-scoped lists
of scheme codes, identified by an anonymous cookie from `lib/deviceId.ts`.
There is no auth: every watchlist read and write must be scoped by
`deviceId`, and a request for another device's watchlist must behave as if it
does not exist.

## Working rules

1. Read the relevant Next.js documentation in `node_modules/next/dist/docs/`
   before changing Next.js code. This project uses Next.js 16 APIs that differ
   from older releases.
2. Preserve the existing separation between server provider code and client
   fetching code. Never expose a provider base URL or future credentials to the
   browser without an explicit design decision.
3. Use the `@/` import alias for project modules and follow the existing
   TypeScript, Tailwind, and component conventions, including the file naming
   convention above.
4. Keep API inputs constrained: search queries are 2–80 characters and scheme
   codes are 4–7 digits. Update schemas, route behavior, and tests together when
   changing a public API contract.
5. Avoid unrelated formatting or dependency churn. The worktree may include
   changes owned by another contributor.

## Verification

Run the narrowest relevant checks first, then run the broader suite when the
change warrants it.

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

Run `pnpm preflight:finapi` only when live network access is appropriate. It is
an upstream health check, not a deterministic unit test. See
[docs/development.md](docs/development.md) for the full workflow and
[docs/architecture.md](docs/architecture.md) for the data flow.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
