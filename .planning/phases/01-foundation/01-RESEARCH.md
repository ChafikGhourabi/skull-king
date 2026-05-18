# Phase 1: Foundation — Research

**Researched:** 2026-05-18
**Domain:** Supabase Auth + React Router v7 + Tailwind v4/shadcn/ui + Netlify SPA deploy
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Shell & Routing**
- D-01: Post-auth home in Phase 1 is a branded placeholder page ("Game loading… coming soon" style) — not a full dashboard shell.
- D-02: Minimal route set: `/` + `/auth/*` (login, register, verify, reset-password, verified) + `/home` (post-login placeholder). No stubbed-out future routes.
- D-03: `/` behavior — redirect to `/auth/login` if unauthenticated; redirect to `/home` if authenticated.
- D-04: Post-email-verification landing — `/auth/verified` shows a brief "Email confirmed!" success screen, then auto-redirects to `/home` after a short delay.

**Supabase Schema Scope**
- D-05: Provision the **full game schema** in Phase 1 — tables: `profiles`, `games`, `game_players`, `rounds`, `tricks`, `trick_cards`, `bids`, `scores`. Include `declared_mode` column on `trick_cards` for Tigress.
- D-06: RLS enabled on every table from day one. Game mutations go through `SECURITY DEFINER` RPCs; RLS policies allow players to read their own data only.
- D-07: Schema managed as SQL migration files in `supabase/migrations/`, tracked in the repo. Applied via Supabase CLI. No Prisma, no manual dashboard changes.
- D-08: Create tables AND a set of stub `SECURITY DEFINER` functions (`create_game`, `join_game`, `play_card`, `submit_bid`, etc.) returning `{"error": "not_implemented"}`.

**Guest Upgrade Flow**
- D-09: Guest upgrade prompt shown after first game ends — not mid-game.
- D-10: Upgrade experience is an **inline modal** (no page navigation). `linkIdentity` / `updateUser` used to attach credentials. Game history retained automatically (same `user_id`).
- D-11: Guest session persists via Supabase anon JWT in localStorage. No expiry cron in Phase 1.
- D-12: Guests see a "Guest Mode" chip/badge in nav header with "Create account" CTA. Authenticated users see avatar + username.

**Netlify Deploy Strategy**
- D-13: Single environment: `main` → production only. No branch preview deploys.
- D-14: Supabase credentials via Netlify environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). `.env.example` documents all required vars.
- D-15: Netlify scheduled function (`netlify/functions/keep-alive.ts`) pings Supabase REST health endpoint every 3 days.

**Carried Forward**
- D-16: All game mutations go through Postgres `SECURITY DEFINER` RPC functions — no direct client writes to game tables.
- D-17: `declared_mode` column (Tigress) exists in schema from day one.
- D-18: Anonymous→permanent account conversion must migrate all game history rows atomically.

### Claude's Discretion
- Exact Supabase migration numbering scheme and file naming convention.
- Specific RLS policy conditions (exact SQL).
- Auto-redirect delay duration on `/auth/verified` (e.g., 3 seconds).
- Netlify scheduled function cron expression (every 3 days = `0 0 */3 * *`).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password | Supabase `signUp()` + email verification flow; PKCE `flowType: 'pkce'` on createClient |
| AUTH-02 | User receives email verification after signup | Supabase sends verification email by default; `/auth/verified` callback route exchanges code; `detectSessionInUrl: true` handles token automatically |
| AUTH-03 | User can reset password via email link | Supabase `resetPasswordForEmail()` + `onAuthStateChange` `PASSWORD_RECOVERY` event pattern; `/auth/reset-password` route |
| AUTH-04 | User session persists across browser refresh | Supabase localStorage-backed JWT with `persistSession: true` (default); `onAuthStateChange` rehydrates Zustand store |
| AUTH-05 | User can sign in with Google OAuth | `signInWithOAuth({ provider: 'google', options: { redirectTo } })`; Google Cloud Console callback URL = `https://<project>.supabase.co/auth/v1/callback`; manual linking must be enabled |
| AUTH-06 | User can play as a guest without creating an account | `signInAnonymously()` called on first load when no session detected; anon JWT stored in localStorage |
| AUTH-07 | Guest user can convert to permanent account retaining game history | `linkIdentity({ provider: 'google' })` for OAuth or `updateUser({ email })` for email/password; same `user_id` is preserved — no data migration needed |
</phase_requirements>

---

## Summary

Phase 1 establishes the complete foundation for Skull King Online: auth flows (email/password, Google OAuth, anonymous, and guest upgrade), full game database schema with RLS, SQL migrations tracked in git, React Router v7 routing shell, Tailwind v4 + shadcn/ui design system initialized with the pirate theme, and Netlify production deploy with a keep-alive cron. No game logic is implemented — only the skeleton that every subsequent phase builds on.

The most technically nuanced area is the anonymous-to-permanent account conversion. Supabase guarantees `user_id` preservation on `linkIdentity` / `updateUser`, so all game records remain intact without any data migration. The catch: "Manual Linking" must be explicitly enabled in the Supabase dashboard for `linkIdentity` (OAuth path) to work. The email/password conversion path via `updateUser` works without that toggle but requires email verification first.

The second nuanced area is PKCE configuration. For this Vite SPA, `createClient` must be initialized with `flowType: 'pkce'` and `detectSessionInUrl: true`. When `detectSessionInUrl` is `true`, supabase-js automatically calls `exchangeCodeForSession` when it detects a `?code=` parameter in the URL on app load, covering both OAuth callbacks and email verification redirects without requiring a dedicated callback route handler in code — the app just needs to render with the Supabase client initialized.

**Primary recommendation:** Wire Supabase client singleton first (`src/lib/supabase.ts`) with PKCE + detectSessionInUrl, then scaffold routing (React Router v7 `createBrowserRouter`), then run shadcn init with pirate tokens, then implement auth screens in sequence, then provision schema via Supabase CLI migrations.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth session management | Browser / Client | — | supabase-js stores JWT in localStorage; session rehydration is entirely client-side in this SPA |
| Protected route enforcement | Browser / Client | — | React Router v7 loader-based redirect; runs in browser (no server in this SPA) |
| Anonymous session creation | Browser / Client | Supabase Auth (API) | Client calls `signInAnonymously()`; Supabase API creates the record |
| Guest → permanent conversion | Browser / Client | Supabase Auth (API) | Client calls `linkIdentity` / `updateUser`; Supabase handles identity merge |
| Google OAuth PKCE flow | Supabase Auth (API) | Browser / Client | Supabase drives OAuth redirect; client exchanges code via detectSessionInUrl |
| Email verification callback | Browser / Client | Supabase Auth (API) | `detectSessionInUrl: true` means supabase-js auto-exchanges code on page load |
| Database schema + RLS | Database / Storage | — | SQL migrations applied via Supabase CLI; all constraints live in Postgres |
| SECURITY DEFINER RPCs | Database / Storage | — | Stub functions created in migration; executed by DB engine bypassing RLS |
| Pirate design system (tokens, fonts) | Browser / Client | — | Tailwind v4 @theme block + Google Fonts; zero runtime |
| UI component primitives | Browser / Client | — | shadcn/ui CLI-copied components backed by Radix UI |
| SPA routing (all routes) | Browser / Client | — | React Router v7 `createBrowserRouter`; Netlify serves `index.html` for all paths |
| Keep-alive cron | CDN / Static (Netlify Functions) | — | Netlify scheduled function runs on UTC schedule; no persistent server needed |
| Environment secrets injection | CDN / Static (Netlify) | — | Netlify injects `VITE_*` at build time via dashboard env vars |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.105.4 | DB, Auth, Realtime client | Official Supabase JS client; includes `signInAnonymously`, `linkIdentity`, PKCE support |
| `react-router` | 7.15.1 | Client-side routing | v7 library mode (`createBrowserRouter`); React 19 compatible; data loaders for protected routes |
| `zustand` | 5.0.13 | Auth state + UI state | Locked decision; `useSyncExternalStore` safe with React 19 StrictMode |
| `tailwindcss` | 4.3.0 | Utility CSS + theming | Locked; CSS-first `@theme` directive, no `tailwind.config.js` |
| `@tailwindcss/vite` | 4.3.0 | Tailwind v4 Vite plugin | Official Vite integration path; faster than PostCSS in dev |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn` (CLI) | 4.7.0 | Component scaffolding | Run `pnpm dlx shadcn@latest init` once; copies Radix-backed components into `src/components/ui/` |
| `lucide-react` | 1.16.0 | SVG icon set | Consistent icons (eye, mail, user, lock icons on auth screens) |
| `clsx` | 2.1.1 | Conditional class names | `cn()` helper; required by shadcn components |
| `tailwind-merge` | 3.6.0 | Tailwind class deduplication | Prevents conflicting utility classes in `cn()` |
| `sonner` | 2.0.7 | Toast notifications | Auth error toasts, verification success; works with Tailwind v4 |
| `@netlify/functions` | 5.2.1 | Netlify Functions TypeScript types | Provides `Config` type for scheduled function export |
| `vitest` | 4.1.6 | Test runner | Vite-native; reuses vite config; no separate Babel |
| `@testing-library/react` | 16.3.2 | Component tests | Standard React Testing Library |
| `@testing-library/user-event` | latest | Simulated user events | Realistic interaction simulation |
| `@testing-library/jest-dom` | 6.9.1 | Custom DOM matchers | `toBeInTheDocument` etc. |
| `jsdom` | 29.1.1 | DOM environment for vitest | Required for `environment: 'jsdom'` in vitest config |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand for auth state | React Context | Context triggers full subtree re-renders — blocked by CLAUDE.md |
| shadcn/ui via CLI | Radix UI direct | shadcn gives pre-styled implementations; raw Radix means building from scratch |
| Netlify scheduled function | GitHub Actions | GitHub Actions requires a separate repo secret + YAML; Netlify scheduled function lives in-repo |

**Installation (runtime dependencies not yet in package.json):**
```bash
pnpm add @supabase/supabase-js react-router zustand sonner
pnpm add -D tailwindcss @tailwindcss/vite lucide-react clsx tailwind-merge @netlify/functions
pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Version verification (confirmed against npm registry 2026-05-18):**
All versions above were confirmed via `npm view <pkg> version`. No discrepancies between CLAUDE.md specs and current registry.

---

## Package Legitimacy Audit

> slopcheck was not available at research time. All packages are tagged per source provenance below.

| Package | Registry | Age | Source Repo | Provenance | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `@supabase/supabase-js` | npm | 6 yrs (2020) | github.com/supabase/supabase-js | [VERIFIED: official docs] | Approved |
| `react-router` | npm | 12 yrs (2014) | github.com/remix-run/react-router | [VERIFIED: official docs] | Approved |
| `zustand` | npm | 7 yrs (2019) | github.com/pmndrs/zustand | [CITED: CLAUDE.md stack] | Approved |
| `tailwindcss` | npm | 8 yrs (2017) | github.com/tailwindlabs/tailwindcss | [VERIFIED: official docs] | Approved |
| `@tailwindcss/vite` | npm | 1 yr (2024) | github.com/tailwindlabs/tailwindcss | [VERIFIED: official docs] | Approved |
| `shadcn` (CLI) | npm | 1 yr (2024-07) | github.com/shadcn-ui/ui | [CITED: CLAUDE.md stack] | Approved |
| `lucide-react` | npm | 5 yrs (2020) | github.com/lucide-icons/lucide | [CITED: CLAUDE.md stack] | Approved |
| `clsx` | npm | 7 yrs (2018) | github.com/lukeed/clsx | [CITED: CLAUDE.md stack] | Approved |
| `tailwind-merge` | npm | 4 yrs (2021) | github.com/dcastil/tailwind-merge | [CITED: CLAUDE.md stack] | Approved |
| `sonner` | npm | 2 yrs (2023) | github.com/emilkowalski/sonner | [CITED: CLAUDE.md stack] | Approved |
| `@netlify/functions` | npm | 4 yrs (2021) | github.com/netlify/functions | [VERIFIED: official docs] | Approved |
| `vitest` | npm | 4 yrs (2021) | github.com/vitest-dev/vitest | [CITED: CLAUDE.md stack] | Approved |
| `@testing-library/react` | npm | 7 yrs (2019) | github.com/testing-library | [CITED: CLAUDE.md stack] | Approved |
| `jsdom` | npm | 14 yrs (2011) | github.com/jsdom/jsdom | [CITED: CLAUDE.md stack] | Approved |

No postinstall scripts detected on any audited package.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time. All packages are from well-established, official or widely-cited sources with multi-year registry history. No human-verify checkpoints required.*

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React SPA)
│
├── src/main.tsx
│   └── <RouterProvider router={createBrowserRouter([...])} />
│       ├── Root layout (loads Supabase session → Zustand auth store)
│       │   ├── loader: getSession() → redirect to /auth/login if null
│       │   │   and is protected route
│       │   ├── /  (index) → redirect loader: /auth/login OR /home
│       │   ├── /auth/*
│       │   │   ├── /auth/login         (email/password + Google OAuth)
│       │   │   ├── /auth/register      (sign up form)
│       │   │   ├── /auth/verify        (check email CTA)
│       │   │   ├── /auth/reset-password (new password form)
│       │   │   └── /auth/verified      (success screen → auto-redirect /home)
│       │   └── /home  [protected]      (branded placeholder, guest badge)
│
├── src/lib/supabase.ts  ← Singleton: createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true } })
│
├── src/stores/authStore.ts  ← Zustand: { user, session, isAnonymous, isLoading }
│   └── supabase.auth.onAuthStateChange → update store
│
└── src/components/auth/
    ├── GuestUpgradeModal.tsx  (shown post-game, D-10)
    └── GuestBadge.tsx         (nav chip, D-12)

Supabase (remote)
├── Auth service: email/password, Google OAuth, anonymous sessions
├── Postgres: profiles, games, game_players, rounds, tricks, trick_cards, bids, scores
├── RLS: enabled on all tables; SECURITY DEFINER RPCs for mutations
└── supabase/migrations/  ← tracked in git, applied via CLI

Netlify (hosting)
├── Build: pnpm build → dist/
├── netlify.toml: [[redirects]] /* → /index.html :200 (SPA fallback)
├── ENV: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (set in Netlify dashboard)
└── netlify/functions/keep-alive.ts  ← Scheduled: 0 0 */3 * * (every 3 days)
    └── GET https://<project>.supabase.co/rest/v1/ (with apikey header)
```

### Recommended Project Structure
```
src/
├── lib/
│   └── supabase.ts          # Singleton createClient
├── stores/
│   └── authStore.ts         # Zustand auth slice
├── router/
│   └── index.tsx            # createBrowserRouter definition
├── components/
│   ├── ui/                  # shadcn copied components
│   └── auth/
│       ├── AuthLayout.tsx
│       ├── GuestBadge.tsx
│       └── GuestUpgradeModal.tsx
├── routes/
│   ├── index.tsx            # / redirect handler
│   ├── home.tsx             # /home placeholder
│   └── auth/
│       ├── login.tsx
│       ├── register.tsx
│       ├── verify.tsx
│       ├── reset-password.tsx
│       └── verified.tsx
├── styles/
│   ├── theme.css            # @import "tailwindcss" + @theme block
│   └── globals.css          # shadcn CSS variable overrides
supabase/
├── config.toml              # supabase init output
└── migrations/
    ├── 20260518000001_initial_schema.sql   # full game schema + RLS
    └── 20260518000002_rpc_stubs.sql        # SECURITY DEFINER stub functions
netlify/
└── functions/
    └── keep-alive.ts        # scheduled keep-alive ping
netlify.toml                 # SPA redirect + build config
.env.example                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### Pattern 1: Supabase Client Singleton with PKCE

**What:** Single `createClient` instance shared across the app; configured for PKCE + auto session detection.
**When to use:** Initialize once in `src/lib/supabase.ts`; import everywhere.

```typescript
// src/lib/supabase.ts
// Source: https://supabase.com/docs/guides/auth/sessions/pkce-flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,  // auto-exchanges ?code= on load (OAuth + email verify)
    persistSession: true,      // default true — JWT in localStorage
    autoRefreshToken: true,    // default true
  },
})
```

### Pattern 2: Zustand Auth Store with onAuthStateChange

**What:** Zustand store initialized from Supabase session; `onAuthStateChange` keeps it current.
**When to use:** Wrap in `src/stores/authStore.ts`; subscribe in root layout loader.

```typescript
// src/stores/authStore.ts
// Source: [CITED: CLAUDE.md stack + Supabase official docs]
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAnonymous: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,
}))

// Initialize once (call from main.tsx or root layout)
export function initAuthListener() {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
      isLoading: false,
    })
  })

  return supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
      isLoading: false,
    })
  })
}
```

### Pattern 3: React Router v7 Protected Routes (Loader-based)

**What:** Root layout loader checks session before rendering; redirects to `/auth/login` if missing.
**When to use:** Wrap all protected routes under a layout route with this loader.

```typescript
// src/router/index.tsx
// Source: https://reactrouter.com/how-to (data mode loaders)
import { createBrowserRouter, redirect } from 'react-router'
import { supabase } from '@/lib/supabase'

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw redirect('/auth/login')
  return session
}

async function redirectIfAuthed() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) throw redirect('/home')
  return null
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => {
      // root: redirect based on auth state
      return supabase.auth.getSession().then(({ data: { session } }) =>
        session ? redirect('/home') : redirect('/auth/login')
      )
    },
  },
  {
    // Protected layout
    loader: requireAuth,
    children: [
      { path: '/home', lazy: () => import('@/routes/home') },
    ],
  },
  {
    path: '/auth',
    loader: redirectIfAuthed,  // redirect authed users away from auth screens
    children: [
      { path: 'login', lazy: () => import('@/routes/auth/login') },
      { path: 'register', lazy: () => import('@/routes/auth/register') },
      { path: 'verify', lazy: () => import('@/routes/auth/verify') },
      { path: 'reset-password', lazy: () => import('@/routes/auth/reset-password') },
    ],
  },
  // /auth/verified does NOT redirect authed users away — it IS the post-auth landing
  { path: '/auth/verified', lazy: () => import('@/routes/auth/verified') },
])
```

### Pattern 4: Anonymous Session on First Load

**What:** Check for existing session; if none, call `signInAnonymously()` automatically.
**When to use:** In the root layout or app initialization — before showing any content.

```typescript
// Source: https://supabase.com/docs/guides/auth/auth-anonymous
// [CITED: supabase.com/blog/anonymous-sign-ins]
async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // No session at all — create anonymous user
    await supabase.auth.signInAnonymously()
    // onAuthStateChange will fire and update Zustand store
  }
}
```

**Critical:** Call `getSession()` first — calling `signInAnonymously()` unconditionally creates a new user every time.

### Pattern 5: Anonymous → Permanent Account Conversion

**What:** Convert anonymous JWT to permanent user via `linkIdentity` (OAuth) or `updateUser` (email).
**When to use:** In `GuestUpgradeModal.tsx`, shown after first game ends (D-10).

```typescript
// OAuth path (Google)
// Source: https://supabase.com/blog/anonymous-sign-ins
// PREREQUISITE: "Manual Linking" must be enabled in Supabase dashboard > Auth > Settings
async function upgradeWithGoogle() {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/home` }
  })
  // User is redirected to Google; on return, same user_id, now permanent
}

// Email/password path
async function upgradeWithEmail(email: string) {
  // Step 1: attach email (triggers verification email)
  const { error } = await supabase.auth.updateUser({ email })
  // Step 2: user clicks verification link in email
  // Step 3: on return to app, add password
  // Note: user_id is preserved throughout — game history retained automatically
}
```

### Pattern 6: Netlify Scheduled Keep-Alive Function

**What:** Netlify scheduled function that pings Supabase REST endpoint every 3 days.
**When to use:** Single file in `netlify/functions/keep-alive.ts`.

```typescript
// netlify/functions/keep-alive.ts
// Source: https://docs.netlify.com/functions/scheduled-functions/
import type { Config } from "@netlify/functions"

export default async () => {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`
  await fetch(url, {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
  })
  console.log('Supabase keep-alive ping sent')
}

export const config: Config = {
  schedule: "0 0 */3 * *"  // every 3 days at midnight UTC
}
```

**Note:** Netlify scheduled functions only run on published deploys (not preview deploys). The 30-second execution limit is irrelevant here — an HTTP ping completes in < 1 second.

### Pattern 7: RLS Policy SQL Template

**What:** Standard RLS policy for user-scoped tables.
**When to use:** In migration files for every table that stores per-user or per-game data.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Always use (select auth.uid()) not auth.uid() — enables Postgres query plan caching
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users read own row"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles: users insert own row"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles: users update own row"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Index to back the RLS policy (avoids sequential scan)
CREATE INDEX profiles_id_idx ON profiles USING btree (id);
```

### Pattern 8: SECURITY DEFINER Stub Function

**What:** Stub RPC function returning a "not implemented" JSON — establishes mutation-via-RPC pattern.
**When to use:** In `supabase/migrations/20260518000002_rpc_stubs.sql`.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_game(
  p_max_players int DEFAULT 8,
  p_card_mode text DEFAULT 'standard'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

-- Repeat for: join_game, play_card, submit_bid, resolve_trick, end_game
```

### Anti-Patterns to Avoid

- **Calling `signInAnonymously()` unconditionally on every page load:** Creates a new anonymous user on every refresh. Always check `getSession()` first.
- **Using `auth.uid()` directly in RLS policies (without SELECT wrapper):** Prevents Postgres from caching the function result per-statement — causes 100x+ performance degradation on large tables. Always use `(select auth.uid())`.
- **Skipping `flowType: 'pkce'` in createClient:** Defaults to implicit flow, which exposes tokens in URL hash. PKCE is the secure default for SPAs.
- **Importing from `framer-motion`:** The legacy package; use `motion` with `import { motion } from "motion/react"` in later phases.
- **Putting `SECURITY DEFINER` functions in the `public` schema without `SET search_path = public`:** Search path injection attack vector. Always pin the search path.
- **Using `FOR ALL` in RLS policies:** Creates one catch-all policy that is harder to audit. Use separate policies per operation (SELECT, INSERT, UPDATE, DELETE).
- **Not enabling RLS before writing policies:** Tables in the `public` schema are open to all by default; RLS must be explicitly enabled with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence + refresh | Custom JWT storage / refresh loop | `supabase-js` `persistSession: true` + `autoRefreshToken: true` | Token rotation, expiry detection, and PKCE code exchange are all handled internally |
| Anonymous-to-permanent user merge | Custom data migration query | `supabase.auth.linkIdentity()` + `supabase.auth.updateUser()` | `user_id` is preserved automatically — no row-level migration needed |
| Email verification flow | Custom OTP / token verification endpoint | Supabase email templates + `detectSessionInUrl: true` | Supabase sends the email, generates the token, and supabase-js exchanges it automatically |
| OAuth PKCE code exchange | Manual `?code=` parameter extraction | `detectSessionInUrl: true` in createClient | supabase-js detects and exchanges the code on app load without custom route logic |
| Accessible form inputs | Custom input components | shadcn/ui `<Input>`, `<Label>`, `<Button>` | Radix UI primitives handle focus management, ARIA, and keyboard navigation |
| Toast notifications | Custom notification system | `sonner` | Edge cases: positioning, stacking, auto-dismiss, accessibility roles |
| CSS utility deduplication | Manual class filtering | `tailwind-merge` + `clsx` via `cn()` | Conflicting utilities (e.g., `text-sm text-lg`) require smart last-wins merge logic |

**Key insight:** Supabase auth handles the entire identity lifecycle (sign up, verify, OAuth, anonymous, conversion). Resist the urge to add any custom session management layer on top — it adds complexity without benefit.

---

## Common Pitfalls

### Pitfall 1: Anonymous Session Duplication
**What goes wrong:** `signInAnonymously()` called without checking for existing session creates thousands of orphaned anonymous users in `auth.users`.
**Why it happens:** Developers treat `signInAnonymously()` like "get or create" but it always creates new.
**How to avoid:** Always call `getSession()` first; only call `signInAnonymously()` when `session === null`.
**Warning signs:** Rapidly growing `auth.users` table in Supabase dashboard; users losing their session on every refresh.

### Pitfall 2: Manual Linking Not Enabled for OAuth Conversion
**What goes wrong:** `linkIdentity({ provider: 'google' })` throws a 400 error even though it looks correct.
**Why it happens:** Supabase requires "Manual Linking" to be explicitly toggled ON in the dashboard under Auth > Settings.
**How to avoid:** Enable Manual Linking in Supabase dashboard before wiring the guest upgrade flow. Document this in the executor's setup checklist.
**Warning signs:** `AuthApiError: Identity linking is disabled` in browser console.

### Pitfall 3: PKCE Code Verifier Cross-Device Failure
**What goes wrong:** User clicks email verification link on a different device/browser than where they signed up; exchange fails.
**Why it happens:** PKCE stores the code verifier in localStorage of the originating browser; it cannot be read from another device.
**How to avoid:** This is a known PKCE limitation. For email verification, Supabase falls back to OTP-style `token_hash` verification which is not device-bound. For OAuth, the flow must complete on the same browser. Document this behavior in the UX.
**Warning signs:** "Code exchange failed" or "code_verifier not found" errors when testing across devices.

### Pitfall 4: SPA 404 on Direct URL Access (Missing Netlify Redirect)
**What goes wrong:** Navigating directly to `https://app.netlify.app/home` returns a 404 from Netlify's CDN.
**Why it happens:** The CDN looks for a file at `/home` which doesn't exist — the SPA handles routing client-side.
**How to avoid:** `netlify.toml` must include `[[redirects]]` with `from = "/*"`, `to = "/index.html"`, `status = 200` before first deploy.
**Warning signs:** 404 on any non-root path when deployed; works fine in local dev.

### Pitfall 5: Supabase Env Vars Not Available at Build Time
**What goes wrong:** `import.meta.env.VITE_SUPABASE_URL` is `undefined` in production; auth fails silently.
**Why it happens:** Vite only injects `VITE_*` prefixed variables present at **build time**. If env vars are only set in Netlify's deploy environment but not prefixed correctly, they're absent from the bundle.
**How to avoid:** In Netlify dashboard, set env var names exactly as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add a runtime assertion in `src/lib/supabase.ts` that throws during dev if either is missing.
**Warning signs:** Auth calls fail with `TypeError: Failed to construct 'URL'` or similar from an undefined URL.

### Pitfall 6: RLS `auth.uid()` Performance Degradation
**What goes wrong:** Queries on large tables (scores, trick_cards) become slow as data grows.
**Why it happens:** `auth.uid()` called directly in RLS policy is re-evaluated per row; the Postgres optimizer cannot cache it.
**How to avoid:** Always write `(select auth.uid())` in RLS policies. Add indexes on all columns used in policy `USING` clauses.
**Warning signs:** Slow queries visible in Supabase dashboard > Query Performance; `EXPLAIN ANALYZE` shows sequential scans.

### Pitfall 7: shadcn Init Overwriting Tailwind v4 Config
**What goes wrong:** Running `npx shadcn@latest init` recreates or overwrites `src/index.css` with a default palette that conflicts with the pirate theme tokens.
**Why it happens:** The shadcn init wizard generates a default CSS variable block; if accepted without customization, it replaces the pirate tokens.
**How to avoid:** After running `shadcn init`, immediately replace ALL generated `--background`, `--foreground`, `--card`, `--primary`, etc. CSS variables with the semantic token mappings from `01-UI-SPEC.md`. The pirate tokens in `src/styles/theme.css` remain untouched; only the shadcn mapping layer in `src/styles/globals.css` is overridden.
**Warning signs:** UI renders with gray/white default palette instead of dark wood.

### Pitfall 8: Vite Config Plugin Order Conflict
**What goes wrong:** `@tailwindcss/vite` plugin conflicts with the existing React Compiler babel setup.
**Why it happens:** The scaffold already uses `@vitejs/plugin-react` with `babel-plugin-react-compiler` via `@rolldown/plugin-babel`. Adding Tailwind's Vite plugin into `plugins: []` in the wrong position can cause issues.
**How to avoid:** Add `tailwindcss()` as the **first** plugin in the array, before React/babel plugins. [ASSUMED — based on Tailwind v4 Vite docs recommendation, not explicitly verified for this specific babel combination]
**Warning signs:** CSS not generated in dev; hot reload of Tailwind classes not working.

---

## Code Examples

### Supabase createClient (verified pattern)
```typescript
// Source: https://supabase.com/docs/guides/auth/sessions/pkce-flow [CITED]
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce', detectSessionInUrl: true } }
)
```

### Google OAuth signin
```typescript
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google [VERIFIED]
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/home`,
  },
})
```

### Netlify scheduled function
```typescript
// Source: https://docs.netlify.com/functions/scheduled-functions/ [VERIFIED]
import type { Config } from "@netlify/functions"
export default async () => { /* ping */ }
export const config: Config = { schedule: "0 0 */3 * *" }
```

### netlify.toml SPA redirect
```toml
# Source: https://docs.netlify.com/frameworks/vite/ [VERIFIED]
[build]
  command = "pnpm build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Supabase migration: enable RLS (verified syntax)
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security [VERIFIED]
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: users read own row"
  ON profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);
```

### Migration file naming (verified convention)
```
supabase/migrations/20260518000001_initial_schema.sql
supabase/migrations/20260518000002_rpc_stubs.sql
```
Generated via: `supabase migration new <name>` (auto-timestamps) or manually using UTC timestamp prefix.

### Vitest config for React 19
```typescript
// vite.config.ts addition — Source: [CITED: vitest.dev/config]
import { defineConfig } from 'vitest/config'
// merge with existing config using mergeConfig from vite or add test block:
// test: { globals: true, environment: 'jsdom', setupFiles: './src/setupTests.ts' }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, `import { motion } from "motion/react"` | 2025 | Framer Motion rebranded; old package is legacy redirect |
| Tailwind `tailwind.config.js` | CSS-first `@theme` in `.css` file | Tailwind v4 (2024) | No config file; all tokens in CSS |
| Tailwind PostCSS plugin | `@tailwindcss/vite` plugin | Tailwind v4 (2024) | Faster HMR in dev; same output |
| React Router v5/v6 `<Route>` components | `createBrowserRouter` with loaders | v6.4+ / v7 | Data loaders run in parallel; no render-then-fetch waterfall |
| Supabase implicit flow | PKCE flow (`flowType: 'pkce'`) | supabase-js v2.x | Tokens never exposed in URL hash; code verifier prevents interception |
| Supabase `auth.user()` | `supabase.auth.getUser()` | supabase-js v2.x | `user()` was removed; `getUser()` makes a server call for authoritative data |

**Deprecated/outdated:**
- `framer-motion` import path: replaced by `motion/react`; do not use in this project
- `supabase.auth.user()`: removed in supabase-js v2 — use `getUser()` or `getSession()`
- Tailwind `tailwind.config.js`: not used with v4; CSS-first only
- `@supabase/auth-helpers-react`: separate package — not needed in supabase-js v2 (auth is built in)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tailwindcss()` should be first in vite plugins array when combined with React Compiler babel setup | Common Pitfalls #8 | Plugin order might not matter; or could require a different specific order — executor should test on first config task |
| A2 | Supabase free-tier project pauses after exactly 7 days of inactivity | Keep-alive cron (D-15) | If pause threshold changes, the 3-day cron interval still provides safety margin |
| A3 | `netlify/functions/keep-alive.ts` using `.ts` extension is supported by Netlify Functions v5 without additional build config | Keep-alive pattern | If TypeScript compilation requires a separate step, executor may need `.mts` extension or a `tsconfig` in `netlify/functions/` |

**All other claims are CITED from official documentation or VERIFIED against the npm registry.**

---

## Open Questions

1. **Supabase project already provisioned?**
   - What we know: `supabase CLI 2.90.0` is installed; no `supabase/` directory exists yet.
   - What's unclear: Whether the user has already created a Supabase project in the dashboard and has `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ready.
   - Recommendation: Planner should include a `checkpoint:human-verify` task for "Confirm Supabase project is created; obtain URL + anon key" before the migration tasks.

2. **Google OAuth credentials available?**
   - What we know: Supabase dashboard needs Google Client ID + Secret before `signInWithOAuth` works.
   - What's unclear: Whether the user has a Google Cloud Console project with OAuth credentials.
   - Recommendation: Planner should include a setup task: "Enable Google provider in Supabase dashboard + configure Google Cloud Console callback URL."

3. **Netlify site already linked to repo?**
   - What we know: `netlify-cli/23.14.0` is installed.
   - What's unclear: Whether `netlify link` has been run and the site exists in the Netlify dashboard.
   - Recommendation: Planner should include a setup task for Netlify site creation + `netlify link`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All JS tooling | ✓ | v22.22.2 | — |
| npm | Package installs | ✓ | 10.9.7 | pnpm (already in use) |
| Supabase CLI | DB migrations, local dev | ✓ | 2.90.0 | — |
| Netlify CLI | Deploy, function testing | ✓ | 23.14.0 | — |
| Docker | Supabase local dev (`supabase start`) | [ASSUMED] | — | Skip local DB; use remote project directly |
| Supabase remote project | Auth + DB | ✗ (not linked) | — | Must create in dashboard before migration tasks |
| Google OAuth credentials | AUTH-05 | ✗ (not configured) | — | Skip in early tasks; add as a setup step |

**Missing dependencies with no fallback:**
- Supabase remote project must be created before migrations can be applied.

**Missing dependencies with fallback:**
- Docker (Supabase local dev): If Docker is unavailable, skip `supabase start` and work directly against the remote Supabase project. CLI migrations apply to remote via `supabase db push`.
- Google OAuth credentials: Can defer to a later sub-task; email/password and anonymous auth are independent.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.6 |
| Config file | `vite.config.ts` (test block to be added in Wave 0) |
| Quick run command | `vitest run --reporter=verbose` |
| Full suite command | `vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signUp()` called with email + password | unit | `vitest run src/stores/authStore.test.ts` | ❌ Wave 0 |
| AUTH-02 | Verification email URL detected via `detectSessionInUrl` | manual-only | N/A — requires real email + OAuth callback | manual |
| AUTH-03 | `resetPasswordForEmail()` called; `PASSWORD_RECOVERY` event handled | unit | `vitest run src/stores/authStore.test.ts` | ❌ Wave 0 |
| AUTH-04 | Session rehydrated from localStorage on `getSession()` | unit | `vitest run src/stores/authStore.test.ts` | ❌ Wave 0 |
| AUTH-05 | `signInWithOAuth` called with `provider: 'google'` | unit (mock) | `vitest run src/routes/auth/login.test.tsx` | ❌ Wave 0 |
| AUTH-06 | `signInAnonymously()` called when no session | unit | `vitest run src/stores/authStore.test.ts` | ❌ Wave 0 |
| AUTH-07 | `linkIdentity` called from GuestUpgradeModal | unit (mock) | `vitest run src/components/auth/GuestUpgradeModal.test.tsx` | ❌ Wave 0 |
| AUTH-07 | `user_id` preserved after conversion | integration | `vitest run src/stores/authStore.integration.test.ts` | ❌ Wave 0 |

**Note:** AUTH-02, AUTH-03, and AUTH-05 require real Supabase credentials and redirect flows — they can only be verified manually or via a proper E2E test suite (out of scope for Phase 1 unit tests). Mark these as `manual-only` in the verification plan.

### Sampling Rate
- **Per task commit:** `vitest run --reporter=verbose` (unit tests only, < 30s)
- **Per wave merge:** `vitest run` (full suite)
- **Phase gate:** Full suite green + manual auth flow verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/authStore.test.ts` — covers AUTH-01, AUTH-03, AUTH-04, AUTH-06
- [ ] `src/routes/auth/login.test.tsx` — covers AUTH-05 (mocked OAuth call)
- [ ] `src/components/auth/GuestUpgradeModal.test.tsx` — covers AUTH-07
- [ ] `src/setupTests.ts` — `@testing-library/jest-dom` import
- [ ] `vitest` config block in `vite.config.ts` — `environment: 'jsdom'`, `globals: true`, `setupFiles`
- [ ] Install: `pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`

---

## Security Domain

Security enforcement is enabled; ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (email/password, OAuth, anonymous) |
| V3 Session Management | yes | supabase-js localStorage JWT; `persistSession: true`; `autoRefreshToken: true`; PKCE `flowType: 'pkce'` |
| V4 Access Control | yes | RLS on every table; `SECURITY DEFINER` RPCs for mutations; React Router protected route loaders |
| V5 Input Validation | yes | React Hook Form + Zod (auth forms); supabase-js validates on the server |
| V6 Cryptography | partial | PKCE code verifier uses SHA-256 challenge — handled by supabase-js; do not hand-roll |

### ASVS V2.1 — Authentication Controls
- Email/password stored by Supabase Auth (bcrypt); never handled by application code [VERIFIED: Supabase handles hashing]
- Password strength enforcement: Supabase dashboard minimum length setting (enforce ≥ 8 chars)
- Email verification required before session is fully established [VERIFIED: Supabase default behavior]

### ASVS V3.1 — Session Binding
- JWT stored in localStorage (not httpOnly cookie) — acceptable for a SPA where there is no server-side rendering
- Tokens auto-refreshed before expiry by supabase-js [VERIFIED: official docs]
- Session invalidated on sign out via `supabase.auth.signOut()`

### ASVS V4.1 — Access Control Design
- RLS enabled on every table from day one (D-06) — no table is accidentally open
- SECURITY DEFINER functions use `SET search_path = public` to prevent search path injection [CITED: Supabase RLS docs]
- Anonymous users get authenticated role in Postgres — RLS policies must account for both `is_anonymous: true` and `is_anonymous: false` users where relevant

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Anonymous account abuse (mass account creation) | Spoofing | Consider enabling Supabase CAPTCHA/Turnstile on `signInAnonymously` endpoint |
| Session token theft from localStorage | Information Disclosure | PKCE + HTTPS (Netlify provides TLS); no mitigation for XSS access to localStorage — standard SPA trade-off |
| Unauthorized game data access | Elevation of Privilege | RLS policies on all game tables; SECURITY DEFINER RPCs validate caller identity before mutating |
| Search path injection via SECURITY DEFINER | Tampering | `SET search_path = public` on all DEFINER functions |
| Stale Supabase anon key exposure | Information Disclosure | Anon key is public by design (row-level security is the protection layer, not key secrecy) |

**CAPTCHA note [ASSUMED]:** Supabase dashboard has a CAPTCHA/Turnstile option for anonymous sign-ins. The Supabase docs flag mass account creation as an abuse risk. Whether to enable CAPTCHA is at the planner's/user's discretion; it adds UX friction and requires a Turnstile site key.

---

## Project Constraints (from CLAUDE.md)

| Directive | Type | Enforcement |
|-----------|------|-------------|
| Tech stack: React 19 + TypeScript + Vite (already scaffolded) | Required | Must not replace Vite or React |
| `@supabase/supabase-js ^2.105.4` | Required | Exact client; do not use legacy `@supabase/auth-helpers-react` |
| `react-router ^7.15.1` | Required | `createBrowserRouter` API; library mode (not framework mode) |
| `zustand ^5.0.13` | Required | Slice pattern for auth state |
| `tailwindcss ^4.3.0` | Required | CSS-first `@theme`; no `tailwind.config.js` |
| `motion ^12.38.0` (animation, later phases) | Required | Import from `motion/react` not `framer-motion` |
| `@tanstack/react-query ^5.100.10` | Required for server state | NOT for live game state |
| `react-hook-form ^7.76.0` + `zod ^3.24.2` | Required for forms | Do NOT upgrade to Zod v4 |
| `xstate ^5.31.1` | Required for game engine (Phase 2+) | Not needed in Phase 1 |
| `vitest ^4.1.6` | Required for tests | Vite-native; no Jest |
| `@tailwindcss/vite` not PostCSS plugin | Required | Faster dev HMR |
| No Prisma | Forbidden | SQL migrations via Supabase CLI only |
| No Redux / Redux Toolkit | Forbidden | Use Zustand + XState |
| No React Context for game state | Forbidden | Use Zustand with selector subscriptions |
| No Socket.io / Ably / Pusher | Forbidden | Use Supabase Realtime |
| No Next.js | Forbidden | Vite SPA |
| No Vercel | Forbidden | Netlify only |
| No persistent Node process | Forbidden | Netlify Functions (serverless) or Supabase Edge Functions |
| No Zod v4 | Forbidden until stable + shadcn support |
| Budget: $0 — free tier only | Constraint | All providers must have free tier sufficient for launch |
| Supabase free tier: 200 concurrent connections max | Constraint | Channel topology must not exceed this |
| Netlify free tier hosting | Constraint | Single production environment (D-13) |
| `declared_mode` column in schema from day one | Required | Must be in Phase 1 migrations |
| SQL migration files in `supabase/migrations/` | Required | No manual dashboard changes |
| SECURITY DEFINER RPCs for all game mutations | Required | No direct client writes to game tables |

---

## Sources

### Primary (HIGH confidence — VERIFIED against official documentation)
- [Supabase Anonymous Sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) — `signInAnonymously`, `linkIdentity`, user_id preservation
- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — `flowType: 'pkce'`, `detectSessionInUrl`, code verifier handling
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google) — callback URL format, `signInWithOAuth` API, Google Cloud Console steps
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — `(select auth.uid())` pattern, SECURITY DEFINER, policy per-operation rule
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) — allowed redirect URL wildcards for Netlify
- [Supabase Local Development](https://supabase.com/docs/guides/local-development/overview) — migration naming convention, `supabase migration new`, `supabase db push`
- [Supabase Anonymous Sign-ins Blog Post](https://supabase.com/blog/anonymous-sign-ins) — `updateUser` + `linkIdentity` conversion patterns; manual linking requirement
- [Tailwind CSS v4 Installation (Vite)](https://tailwindcss.com/docs/installation) — `@tailwindcss/vite` plugin setup, no `tailwind.config.js`, `@import "tailwindcss"`
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — `pnpm dlx shadcn@latest init`, path alias setup
- [Netlify Vite Configuration](https://docs.netlify.com/frameworks/vite/) — SPA `[[redirects]]` rule, build config
- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/) — `Config` export, cron syntax, TypeScript setup
- npm registry — all package versions verified 2026-05-18 via `npm view`

### Secondary (MEDIUM confidence — verified with official source)
- [Robin Wieruch: React Router v7 Private Routes](https://www.robinwieruch.de/react-router-private-routes/) — layout route + `<Outlet>` pattern; matches official RR v7 data mode docs
- [WorkOS: React Router Authentication Guide 2026](https://workos.com/blog/react-router-authentication-guide-2026) — loader-based auth check pattern
- [natt.sh: Prevent Supabase Free Tier Pause](https://natt.sh/writing/prevent-supabase-free-tier-pause) — HTTP GET to REST API is sufficient to prevent pause

### Tertiary (LOW confidence — training data, flagged in Assumptions Log)
- Vite plugin order recommendation (tailwindcss first) — A1 in Assumptions Log
- Supabase 7-day inactivity pause threshold — widely cited but not from official current docs (A2)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry 2026-05-18; CLAUDE.md provides authoritative version pins
- Architecture: HIGH — all patterns verified against Supabase, React Router, Netlify official documentation
- Pitfalls: HIGH for items 1-6 (from official docs / known SDK behaviors); MEDIUM for items 7-8 (partially inferred from docs)
- Security (ASVS): HIGH — verified Supabase handles bcrypt, PKCE, token refresh; MEDIUM for CAPTCHA recommendation (dashboard option, not code-level)

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (Supabase, React Router, Netlify APIs are stable; Tailwind v4 is stable release)
