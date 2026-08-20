# DESIGN.md — navnote

This file follows the DESIGN.md convention (9 standard sections) so AI coding
agents and human contributors can generate on-brand UI without re-deriving
these rules from scratch each time. Everything below is transcribed from the
actual codebase — [app/globals.css](app/globals.css), `components/ui/`,
[AGENTS.md](AGENTS.md) — not aspirational. **The code is the source of
truth; if this file and the code disagree, fix this file.**

## 1. Visual theme and atmosphere

navnote is a research instrument, not a sales funnel. The feel is "quiet
credibility": editorial and unhurried where it presents information, precise
and instrumented where it presents numbers. A serif wordmark and headings
(Fraunces) give it the trust of a research publication; monospaced, tabular
figures (Geist Mono) give it the legibility of a terminal. The single brand
color — cyan — is used sparingly, as a signal of liveness and interactivity,
never as decoration.

Because the audience is mutual fund distributors doing due diligence, not
retail investors being sold to, the tone stays deliberately unexcited: no
urgency, no "you should buy this," no color used to imply a verdict on a
fund. Calm precision, not persuasion — see
[Product framing](#do-and-donts) below for the hard rules this produces.

## 2. Color palette and roles

Colors are layered: raw **primitive** scales → **semantic** tokens (redefined
per light/dark theme) → Tailwind utility classes. Components must consume
semantic tokens/utilities only, never a primitive (`--storm-500`,
`--cyan-600`) directly.

Primitive scales (`app/globals.css`, light-mode hex shown; several have `50`
and `950` beyond what's listed):

| Scale       | 500       | Role                                    |
| ----------- | --------- | --------------------------------------- |
| `--storm-*` | `#687d83` | Neutral — backgrounds, text, borders    |
| `--cyan-*`  | `#02eff0` | Brand — accent, links, focus, selection |
| `--green-*` | `#22c55e` | Semantic positive                       |
| `--red-*`   | `#ef4444` | Semantic negative                       |
| `--amber-*` | `#f59e0b` | Semantic warning                        |
| `--blue-*`  | `#3b82f6` | Semantic info                           |

Semantic tokens → Tailwind utility (light values; each has a distinct `.dark`
value in `app/globals.css`):

| Role                  | Token                                 | Utility                    | Usage                           |
| --------------------- | ------------------------------------- | -------------------------- | ------------------------------- |
| Canvas                | `--bg-canvas`                         | `bg-background`            | Page background                 |
| Surface               | `--bg-surface`                        | `bg-card`                  | Cards, panels                   |
| Surface (muted)       | `--bg-surface-muted`                  | `bg-muted`                 | Subdued fills                   |
| Text (primary)        | `--text-primary`                      | `text-foreground`          | Main content                    |
| Text (secondary)      | `--text-secondary`                    | `text-muted-foreground`    | Labels, captions                |
| Border                | `--border-default`                    | `border-border` / `border` | Default borders                 |
| Brand accent          | `--brand-accent`                      | `text-brand` / `bg-brand`  | Links, live/interactive accents |
| Brand accent (strong) | `--brand-accent-strong`               | `bg-brand-strong`          | Highest-emphasis CTA fill       |
| Positive              | `--positive-text`                     | `text-positive`            | Gains                           |
| Negative              | `--negative-text`                     | `text-negative`            | Losses                          |
| Warning               | `--warning-text`                      | `text-warning`             | Caution states (not fund risk)  |
| Info                  | `--info-text`                         | `text-info`                | Informational states            |
| Selected              | `--selected-bg` / `--selected-border` | `bg-selected-bg`           | Selected rows/cards             |
| Chart series          | `--chart-1` … `--chart-6`             | `bg-chart-1` …             | Categorical chart colors        |

`--chart-1` conventionally means "this fund"; `--chart-3` conventionally
means "benchmark/comparison." Don't reassign those two slots per chart.

**Financial status color** (`gain`/`loss`/`neutral` via
[`statusColorClass`](lib/utils.ts)) is a distinct, narrower vocabulary from
the general semantic surface tokens — it renders a return number's sign, not
a judgement. Never use `positive`/`negative`/`warning` badge variants to
imply "this fund is good/bad/risky" — see section 7.

## 3. Typography rules

Three families, loaded once in [app/layout.tsx](app/layout.tsx):

| Level             | Font                       | Weight/style               | Tailwind                     | Usage                                                           |
| ----------------- | -------------------------- | -------------------------- | ---------------------------- | --------------------------------------------------------------- |
| Display / heading | Fraunces (serif, variable) | 400–600, optical-size axis | `font-heading`               | Page titles, card titles, wordmark                              |
| Body              | Geist Sans                 | 400–500                    | `font-sans` (default)        | Body copy, labels, UI chrome                                    |
| Data              | Geist Mono                 | 400–600                    | `font-mono` + `tabular-nums` | NAV, returns, %, currency — anything meant to align in a column |

Observed size scale in use (Tailwind defaults, no custom scale defined):
`text-xs` (labels/captions) → `text-sm` (body/default) → `text-base` (lead
paragraphs) → `text-lg`/`text-xl` (card/section headings) → `text-2xl`
→ `text-3xl`/`text-4xl` (hero headline only). Don't introduce sizes outside
this scale.

Rule of thumb: if it's prose or a label, it's `font-sans`; if it's a heading
or the wordmark, it's `font-heading`; if it's a number, it's `font-mono
tabular-nums`. Never swap heading and data faces.

## 4. Component styles

Primitives live in `components/ui/` (shadcn `base-nova` style, Base UI
under the hood: Button, Badge, Card, Tooltip, Table, Empty, Alert, Field,
Combobox, Accordion, Popover, Switch, Toggle, etc.). Compose these; don't
hand-roll a new low-level primitive that duplicates one that exists.

### Button

- Variants: `default` (dark fill, primary action), `outline`, `secondary`,
  `ghost`, `brand` (solid brand-cyan fill — reserve for the one or two
  highest-emphasis actions per screen, e.g. "Add to watchlist"),
  `destructive`, `link`.
- Sizes: `xs` / `sm` / `default` / `lg`, plus square `icon-xs` / `icon-sm` /
  `icon` / `icon-lg`.
- States: `hover` lightens/darkens fill per variant; `active` nudges
  `translate-y-px`; `disabled` drops to 50% opacity and disables pointer
  events; `focus-visible` gets a 3px ring in `--focus-ring`.

### Badge

- Variants: `default`, `secondary`, `outline`, `ghost`, `brand`,
  `positive`/`warning`/`info`/`destructive` (reserved for genuine data
  states — an error, a gain/loss — never a verdict on a fund).
- Category badges (`FundCard.tsx`) use `outline`; risk-tier badges use
  `secondary` — both paired with a `TermHelp` icon rather than color-coded
  by severity.

### Tooltip

- Two distinct uses, kept visually and semantically separate:
  - **Term definitions** — `components/term-help.tsx`'s `TermHelp`
    (`CircleHelpIcon` trigger + `Tooltip`). Defines a word (AUM, NAV, a
    category name, a risk tier).
  - **Methodology notes** — the raw `Tooltip` primitive directly. Explains
    how a number was calculated or caveats its provenance (see the
    "Performance vs benchmark" and consistency-score tooltips in
    `FundResearch.tsx` / `RiskReturnConsistency.tsx`).

### Card

- `size="default"` (16px padding) or `size="sm"` (12px padding) — prefer
  this prop over ad hoc padding overrides.
- Resting shadow: `shadow-card`. No hover elevation by default except where
  a card is a link (see 6. Depth and elevation).

## 5. Layout principles

- Base unit: Tailwind's default 4px scale (`spacing-1` = 4px); no custom
  spacing scale is defined. Compose from `gap-1.5`, `gap-2`, `gap-3`,
  `gap-4`, `gap-6`, `gap-8` as seen across existing components rather than
  arbitrary pixel values.
- Radius: driven by one primitive, `--radius: 0.5rem`, scaled into
  `--radius-sm` / `-md` / `-lg` / `-xl` in the Tailwind theme layer. Small
  interactive elements (buttons/badges at `xs`/`sm`) clamp radius with
  `min(var(--radius-md), Npx)` so they don't look over-rounded at small
  sizes — copy that pattern rather than hardcoding a pixel radius.
- Content width: research pages use `max-w-6xl` centered; no fixed global
  max-width is enforced site-wide.

## 6. Depth and elevation

Only two shadow tokens exist — don't invent a third level.

| Token             | Usage                                              | Light value                                                                    | Dark value                                         |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `--shadow-card`   | Resting card elevation                             | `0 1px 2px oklch(0.145 0.02 220/4%), 0 8px 20px -8px oklch(0.145 0.02 220/8%)` | Same shape + an `inset 0 1px 0 …/6%` top highlight |
| `--shadow-raised` | Hover/elevated state (e.g. a clickable `FundCard`) | `0 2px 4px …/6%, 0 16px 32px -12px …/14%`                                      | Same shape + a stronger inset highlight            |

Dark mode doesn't just darken the shadow — it adds an inset highlight to
read as "lit from above," matching a dark card catching ambient light rather
than a flat cutout.

## 7. Do's and don'ts

**Do:**

- Consume semantic tokens/Tailwind utilities; never reference a color
  primitive directly from a component.
- Use `font-mono tabular-nums` for any number meant to be scanned in a
  column (NAV, returns, expense ratio, AUM).
- Use `TermHelp` to define jargon inline (AUM, NAV, AMC, category names,
  risk tiers) rather than assuming the reader already knows the term.
- Keep comparisons descriptive and tied to a factual reference point (a
  fund's own history, a regulatory limit) — see [AGENTS.md](AGENTS.md).
- Use wishlist/watchlist language for calls to action ("Add to watchlist",
  "Create new watchlist").

**Don't:**

- Don't use "Invest Now" / "Start SIP" or any brokerage-funnel CTA — this
  is a distributor research tool, not a consumer investing app.
- Don't rank, recommend, or apply a good/bad verdict to a fund — no
  green/red "this fund is good" styling, ever.
- Don't reach for `positive`/`negative`/`warning` badge or alert variants to
  express a judgement about a fund; reserve them for genuine data states
  (a gain/loss number, an error).
- Don't invent a third shadow/elevation level or a spacing value outside the
  observed 4px-based scale.
- Don't swap `font-heading` and `font-mono` — headings are never mono,
  numbers are never serif.

## 8. Responsive behavior

- Breakpoints used are Tailwind defaults: `sm` (640px) and `lg` (1024px) are
  the two actually in use across the app (`md` appears rarely). There is no
  custom breakpoint scale.
- Pattern: single column by default, `sm:grid-cols-2` for card grids,
  `lg:grid-cols-3` for the widest grids (category explorer results), and
  `lg:grid-cols-[2fr_1fr]` for asymmetric detail/summary layouts (fund
  comparison). Mobile-first: base styles are the small-screen case, larger
  breakpoints add columns.
- Charts and dense number grids (fund facts) don't get bespoke mobile
  variants beyond reflowing to fewer columns — no separate mobile
  component tree.

## 9. Agent prompt guide

When generating or modifying UI in this repo:

1. Read this file and [AGENTS.md](AGENTS.md) first — AGENTS.md carries the
   product/data rules, this file carries the visual/content rules. Both are
   binding.
2. Reuse a `components/ui/` primitive before writing new markup that
   duplicates one.
3. Reference semantic Tailwind utilities (`bg-card`, `text-positive`,
   `bg-chart-1`) — never a raw hex value or a `--storm-*`/`--cyan-*`
   primitive.
4. For any new number display, use `font-mono tabular-nums`; for any new
   heading, use `font-heading`.
5. For any new jargon term or acronym introduced in copy, add a definition
   to [lib/glossary.ts](lib/glossary.ts) and wire a `TermHelp` tooltip
   rather than leaving it unexplained.
6. Never add an "Invest"/"SIP"/ranking-style CTA or a good/bad color
   verdict — see section 7. If a request implies one, flag it rather than
   implementing it as asked.
7. Both light and dark values must be defined for any new token — this repo
   has no `prefers-color-scheme` fallback; theme switching is class-based
   (`.dark`) via `next-themes`.
