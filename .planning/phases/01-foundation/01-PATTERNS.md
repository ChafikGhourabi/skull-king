# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 26 new/modified files
**Analogs found:** 3 / 26 (scaffold files only — all new files have no codebase analog)

---

## Codebase Analog Summary

The project is a pure Vite scaffold. The only existing source files are:

| File | Contents |
|------|----------|
| `src/main.tsx` | `createRoot` + `<StrictMode>` wrapper — will be fully replaced |
| `src/App.tsx` | Single-line Vite default — will be fully replaced |
| `src/index.css` | Vite starter CSS variables — will be fully replaced |
| `vite.config.ts` | `@vitejs/plugin-react` + `@rolldown/plugin-babel` + React Compiler — will be extended |

No controllers, services, stores, routes, middleware, or utility files exist yet.
**All patterns come from RESEARCH.md verified examples and CLAUDE.md conventions.**

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `vite.config.ts` | config | — | `vite.config.ts` (existing) | modify — add tailwindcss() plugin |
| `index.html` | config | — | none | no analog — follow RESEARCH.md |
| `src/main.tsx` | entry | request-response | `src/main.tsx` (existing) | replace — add RouterProvider |
| `src/styles/theme.css` | config | — | `src/index.css` (existing) | no analog — exact tokens from UI-SPEC.md |
| `src/styles/globals.css` | config | — | none | no analog — shadcn CSS variable layer |
| `src/lib/supabase.ts` | utility | request-response | none | no analog — RESEARCH.md Pattern 1 |
| `src/stores/authStore.ts` | store | event-driven | none | no analog — RESEARCH.md Pattern 2 |
| `src/router/index.tsx` | config | request-response | none | no analog — RESEARCH.md Pattern 3 |
| `src/components/ui/*` | component | request-response | none | no analog — shadcn CLI copies |
| `src/components/auth/AuthLayout.tsx` | component | request-response | none | no analog — UI-SPEC.md auth layout |
| `src/components/auth/GuestBadge.tsx` | component | request-response | none | no analog — UI-SPEC.md D-12 |
| `src/components/auth/GuestUpgradeModal.tsx` | component | request-response | none | no analog — RESEARCH.md Pattern 5 |
| `src/routes/index.tsx` | route | request-response | none | no analog — RESEARCH.md Pattern 3 |
| `src/routes/home.tsx` | route | request-response | none | no analog — placeholder page |
| `src/routes/auth/login.tsx` | route | request-response | none | no analog — RESEARCH.md AUTH-01/05 |
| `src/routes/auth/register.tsx` | route | request-response | none | no analog — RESEARCH.md AUTH-01 |
| `src/routes/auth/verify.tsx` | route | request-response | none | no analog — RESEARCH.md AUTH-02 |
| `src/routes/auth/reset-password.tsx` | route | request-response | none | no analog — RESEARCH.md AUTH-03 |
| `src/routes/auth/verified.tsx` | route | request-response | none | no analog — RESEARCH.md D-04 |
| `netlify/functions/keep-alive.ts` | utility | batch | none | no analog — RESEARCH.md Pattern 6 |
| `netlify.toml` | config | — | none | no analog — RESEARCH.md SPA redirect |
| `.env.example` | config | — | none | no analog — D-14 |
| `supabase/config.toml` | config | — | none | no analog — supabase CLI init output |
| `supabase/migrations/20260518000001_initial_schema.sql` | migration | CRUD | none | no analog — RESEARCH.md Pattern 7 |
| `supabase/migrations/20260518000002_rpc_stubs.sql` | migration | CRUD | none | no analog — RESEARCH.md Pattern 8 |
| `src/setupTests.ts` | config | — | none | no analog — vitest setup |

---

## Pattern Assignments

### `vite.config.ts` (config — modify existing)

**Analog:** `vite.config.ts` lines 1–11 (existing file — extend, do not replace)

**Existing pattern to preserve** (lines 1–11):
```typescript
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
```

**Required additions:**
- Import `tailwindcss` from `@tailwindcss/vite`
- Add `tailwindcss()` as the **first** plugin in the array (RESEARCH.md Pitfall 8 — must precede React/babel plugins)
- Add path alias `@` → `src/` (required by all imports in stores, lib, routes)
- Add `test` block for vitest (RESEARCH.md Code Examples — vitest config)

**Target pattern:**
```typescript
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),           // FIRST — per Tailwind v4 Vite docs (RESEARCH.md Pitfall 8)
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    aliases: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
```

---

### `index.html` (config — modify existing)

**Analog:** existing `index.html` (Vite default) — extend, do not replace body

**Required additions:**
- Add Google Fonts `<link>` tags for Cinzel (weight 700) and Inter (weight 400) in `<head>`
- Cinzel is display/heading font; Inter is body font (UI-SPEC.md Design System)

**Target `<head>` additions:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400&display=swap" rel="stylesheet">
```

---

### `src/main.tsx` (entry — full replacement)

**Analog:** `src/main.tsx` lines 1–10 (existing) — structural pattern only; content replaced

**Existing structural pattern to follow:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// global styles import
// root component import

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* root component */}
  </StrictMode>,
)
```

**Required changes:**
- Remove `App` import; replace with `RouterProvider` from `react-router`
- Import `router` from `@/router`
- Import `@/styles/theme.css` instead of `./index.css`
- Call `initAuthListener()` from `@/stores/authStore` before render (RESEARCH.md Pattern 2)
- Wrap with `<Toaster />` from `sonner` for global toast support

**Target pattern:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { initAuthListener } from '@/stores/authStore'
import '@/styles/theme.css'

initAuthListener()  // wire onAuthStateChange before first render

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </StrictMode>,
)
```

---

### `src/styles/theme.css` (config — new file)

**Analog:** `src/index.css` (existing) — structural reference only; ALL token values come from UI-SPEC.md

**Key rule:** Do NOT invent or copy values from `src/index.css`. Use exact OKLCH values from `01-UI-SPEC.md`.
`src/index.css` uses a Vite default light/dark palette — it is entirely replaced.

**File structure pattern (from RESEARCH.md Architecture Patterns):**
```css
/* src/styles/theme.css */
@import "tailwindcss";   /* Tailwind v4 CSS-first entry point */

@theme {
  /* All tokens from 01-UI-SPEC.md Design Tokens section */
  /* Fonts, raw palette (wood/parchment/gold/suit/danger), semantic tokens, radii, spacing */
}
```

**Critical:** The `@import "tailwindcss"` line replaces both `@tailwind base/components/utilities`.
Tailwind v4 is CSS-first — no `tailwind.config.js` exists (RESEARCH.md State of the Art).
Full token block is in `01-UI-SPEC.md` — copy verbatim.

---

### `src/styles/globals.css` (config — new file)

**Analog:** none — shadcn CSS variable mapping layer

**Purpose:** Maps pirate semantic tokens to shadcn's expected CSS variable names (`--background`, `--foreground`, `--primary`, etc.) so shadcn components render with the pirate palette.

**Pattern (RESEARCH.md Pitfall 7):**
```css
/* src/styles/globals.css */
/* shadcn CSS variable overrides — maps pirate tokens to shadcn names */
/* Import this AFTER theme.css in any component or layout that uses shadcn */
@layer base {
  :root {
    --background: var(--color-background);
    --foreground: var(--color-text-primary);
    --card: var(--color-surface);
    --card-foreground: var(--color-text-primary);
    --primary: var(--color-accent);
    --primary-foreground: var(--color-wood-950);
    --muted: var(--color-surface-elevated);
    --muted-foreground: var(--color-text-muted);
    --border: var(--color-border);
    --input: var(--color-surface-inset);
    --ring: var(--color-border-gold);
    --destructive: var(--color-destructive);
    --destructive-foreground: var(--color-destructive-text);
    /* radius comes from UI-SPEC.md --radius-* tokens */
  }
}
```

---

### `src/lib/supabase.ts` (utility — new file)

**Analog:** none — no existing lib files

**Source pattern:** RESEARCH.md Pattern 1 (verified against supabase.com/docs/guides/auth/sessions/pkce-flow)

**Complete pattern to copy:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Runtime assertion — fail loudly in dev if env vars missing (RESEARCH.md Pitfall 5)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',           // secure SPA default — never expose token in URL hash
    detectSessionInUrl: true,   // auto-exchanges ?code= on load (OAuth + email verify)
    persistSession: true,       // JWT in localStorage (default true)
    autoRefreshToken: true,     // default true
  },
})
```

**Anti-pattern to avoid (RESEARCH.md):** Do NOT call `supabase.auth.user()` — removed in v2. Use `getSession()` or `getUser()`.

---

### `src/stores/authStore.ts` (store — new file, event-driven)

**Analog:** none — no existing stores

**Source pattern:** RESEARCH.md Pattern 2 (Zustand auth store + onAuthStateChange)

**Complete pattern to copy:**
```typescript
// src/stores/authStore.ts
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

// Call once from main.tsx before first render
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

**Zustand slice pattern note:** CLAUDE.md mandates Zustand for UI state. This is the auth slice. Future phases add game state slices to separate store files — not merged into this one.

---

### `src/router/index.tsx` (config — new file, request-response)

**Analog:** none — no existing router config

**Source pattern:** RESEARCH.md Pattern 3 (React Router v7 loader-based protected routes)

**Complete pattern to copy:**
```typescript
// src/router/index.tsx
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
    loader: () =>
      supabase.auth.getSession().then(({ data: { session } }) =>
        session ? redirect('/home') : redirect('/auth/login')
      ),
  },
  {
    // Protected layout — all children require auth
    loader: requireAuth,
    children: [
      { path: '/home', lazy: () => import('@/routes/home') },
    ],
  },
  {
    path: '/auth',
    loader: redirectIfAuthed,   // redirect already-authed users away from auth screens
    children: [
      { path: 'login',          lazy: () => import('@/routes/auth/login') },
      { path: 'register',       lazy: () => import('@/routes/auth/register') },
      { path: 'verify',         lazy: () => import('@/routes/auth/verify') },
      { path: 'reset-password', lazy: () => import('@/routes/auth/reset-password') },
    ],
  },
  // /auth/verified does NOT redirect authed users — it IS the post-auth landing (D-04)
  { path: '/auth/verified', lazy: () => import('@/routes/auth/verified') },
])
```

**Key:** `lazy:` enables code-splitting per route. The `loader` runs before the component renders — no render-then-fetch waterfall (RESEARCH.md State of the Art).

---

### `src/routes/index.tsx` (route — new file, request-response)

**Analog:** none

**Pattern:** Root redirect handler — loader only, no UI component needed.
```typescript
// src/routes/index.tsx
// This route is handled entirely by the loader in src/router/index.tsx
// No component export needed — the loader always throws a redirect
export default function IndexRoute() {
  return null  // never rendered
}
```

---

### `src/routes/home.tsx` (route — new file, request-response)

**Analog:** none — branded placeholder page

**Pattern:** Lazy-loaded route module with named `Component` export (React Router v7 lazy convention).
Apply pirate theme tokens. Render `GuestBadge` in header for anonymous users (D-12).

```typescript
// src/routes/home.tsx
import { useAuthStore } from '@/stores/authStore'
import { GuestBadge } from '@/components/auth/GuestBadge'

export function Component() {
  const { isAnonymous, user } = useAuthStore()

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center">
      <header className="absolute top-4 right-4">
        {isAnonymous ? <GuestBadge /> : <span>{user?.email}</span>}
      </header>
      <h1 className="font-display text-accent">Skull King</h1>
      <p className="text-text-secondary">Game loading… coming soon</p>
    </main>
  )
}
```

**Note:** `font-display` maps to `--font-display: "Cinzel"` from theme.css. `text-accent` maps to `--color-accent`. All class names follow Tailwind v4 CSS-first naming from the `@theme` block.

---

### `src/routes/auth/login.tsx` (route — new file, request-response)

**Analog:** none

**Pattern:** Lazy route module. Uses `react-hook-form` + `zod` resolver for validation. Two auth paths: email/password + Google OAuth. Error displayed via `sonner` toast.

```typescript
// src/routes/auth/login.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthLayout } from '@/components/auth/AuthLayout'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export function Component() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) toast.error(error.message)
    // on success: onAuthStateChange fires → Zustand updates → router loader redirects to /home
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Input + Button shadcn components */}
      </form>
    </AuthLayout>
  )
}
```

**Reuse this exact form structure** for `register.tsx` and `reset-password.tsx` — same imports, same `zodResolver` pattern, same `toast.error` for errors.

---

### `src/routes/auth/register.tsx` (route — new file, request-response)

**Analog:** Copy `login.tsx` form structure above

**Differences from login:**
- Schema adds `confirmPassword` + `.refine()` for match check
- Submit calls `supabase.auth.signUp({ email, password })` instead of `signInWithPassword`
- On success: navigate to `/auth/verify` (check email CTA screen) — use `useNavigate` from `react-router`
- Anonymous session upgrade path: if `isAnonymous`, call `supabase.auth.updateUser({ email, password })` instead of `signUp`

---

### `src/routes/auth/verify.tsx` (route — new file, request-response)

**Analog:** none — static informational screen

**Pattern:** No form. Static "Check your email" message. Optional resend button calls `supabase.auth.resend({ type: 'signup', email })`.

---

### `src/routes/auth/reset-password.tsx` (route — new file, request-response)

**Analog:** Copy `login.tsx` form structure

**Differences:**
- When arriving from email link (`PASSWORD_RECOVERY` event): show new password form
- `onAuthStateChange` listener inside component checks for `PASSWORD_RECOVERY` event
- Submit calls `supabase.auth.updateUser({ password: newPassword })`
- On initial load (no recovery event): show "enter email" form that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`

---

### `src/routes/auth/verified.tsx` (route — new file, request-response)

**Analog:** none — success screen with auto-redirect

**Pattern:** `useEffect` with `setTimeout` for auto-redirect. `useNavigate` from `react-router`.
`detectSessionInUrl: true` in supabase client means the session is already exchanged by the time this component mounts.

```typescript
// src/routes/auth/verified.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function Component() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 3000)  // 3s delay (Claude's discretion)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="font-display text-accent">Email Confirmed!</h1>
      <p className="text-text-secondary">Redirecting you to the game…</p>
    </main>
  )
}
```

---

### `src/components/auth/AuthLayout.tsx` (component — new file, request-response)

**Analog:** none — shared wrapper for all auth screens

**Pattern:** Accepts `title` prop and `children`. Renders centered card on dark wood background. Uses `font-display` (Cinzel) for title. Uses pirate palette tokens.

```typescript
// src/components/auth/AuthLayout.tsx
interface AuthLayoutProps {
  title: string
  children: React.ReactNode
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-8">
        <h1 className="font-display text-2xl text-accent text-center mb-6">{title}</h1>
        {children}
      </div>
    </main>
  )
}
```

---

### `src/components/auth/GuestBadge.tsx` (component — new file, request-response)

**Analog:** none — D-12 guest indicator chip

**Pattern:** Small badge visible in nav header. Shows "Guest Mode" chip + "Create account" CTA button. Only renders when `useAuthStore().isAnonymous === true`.

```typescript
// src/components/auth/GuestBadge.tsx
import { useAuthStore } from '@/stores/authStore'

export function GuestBadge() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  if (!isAnonymous) return null

  return (
    <div className="flex items-center gap-2">
      <span className="bg-accent-muted text-accent text-xs px-2 py-1 rounded-full">
        Guest Mode
      </span>
      {/* "Create account" CTA — opens GuestUpgradeModal in Phase 2+ post-game flow */}
    </div>
  )
}
```

**Zustand selector pattern:** Use `useAuthStore((s) => s.isAnonymous)` (selector, not full store) to avoid unnecessary re-renders — CLAUDE.md mandates Zustand selector subscriptions.

---

### `src/components/auth/GuestUpgradeModal.tsx` (component — new file, request-response)

**Analog:** none — D-10 inline upgrade modal

**Pattern:** Dialog (shadcn `<Dialog>`) shown after first game ends (trigger controlled by parent). Two upgrade paths:

```typescript
// src/components/auth/GuestUpgradeModal.tsx
// Source: RESEARCH.md Pattern 5
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// OAuth path (requires Manual Linking enabled in Supabase dashboard — RESEARCH.md Pitfall 2)
async function upgradeWithGoogle() {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/home` },
  })
  if (error) toast.error(error.message)
}

// Email path — attaches email to anon user, triggers verification email
async function upgradeWithEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email })
  if (error) toast.error(error.message)
  else toast.success('Check your email to verify your account')
}
```

**Critical note from RESEARCH.md Pitfall 2:** Document in code comments that "Manual Linking" must be enabled in Supabase dashboard > Auth > Settings for `linkIdentity` to work.

---

### `src/components/ui/*` (components — shadcn CLI generated)

**Analog:** none — generated by `npx shadcn@latest init` + individual `add` commands

**Pattern:** Do NOT hand-write these. Run shadcn CLI:
```bash
pnpm dlx shadcn@latest init          # initializes components.json, copies base files
pnpm dlx shadcn@latest add button    # copies src/components/ui/button.tsx
pnpm dlx shadcn@latest add input     # copies src/components/ui/input.tsx
pnpm dlx shadcn@latest add label     # copies src/components/ui/label.tsx
pnpm dlx shadcn@latest add dialog    # copies src/components/ui/dialog.tsx
```

After init, immediately override all generated CSS variables in `src/styles/globals.css` with pirate token mappings (RESEARCH.md Pitfall 7).

**`cn()` helper** (referenced by all shadcn components — must exist before adding any component):
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### `netlify/functions/keep-alive.ts` (utility — new file, batch)

**Analog:** none — no existing Netlify functions

**Source pattern:** RESEARCH.md Pattern 6 (verified against docs.netlify.com/functions/scheduled-functions)

**Complete pattern to copy:**
```typescript
// netlify/functions/keep-alive.ts
import type { Config } from "@netlify/functions"

export default async () => {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`
  await fetch(url, {
    headers: {
      apikey: process.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
  })
  console.log('[keep-alive] Supabase ping sent at', new Date().toISOString())
}

export const config: Config = {
  schedule: "0 0 */3 * *"   // every 3 days at midnight UTC (Claude's discretion — D-15)
}
```

**Note (RESEARCH.md Assumption A3):** Netlify Functions v5 TypeScript with `.ts` extension. If build fails, may need `tsconfig.json` in `netlify/functions/` or `.mts` extension.

---

### `netlify.toml` (config — new file)

**Analog:** none

**Source pattern:** RESEARCH.md Code Examples (verified against docs.netlify.com/frameworks/vite)

**Complete file:**
```toml
[build]
  command   = "pnpm build"
  publish   = "dist"

# SPA fallback — ALL paths serve index.html (RESEARCH.md Pitfall 4)
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

---

### `.env.example` (config — new file)

**Analog:** none

**Pattern:** Documents all required env vars — D-14.
```bash
# .env.example
# Copy to .env.local and fill in values from your Supabase project dashboard
# Never commit .env.local — it is gitignored

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### `supabase/migrations/20260518000001_initial_schema.sql` (migration — new file, CRUD)

**Analog:** none — no existing migrations

**Source pattern:** RESEARCH.md Pattern 7 (RLS policy SQL template, verified against supabase.com/docs/guides/database/postgres/row-level-security)

**Tables to create (D-05):** `profiles`, `games`, `game_players`, `rounds`, `tricks`, `trick_cards` (with `declared_mode` column — D-17), `bids`, `scores`

**RLS pattern for every table (copy verbatim, vary table/column names):**
```sql
-- Pattern: always use (select auth.uid()) not auth.uid() — enables query plan caching (RESEARCH.md Pitfall 6)
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>: users read own row"
  ON <table> FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Game tables also need policies scoped to game_players membership:
CREATE POLICY "trick_cards: player in game can read"
  ON trick_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = trick_cards.game_id
        AND game_players.user_id = (select auth.uid())
    )
  );

-- Index every column used in USING clauses:
CREATE INDEX <table>_user_id_idx ON <table> USING btree (user_id);
```

**Anti-pattern to avoid (RESEARCH.md):** Do NOT use `FOR ALL` — one policy per operation (SELECT, INSERT, UPDATE, DELETE).

---

### `supabase/migrations/20260518000002_rpc_stubs.sql` (migration — new file, CRUD)

**Analog:** none

**Source pattern:** RESEARCH.md Pattern 8 (SECURITY DEFINER stub functions)

**Stub template (copy for each RPC — `create_game`, `join_game`, `play_card`, `submit_bid`, `resolve_trick`, `end_game`):**
```sql
-- CRITICAL: SET search_path = public prevents search path injection (RESEARCH.md Anti-patterns)
CREATE OR REPLACE FUNCTION public.create_game(
  p_max_players int DEFAULT 8,
  p_card_mode   text DEFAULT 'standard'
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
-- Phase 2 fills in the logic — stub establishes the RPC-only mutation pattern (D-08, D-16)
```

---

### `src/setupTests.ts` (config — new file)

**Analog:** none

**Pattern:** vitest global test setup.
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
```

---

## Shared Patterns

### Anonymous Session Initialization
**Source:** RESEARCH.md Pattern 4
**Apply to:** Root layout or `src/main.tsx` — called once on app boot, before first render

```typescript
// Called after initAuthListener() in main.tsx, or inside root route loader
async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // CRITICAL: check first — signInAnonymously() always creates new user (RESEARCH.md Pitfall 1)
    await supabase.auth.signInAnonymously()
    // onAuthStateChange fires and updates Zustand store
  }
}
```

### Error Handling — Auth Operations
**Source:** RESEARCH.md Code Examples
**Apply to:** All auth route components (`login.tsx`, `register.tsx`, `reset-password.tsx`, `GuestUpgradeModal.tsx`)

```typescript
// Standard pattern — check error, show toast, do not throw
const { data, error } = await supabase.auth.<method>(...)
if (error) {
  toast.error(error.message)
  return
}
// happy path continues
```

### Tailwind Class Composition
**Source:** CLAUDE.md (`cn()` helper pattern)
**Apply to:** All component files that use conditional classes

```typescript
import { cn } from '@/lib/utils'

// Usage:
<div className={cn('base-classes', condition && 'conditional-class', props.className)} />
```

### Lazy Route Module Export Convention
**Source:** RESEARCH.md Pattern 3 (`lazy:` in createBrowserRouter)
**Apply to:** All files under `src/routes/`

```typescript
// Every route file must use named `Component` export (React Router v7 lazy convention)
export function Component() {
  return <div>...</div>
}
// NOT: export default function ...
```

### Zustand Selector Subscription
**Source:** CLAUDE.md ("selector subscriptions")
**Apply to:** All components that read from `useAuthStore` (and future stores)

```typescript
// CORRECT — only re-renders when isAnonymous changes
const isAnonymous = useAuthStore((s) => s.isAnonymous)

// AVOID — re-renders on any store change
const { isAnonymous } = useAuthStore()
```

### Path Aliases
**Source:** RESEARCH.md Architecture / CLAUDE.md
**Apply to:** All imports in `src/`

```typescript
// Use @/ alias for all project imports — never use relative ../../../ paths
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
```

---

## No Analog Found

All 26 new/modified files have no close codebase match. The following table lists files where the planner should rely exclusively on RESEARCH.md patterns and UI-SPEC.md tokens:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/supabase.ts` | utility | request-response | No lib/ directory exists yet |
| `src/stores/authStore.ts` | store | event-driven | No stores/ directory exists yet |
| `src/router/index.tsx` | config | request-response | No router/ directory exists yet |
| `src/routes/auth/login.tsx` | route | request-response | No routes/ directory exists yet |
| `src/routes/auth/register.tsx` | route | request-response | Same |
| `src/routes/auth/verify.tsx` | route | request-response | Same |
| `src/routes/auth/reset-password.tsx` | route | request-response | Same |
| `src/routes/auth/verified.tsx` | route | request-response | Same |
| `src/routes/home.tsx` | route | request-response | Same |
| `src/routes/index.tsx` | route | request-response | Same |
| `src/components/auth/AuthLayout.tsx` | component | request-response | No components/ directory exists yet |
| `src/components/auth/GuestBadge.tsx` | component | request-response | Same |
| `src/components/auth/GuestUpgradeModal.tsx` | component | request-response | Same |
| `src/components/ui/*` | component | request-response | Generated by shadcn CLI — not hand-written |
| `src/lib/utils.ts` | utility | — | No lib/ directory exists yet |
| `src/styles/theme.css` | config | — | Tailwind v4 CSS-first — no prior CSS pattern |
| `src/styles/globals.css` | config | — | shadcn variable layer — no prior CSS pattern |
| `netlify/functions/keep-alive.ts` | utility | batch | No netlify/ directory exists yet |
| `netlify.toml` | config | — | No Netlify config exists yet |
| `.env.example` | config | — | No env example exists yet |
| `supabase/config.toml` | config | — | No supabase/ directory exists yet |
| `supabase/migrations/20260518000001_initial_schema.sql` | migration | CRUD | No migrations exist yet |
| `supabase/migrations/20260518000002_rpc_stubs.sql` | migration | CRUD | No migrations exist yet |
| `src/setupTests.ts` | config | — | No test infrastructure exists yet |

---

## Metadata

**Analog search scope:** `/Users/chafikghourabi/Desktop/Personal/Projects/skull-king/src/`
**Files scanned:** 4 existing source files (`main.tsx`, `App.tsx`, `index.css`, `vite.config.ts`)
**Packages already installed:** `react@^19.2.6`, `react-dom@^19.2.6`, `vite@^8.0.12`, `@vitejs/plugin-react@^6.0.1`, `typescript@~6.0.2`, `eslint` suite, `@rolldown/plugin-babel`, `babel-plugin-react-compiler`
**Packages NOT yet installed (required):** `@supabase/supabase-js`, `react-router`, `zustand`, `sonner`, `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `clsx`, `tailwind-merge`, `@netlify/functions`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@hookform/resolvers`, `zod`, `react-hook-form`
**Pattern extraction date:** 2026-05-18
