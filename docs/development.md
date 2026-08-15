# Development guide

This guide covers the local workflow for navnote. It complements the README
with contributor-specific checks and data-provider expectations.

## Prerequisites

Use Node.js 24 and pnpm 11.18.0, as declared in `package.json`. No environment
variables are required for normal local development.

Install dependencies and run the application with:

```bash
pnpm install
pnpm dev
```

The development server prints the local URL, which is normally
`http://localhost:3000`.

## Quality checks

Use the following commands to validate the project. Unit, route, and browser
tests are deterministic and do not depend on live provider responses.

| Command                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm test`            | Run Vitest unit and route-contract tests.                   |
| `pnpm test:unit:watch` | Run Vitest in watch mode during local development.          |
| `pnpm test:coverage`   | Report coverage for `lib/` and API route modules.           |
| `pnpm test:e2e`        | Run the Playwright browser smoke suite.                     |
| `pnpm test:ci`         | Run the checks required by continuous integration.          |
| `pnpm lint`            | Run Oxlint.                                                 |
| `pnpm format:check`    | Verify formatting without changing files.                   |
| `pnpm format`          | Apply repository formatting.                                |
| `pnpm build`           | Create a production build and validate Next.js integration. |

Before running browser tests for the first time, install the managed browser:

```bash
pnpm exec playwright install chromium
```

## Test layout

The test layout keeps fast logic checks separate from browser behavior, so new
coverage has a clear place as the application grows.

- Co-locate Vitest files with the module or route they cover using
  `*.test.ts` or `*.test.tsx`.
- Use `test/fixtures/` for representative, versioned provider responses.
- Use `test/utils/render.tsx` for client-component tests that need React Query.
- Put end-to-end tests in `e2e/` and mock upstream API responses with
  Playwright routes. Do not make upstream availability part of pull-request CI.
- Keep `pnpm preflight:finapi` for explicit live-provider checks only.

Run `pnpm preflight:finapi` when you need to verify that FinAPI and TigZig still
serve usable data for representative schemes. This command makes live network
requests, so transient failures indicate provider availability issues as well as
possible integration regressions.

## Environment configuration

The only current runtime setting is optional:

```bash
FINAPI_PORTFOLIO_ENABLED=false
```

Set it in your local environment before starting the server to temporarily hide
portfolio holdings and allocation data. Keep this setting unset for the default
experience. Don't commit `.env` files because they are ignored by design.

## Change workflow

Use this sequence for changes that affect data behavior or the user interface.

1. Read the relevant provider adapter, API route, type, schema, and consumer.
2. Update parser tests when provider normalization or availability behavior
   changes.
3. Run the focused tests, then the checks appropriate to the change.
4. Run the live preflight only when network access is available and relevant.
5. Update the README or architecture guide when the contract, provider scope,
   or operational behavior changes.

## Next steps

Read [the architecture guide](architecture.md) before changing a provider or
API contract. Coding agents must also follow [AGENTS.md](../AGENTS.md).
