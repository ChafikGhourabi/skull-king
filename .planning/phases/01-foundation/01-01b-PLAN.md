---
phase: 01-foundation
plan: 01b
type: execute
wave: 1
depends_on:
  - 01-01a
files_modified:
  - src/lib/supabase.ts
  - src/stores/authStore.ts
  - src/router/index.tsx
  - src/routes/index.tsx
  - src/main.tsx
autonomous: true
requirements:
  - AUTH-04
  - AUTH-06

must_haves:
  truths:
    - "Unauthenticated visit to / redirects to /auth/login"
    - "Authenticated visit to / redirects to /home"
    - "Supabase client initializes without throwing (env vars loaded)"
    - "Anonymous session is created on first load when no session exists"
    - "Auth state is rehydrated from localStorage on browser refresh"
  artifacts:
    - path: "src/lib/supabase.ts"
      provides: "Supabase singleton with PKCE + detectSessionInUrl"
      exports: ["supabase"]
    - path: "src/stores/authStore.ts"
      provides: "Zustand auth slice with initAuthListener"
      exports: ["useAuthStore", "initAuthListener"]
    - path: "src/router/index.tsx"
      provides: "createBrowserRouter with all Phase 1 routes"
      exports: ["router"]
  key_links:
    - from: "src/main.tsx"
      to: "src/router/index.tsx"
      via: "RouterProvider"
      pattern: "RouterProvider.*router"
    - from: "src/router/index.tsx"
      to: "src/lib/supabase.ts"
      via: "requireAuth loader"
      pattern: "supabase.auth.getSession"
    - from: "src/stores/authStore.ts"
      to: "src/lib/supabase.ts"
      via: "onAuthStateChange subscription"
      pattern: "onAuthStateChange"
---

<objective>
Wire the Supabase singleton, Zustand auth store, React Router v7 router, and entry point against the packages and build config established by Plan 01a. After this plan the app boots, routes correctly based on session state, and creates an anonymous session for unauthenticated visitors.

Purpose: These five files are the runtime skeleton — every subsequent plan in Phase 1 and all future phases depend on the Supabase singleton, auth store, and router contracts established here.

Output: src/lib/supabase.ts, src/stores/authStore.ts, src/router/index.tsx, src/routes/index.tsx, and a replaced src/main.tsx. No visible UI yet — auth screens are Plan 03.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-PATTERNS.md
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/SKELETON.md
@.planning/phases/01-foundation/01-01a-SUMMARY.md

<interfaces>
<!-- Key contracts the executor needs. Established by this plan for downstream plans. -->

authStore public surface (src/stores/authStore.ts):
  useAuthStore: ZustandStore<{ user: User|null, session: Session|null, isLoading: boolean, isAnonymous: boolean }>
  initAuthListener(): Subscription  — call once from main.tsx before render

router routes (src/router/index.tsx):
  /            → loader redirects to /auth/login (no session) or /home (session)
  /home        → protected, lazy: src/routes/home.tsx
  /auth/login  → lazy: src/routes/auth/login.tsx
  /auth/register → lazy: src/routes/auth/register.tsx
  /auth/verify → lazy: src/routes/auth/verify.tsx
  /auth/reset-password → lazy: src/routes/auth/reset-password.tsx
  /auth/verified → NO redirectIfAuthed loader (it IS the post-auth landing)

Tailwind v4 key class names (from @theme tokens in theme.css — Plan 01a):
  bg-background, bg-surface, bg-surface-elevated, bg-surface-inset
  text-text-primary, text-text-secondary, text-text-muted, text-accent
  border-border, border-border-gold
  font-display (Cinzel), font-body (Inter)
  rounded-md (--radius-md: 8px), rounded-lg (--radius-lg: 12px)
  shadow-md, shadow-gold
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire Supabase singleton, Zustand auth store, React Router, and entry point</name>
  <files>
    src/lib/supabase.ts,
    src/stores/authStore.ts,
    src/router/index.tsx,
    src/routes/index.tsx,
    src/main.tsx
  </files>
  <read_first>
    - .planning/phases/01-foundation/01-PATTERNS.md lines 234–395 — supabase.ts, authStore.ts, router/index.tsx, routes/index.tsx complete patterns to copy
    - .planning/phases/01-foundation/01-PATTERNS.md lines 130–173 — main.tsx replacement pattern
    - .planning/phases/01-foundation/01-RESEARCH.md lines 263–348 — Pattern 1 (Supabase client), Pattern 2 (Zustand store), Pattern 3 (router) with security notes
    - src/main.tsx — read current content before replacing
  </read_first>
  <action>
    Step 1 — Create src/lib/supabase.ts per PATTERNS.md Pattern 1:
    - Import `createClient` from `@supabase/supabase-js`
    - Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `import.meta.env`
    - Add runtime assertion that throws `Error('Missing Supabase env vars...')` if either is falsy (fail loudly in dev — RESEARCH.md Pitfall 5, mitigates T-1-06)
    - Call `createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } })`
    - Export as `supabase` (named export, not default)

    Step 2 — Create src/stores/authStore.ts per PATTERNS.md Pattern 2:
    - Define `AuthState` interface: `{ user: User|null, session: Session|null, isLoading: boolean, isAnonymous: boolean }`
    - Create store with `create<AuthState>()` initializing all fields to null/false/true for isLoading
    - Export `useAuthStore` (the store hook)
    - Export `initAuthListener()` function: calls `supabase.auth.getSession()` to set initial state, then calls `supabase.auth.onAuthStateChange()` to keep store current. Both update the full `{ session, user, isAnonymous: session?.user?.is_anonymous ?? false, isLoading: false }` state shape. Return the subscription from `initAuthListener` so main.tsx can call `.unsubscribe()` if needed.
    - Import `User` and `Session` types from `@supabase/supabase-js`
    - Use the exact `zustand` `create` import (no middleware in this store — no immer needed for flat auth state)

    Step 3 — Create src/router/index.tsx per PATTERNS.md Pattern 3:
    - Import `createBrowserRouter` and `redirect` from `react-router`
    - Define `requireAuth()` async function: calls `supabase.auth.getSession()`; if no session throws `redirect('/auth/login')`; returns session
    - Define `redirectIfAuthed()` async function: calls `supabase.auth.getSession()`; if session exists throws `redirect('/home')`; returns null
    - Define anonymous session guard `ensureAnonymousSession()`: calls `supabase.auth.getSession()`; only calls `supabase.auth.signInAnonymously()` if session is null — NEVER call signInAnonymously unconditionally (mitigates T-1-01)
    - Build `createBrowserRouter` with routes exactly matching CONTEXT.md D-02 and PATTERNS.md Pattern 3:
      - `{ path: '/', loader: redirects to /home or /auth/login based on session }`
      - Protected layout: `{ loader: requireAuth, children: [{ path: '/home', lazy: () => import('@/routes/home') }] }`
      - Auth layout: `{ path: '/auth', loader: redirectIfAuthed, children: [login, register, verify, reset-password] }`
      - Standalone: `{ path: '/auth/verified', lazy: () => import('@/routes/auth/verified') }` — no redirectIfAuthed loader (per D-04 note in PATTERNS.md)
    - Export as `router` (named export)
    - The `/auth/login` loader also calls `ensureAnonymousSession()` so a session exists for any guest who lands on the login page without signing in

    Step 4 — Create src/routes/index.tsx per PATTERNS.md: export `function Component() { return null }` — this route always redirects via loader, never renders.

    Step 5 — Replace src/main.tsx per PATTERNS.md replacement pattern:
    - Import `StrictMode` from `react`, `createRoot` from `react-dom/client`
    - Import `RouterProvider` from `react-router`
    - Import `Toaster` from `sonner`
    - Import `router` from `@/router`
    - Import `initAuthListener` from `@/stores/authStore`
    - Import `@/styles/theme.css` (replaces the old `./index.css`)
    - Call `initAuthListener()` BEFORE `createRoot(...).render(...)` — ensures auth state is wired before any route loader runs (per D-03)
    - Render `<StrictMode><RouterProvider router={router} /><Toaster richColors position="top-right" /></StrictMode>`
    - Do NOT import the old `App.tsx` or `App.css`
  </action>
  <verify>
    <automated>pnpm tsc --noEmit 2>&1 | head -20 && grep -c "flowType.*pkce\|pkce" src/lib/supabase.ts && grep -c "signInAnonymously" src/router/index.tsx && grep -n "if.*session\|if.*!session" src/router/index.tsx | grep -i "anon\|signIn" | head -5 && grep -c "initAuthListener" src/main.tsx</automated>
  </verify>
  <done>
    - `pnpm tsc --noEmit` exits 0 (no TypeScript errors)
    - `src/lib/supabase.ts` exports `supabase` with `flowType: 'pkce'` and `detectSessionInUrl: true`
    - `src/lib/supabase.ts` contains the env var runtime assertion (`throw new Error` when vars missing)
    - `src/stores/authStore.ts` exports both `useAuthStore` and `initAuthListener`
    - `src/router/index.tsx` exports `router`; contains `requireAuth` and `redirectIfAuthed` loader functions
    - `src/router/index.tsx` guard: `signInAnonymously` appears exactly once, inside a condition checking `if (!session)` (mitigates T-1-01)
    - `src/main.tsx` imports `@/styles/theme.css` (not the old index.css)
    - `src/main.tsx` calls `initAuthListener()` before `createRoot(...).render(...)`
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → Supabase Auth API | PKCE auth code exchange; tokens must not appear in URL hash |
| localStorage → React state | JWT in localStorage rehydrated via `getSession()`; XSS could read it |
| env vars → Vite bundle | `VITE_*` vars baked into JS bundle at build time; anon key is safe to expose |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-1-01 | Spoofing | `signInAnonymously()` in router loader | mitigate | Guard: call `signInAnonymously()` only when `getSession()` returns null — prevents orphaned anon users on every page load |
| T-1-02 | Information Disclosure | Anonymous session in shared devices | accept | Supabase anon JWT is low-value (no PII); documented in SKELETON.md; session cleared on sign-out |
| T-1-03 | Tampering | OAuth PKCE callback | mitigate | `flowType: 'pkce'` in `createClient` config — supabase-js handles code verifier; `detectSessionInUrl: true` auto-exchanges `?code=` without exposing token in hash |
| T-1-06 | Information Disclosure | Session JWT in localStorage | accept | Supabase default behavior; ASVS L1 accepts localStorage for SPAs without httpOnly alternative; XSS risk mitigated by React's default output encoding |
| T-1-SC | Tampering | npm/pnpm installs | mitigate | All packages verified in RESEARCH.md Package Legitimacy Audit; none flagged [ASSUMED] or [SUS]; no human checkpoint required |
</threat_model>

<verification>
After task completes:

1. `pnpm tsc --noEmit` exits 0 — no TypeScript errors
2. `grep -c "signInAnonymously" src/router/index.tsx` returns 1 — guard is singular
3. `grep "flowType" src/lib/supabase.ts` returns `flowType: 'pkce'`
4. `grep "initAuthListener" src/main.tsx` returns a match — called before createRoot
</verification>

<success_criteria>
Supabase singleton, Zustand auth store, React Router, and entry point are all wired. The app's architectural skeleton is complete. Auth screens (Plan 03) and home page (Plan 04) can now be implemented as route modules against these contracts.
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-01b-SUMMARY.md` when done
</output>
