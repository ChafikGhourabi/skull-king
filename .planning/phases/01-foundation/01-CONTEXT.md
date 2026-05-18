# Phase 1: Foundation — Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a live, deployed app where users can sign up (email/password or Google OAuth), sign in, play as a guest, and convert a guest session to a permanent account. The Supabase project is fully wired with the complete game schema (including RLS policies), SQL migrations tracked in the repo, and the pirate design system is applied. The app runs on Netlify with a keep-alive cron and environment variables configured.

**In scope:** Auth flows, Supabase project setup + full schema, SQL migration files, RLS policies, placeholder RPC stubs, React Router setup, Tailwind v4 + shadcn/ui init, pirate theme tokens applied, Netlify deploy pipeline, keep-alive cron.

**Out of scope:** Actual game logic, lobby, matchmaking, social features, leaderboard, profile stats — all future phases.

</domain>

<decisions>
## Implementation Decisions

### App Shell & Routing
- **D-01:** Post-auth home in Phase 1 is a branded placeholder page ("Game loading… coming soon" style) — not a full dashboard shell. Keeps Phase 1 scope lean.
- **D-02:** Minimal route set: `/` + `/auth/*` (login, register, verify, reset-password, verified) + `/home` (post-login placeholder). No stubbed-out future routes.
- **D-03:** `/` behavior — redirect to `/auth/login` if unauthenticated; redirect to `/home` if authenticated. No separate landing/marketing page in Phase 1.
- **D-04:** Post-email-verification landing — `/auth/verified` shows a brief "Email confirmed!" success screen, then auto-redirects to `/home` after a short delay.

### Supabase Schema Scope
- **D-05:** Provision the **full game schema** in Phase 1 — tables: `profiles`, `games`, `game_players`, `rounds`, `tricks`, `trick_cards`, `bids`, `scores`. Include `declared_mode` column on `trick_cards` (or equivalent) for Tigress from day one. Avoids schema migrations between phases.
- **D-06:** **Row Level Security enabled in Phase 1.** Minimal but correct RLS policies on every table from day one. Game mutations go through `SECURITY DEFINER` RPCs; RLS policies allow players to read their own data only.
- **D-07:** Schema managed as **SQL migration files in `supabase/migrations/`**, tracked in the repo. Applied via Supabase CLI. No Prisma, no manual dashboard changes.
- **D-08:** **Schema + placeholder RPC stubs** — create the tables AND a set of stub `SECURITY DEFINER` functions (`create_game`, `join_game`, `play_card`, `submit_bid`, etc.) that return an `{"error": "not_implemented"}` response. Phase 2 fills in the logic. Establishes the RPC-only mutation pattern from day one.

### Guest Upgrade Flow
- **D-09:** Guest first sees the "Create an account" prompt **after their first game ends** — highest conversion moment, no friction during play.
- **D-10:** Upgrade experience is an **inline modal** (no page navigation) — the sign-up form slides up over the current screen. Supabase `linkIdentity` / anonymous session linking used to attach the new credentials to the existing anon session. Game history is retained automatically because it's keyed to the same `user_id`.
- **D-11:** Guest session **persists via Supabase anon JWT in localStorage** — survives browser close/refresh. No expiry cron in Phase 1; session lives until the user either upgrades or clears localStorage.
- **D-12:** Guests see a **"Guest Mode" chip/badge** in the nav header with a "Create account" CTA. Authenticated users see their avatar + username. This distinction is present in the `/home` placeholder and in all future phase layouts.

### Netlify Deploy Strategy
- **D-13:** **Single environment: `main` → production only.** No branch preview deploys in Phase 1 (Supabase free tier provides a single project; separate staging would require a second project or risk contaminating prod data).
- **D-14:** Supabase credentials injected via **Netlify environment variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — set once manually in the Netlify dashboard. A `.env.example` file documents all required vars. No secrets in the repo.
- **D-15:** **Supabase keep-alive cron wired in Phase 1** — a Netlify scheduled function (`netlify/functions/keep-alive.ts`) pings the Supabase REST health endpoint every 3 days. Prevents the free-tier Supabase project from pausing after 7 days of inactivity.

### Carried Forward from Prior Planning
- **D-16:** All game mutations go through **Postgres `SECURITY DEFINER` RPC functions** — no direct client writes to game tables. Established before Phase 1 planning.
- **D-17:** `declared_mode` column (for Tigress "Pirate or Escape" declaration) exists in the schema from day one — included in Phase 1 schema.
- **D-18:** Anonymous→permanent account conversion must migrate all game history rows **atomically** (single DB transaction in the RPC or via Supabase `linkIdentity` + post-link trigger).

### Claude's Discretion
- Exact Supabase migration numbering scheme and file naming convention.
- Specific RLS policy conditions (exact SQL) — Claude writes sensible minimal policies based on table structure.
- Auto-redirect delay duration on `/auth/verified` (e.g., 3 seconds).
- Netlify scheduled function cron expression (every 3 days = `0 0 */3 * *`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Requirements & Goal
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and phase boundary (Section: "Phase 1: Foundation")
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-07 (all Phase 1 requirements with acceptance criteria)

### Design System (locked)
- `.planning/phases/01-foundation/01-UI-SPEC.md` — **MUST READ.** Design tokens (Tailwind v4 `@theme` block), auth screen component specs, pirate theme palette (OKLCH colors), font definitions (Cinzel + Inter), shadcn/ui init instructions. All UI work in Phase 1 follows this spec.

### Rulebook (for schema design)
- `Skull_King_Rulebook.pdf` — Official game rules. Relevant for schema design (e.g., card types, trick structure, scoring). Phase 1 schema must accommodate all rules even though the game engine is Phase 2.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — clean Vite scaffold. `src/App.tsx`, `src/main.tsx`, `src/index.css` are all starter-template boilerplate that will be fully replaced in Phase 1.

### Established Patterns
- None yet — Phase 1 establishes all patterns. Key patterns being set:
  - React Router v7 `createBrowserRouter` as the routing root
  - Zustand stores for auth/session state
  - Supabase client singleton in `src/lib/supabase.ts`
  - Tailwind v4 CSS-first (no `tailwind.config.js`) via `@tailwindcss/vite` plugin
  - shadcn/ui initialized with pirate theme tokens (not a preset — custom tokens from UI-SPEC.md)
  - `cn()` helper from `clsx` + `tailwind-merge`

### Integration Points
- `src/main.tsx` — entry point; wraps `<App>` in `<RouterProvider>` and any global providers (React Query, auth context if needed)
- `index.html` — Vite entry; Google Fonts `<link>` tags for Cinzel + Inter added here
- `vite.config.ts` — add `@tailwindcss/vite` plugin and React Compiler babel config (already present per scaffold)

</code_context>

<specifics>
## Specific Ideas

- The keep-alive cron is a **carry-in from roadmap planning** — it was explicitly noted as something to do in Phase 1 or post-MVP, and the decision is to do it in Phase 1.
- The pirate theme uses **OKLCH color values** (not hex/HSL). Downstream agents must use the exact token values from `01-UI-SPEC.md` — do not invent new palette values.
- `shadcn/ui` CLI must be run (`npx shadcn@latest init`) as the **first task** of Phase 1, before any component work, with the pirate tokens overriding all defaults.
- Supabase anonymous sessions use `supabase.auth.signInAnonymously()` — available in `@supabase/supabase-js` v2.105+. Guest flow does NOT require the user to do anything; anonymous session is created automatically on first app load if no session exists.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-18*
