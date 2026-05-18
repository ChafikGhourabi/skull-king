---
phase: 01-foundation
plan: 01b
subsystem: auth-routing
tags: [supabase, zustand, react-router, auth, anonymous-sessions, pkce]
dependency_graph:
  requires: [01-01a]
  provides: [supabase-singleton, auth-store, router, route-stubs]
  affects: [all subsequent plans — every route and auth operation depends on these contracts]
tech_stack:
  added: []
  patterns:
    - Supabase singleton with PKCE + detectSessionInUrl (src/lib/supabase.ts)
    - Zustand flat auth slice + onAuthStateChange listener (src/stores/authStore.ts)
    - React Router v7 loader-based protected routes with requireAuth/redirectIfAuthed guards
    - Anonymous session guard: signInAnonymously only when getSession returns null (T-1-01)
    - initAuthListener called before createRoot().render() for loader-first session rehydration
key_files:
  created:
    - src/lib/supabase.ts
    - src/stores/authStore.ts
    - src/router/index.tsx
    - src/routes/index.tsx
    - src/routes/home.tsx
    - src/routes/auth/login.tsx
    - src/routes/auth/register.tsx
    - src/routes/auth/verify.tsx
    - src/routes/auth/reset-password.tsx
    - src/routes/auth/verified.tsx
  modified:
    - src/main.tsx
decisions:
  - PKCE flow type with detectSessionInUrl for CSRF-safe OAuth and email verification
  - signInAnonymously guarded by session-null check to prevent orphaned anon user proliferation
  - initAuthListener() called before createRoot() so session is available when loaders fire
  - Auth route stubs in src/routes/auth/ to satisfy router lazy imports; full forms in Plan 03
  - /auth/verified route has no redirectIfAuthed loader (it IS the post-auth landing per D-04)
metrics:
  duration: "~10 minutes"
  completed: "2026-05-18T14:11:49Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 10
  files_modified: 1
---

# Phase 1 Plan 01b: Supabase, Auth Store, Router, and Entry Point Summary

**One-liner:** Supabase PKCE singleton, Zustand auth slice with onAuthStateChange, React Router v7 createBrowserRouter with requireAuth/redirectIfAuthed guards, and anonymous session creation on first visit.

## What Was Built

Five files form the runtime skeleton of the app: a Supabase client singleton configured for PKCE auth, a Zustand auth store with an `initAuthListener` function wired via `onAuthStateChange`, a `createBrowserRouter` configuration with loader-based protected routes, a root redirect stub, and a replaced `main.tsx` that calls `initAuthListener()` before rendering.

Route stubs were also created for all lazy-loaded routes referenced by the router: `home`, `auth/login`, `auth/register`, `auth/verify`, `auth/reset-password`, and `auth/verified`. These stubs are placeholder shells — full auth forms are Plan 03.

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire Supabase singleton, auth store, router, entry point | e9dfc55 | src/lib/supabase.ts, src/stores/authStore.ts, src/router/index.tsx, src/routes/index.tsx, src/routes/home.tsx, src/routes/auth/*.tsx, src/main.tsx |

## Verification Results

- `pnpm tsc --noEmit` (via `npx tsc`): exits 0, no TypeScript errors
- `vite build`: passes, 11 route chunks produced (code-splitting working)
- `grep "flowType" src/lib/supabase.ts`: returns `flowType: 'pkce'`
- `grep "signInAnonymously" src/router/index.tsx`: 1 actual call (line 31), inside `if (!session)` guard (T-1-01 mitigated)
- `grep "initAuthListener" src/main.tsx`: found, called before createRoot() render

## Deviations from Plan

### Auto-added Route Stubs

**[Rule 2 - Missing Critical Functionality] Added lazy route stubs for all routes referenced by router**

- **Found during:** Task 1
- **Issue:** The router references 6 lazy-loaded route modules (`@/routes/home`, `@/routes/auth/login`, `@/routes/auth/register`, `@/routes/auth/verify`, `@/routes/auth/reset-password`, `@/routes/auth/verified`). Without these files existing, TypeScript compilation would fail and Vite build would fail. Plan 01b specifies only `src/routes/index.tsx` as an explicit artifact but the router pattern requires all route modules to exist for the build to pass.
- **Fix:** Created all 6 route stub files with minimal placeholder JSX using correct pirate theme tokens and the required named `Component` export (React Router v7 lazy convention). Full auth form implementations are deferred to Plan 03.
- **Files modified:** src/routes/home.tsx, src/routes/auth/login.tsx, src/routes/auth/register.tsx, src/routes/auth/verify.tsx, src/routes/auth/reset-password.tsx, src/routes/auth/verified.tsx
- **Commit:** e9dfc55

### Env Var Name

The plan's `<key_context>` override specifies `VITE_SUPABASE_PUBLISHABLE_KEY` instead of `VITE_SUPABASE_ANON_KEY` found in PATTERNS.md. `src/lib/supabase.ts` uses `VITE_SUPABASE_PUBLISHABLE_KEY` as directed. The PATTERNS.md pattern was not used verbatim.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Auth forms (login, register, verify, reset-password) | src/routes/auth/login.tsx, register.tsx, verify.tsx, reset-password.tsx | Placeholder shells; full forms with react-hook-form + zod + Supabase calls are Plan 03 |
| Home page content | src/routes/home.tsx | "Game loading… coming soon" placeholder; full home page is Plan 04 |

These stubs are intentional — they exist so the router and build work. Plans 03 and 04 will replace them.

## Threat Flags

None — no new trust boundaries introduced beyond what the plan's threat model accounts for. The runtime assertion in `supabase.ts` fails loudly when env vars are missing. All STRIDE mitigations applied as specified.

## Self-Check: PASSED

- [x] src/lib/supabase.ts exists: FOUND
- [x] src/stores/authStore.ts exists: FOUND
- [x] src/router/index.tsx exists: FOUND
- [x] src/routes/index.tsx exists: FOUND
- [x] src/main.tsx updated (imports theme.css, calls initAuthListener): FOUND
- [x] Commit e9dfc55 exists: CONFIRMED
- [x] pnpm build passes: CONFIRMED (Vite 1.03s, 11 chunks)
- [x] TypeScript: no errors
