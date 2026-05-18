# Walking Skeleton — Phase 1: Foundation

**Phase:** 01-foundation
**Created:** 2026-05-18
**Status:** Draft — pending Phase 1 execution

---

## What is the Walking Skeleton?

The thinnest possible end-to-end slice that proves every layer of the stack connects:
a user can open the app URL, land on the sign-in screen, sign in (or continue as guest),
and reach a real `/home` route — all backed by a real Supabase project and deployed to Netlify.

No game logic. No lobby. No friends. Just: browser → Vite SPA → Supabase Auth → Postgres → Netlify.

---

## Architectural Decisions (locked for all future phases)

### Framework
| Decision | Value | Rationale |
|----------|-------|-----------|
| App type | Vite SPA (no SSR) | Free-tier Netlify; Supabase handles all backend |
| Framework | React 19 + TypeScript | Already scaffolded; React Compiler via babel-plugin-react-compiler |
| Entry point | `src/main.tsx` → `<RouterProvider>` | React Router v7 library mode, no framework mode |
| Build output | `dist/` | `pnpm build` → `tsc -b && vite build` |

### Routing
| Decision | Value | Rationale |
|----------|-------|-----------|
| Router | React Router v7 `createBrowserRouter` | Data loaders, code-splitting via `lazy:`, React 19 compat |
| Route modules | Named `Component` export (lazy convention) | Enables `lazy: () => import(...)` per route |
| Protected routes | Loader-based redirect | `requireAuth()` loader throws `redirect('/auth/login')` |
| SPA fallback | `netlify.toml` `[[redirects]] /* → /index.html :200` | All paths serve index.html; React Router handles routing |
| Auth redirect | `redirectIfAuthed()` loader on `/auth/*` | Already-authed users skip auth screens |

### State Management
| Decision | Value | Rationale |
|----------|-------|-----------|
| Auth state | Zustand v5 (`useAuthStore`) | `useSyncExternalStore`, React 19 StrictMode safe |
| Session init | `initAuthListener()` called in `main.tsx` before first render | `onAuthStateChange` keeps store live |
| Selector pattern | `useAuthStore((s) => s.field)` | Avoids unnecessary re-renders (CLAUDE.md mandate) |
| Game state | Zustand slices (future phases) | Separate store files, not merged into authStore |

### Database
| Decision | Value | Rationale |
|----------|-------|-----------|
| ORM | None — raw SQL migrations via Supabase CLI | No Prisma; migrations in `supabase/migrations/` |
| Migration tool | `supabase db push` | Applied via CLI; tracked in git |
| Schema scope | Full game schema in Phase 1 | Avoids schema migrations mid-game-development (D-05) |
| Mutations | `SECURITY DEFINER` RPC functions only | No direct client writes to game tables (D-16) |
| RLS | Enabled on all tables from day one | Minimal but correct policies (D-06) |
| RLS performance | `(select auth.uid())` not `auth.uid()` | Enables query plan caching |

### Authentication
| Decision | Value | Rationale |
|----------|-------|-----------|
| Client config | `flowType: 'pkce'`, `detectSessionInUrl: true` | Secure SPA; auto-exchanges `?code=` on load |
| Session storage | localStorage (Supabase default, `persistSession: true`) | Survives browser refresh |
| Anonymous sessions | `signInAnonymously()` — called only when no session exists | Guard prevents orphaned anon users (T-1-01) |
| Guest upgrade | `linkIdentity()` (OAuth) / `updateUser()` (email) | Same `user_id` preserved — no data migration |
| Manual Linking | Must be enabled in Supabase dashboard for `linkIdentity` | Required for OAuth guest upgrade (T-1-05) |

### Design System
| Decision | Value | Rationale |
|----------|-------|-----------|
| CSS framework | Tailwind v4 CSS-first (`@theme` block in `src/styles/theme.css`) | No `tailwind.config.js`; OKLCH pirate tokens |
| Vite integration | `@tailwindcss/vite` plugin (first in plugins array) | Faster than PostCSS in dev |
| Component library | shadcn/ui (CLI copy-paste, not a package) | Radix UI primitives with pirate theme override |
| Token system | Custom OKLCH palette — wood/parchment/gold/suit/danger families | Defined in `01-UI-SPEC.md`; never invent new values |
| Display font | Cinzel 700 (Google Fonts) | Page titles and wordmark only |
| Body font | Inter 400 (Google Fonts) | All other text |
| `cn()` utility | `clsx` + `tailwind-merge` in `src/lib/utils.ts` | Required by all shadcn components |

### Deployment
| Decision | Value | Rationale |
|----------|-------|-----------|
| Hosting | Netlify (free tier) | User specified; build from `main` branch |
| Environment | Single: `main` → production | No staging (single Supabase free-tier project — D-13) |
| Secrets | Netlify dashboard env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | Never in repo (D-14) |
| Keep-alive | Netlify scheduled function every 3 days | Prevents Supabase free-tier pause after 7 days inactivity (D-15) |

---

## Directory Layout (Phase 1 establishes, all future phases extend)

```
skull-king/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Singleton createClient (PKCE + detectSessionInUrl)
│   │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│   ├── stores/
│   │   └── authStore.ts         # Zustand auth slice + initAuthListener()
│   ├── router/
│   │   └── index.tsx            # createBrowserRouter (all routes + loaders)
│   ├── components/
│   │   ├── ui/                  # shadcn CLI-generated components
│   │   └── auth/
│   │       ├── AuthLayout.tsx   # Shared auth screen wrapper
│   │       ├── GuestBadge.tsx   # Nav chip for anonymous users (D-12)
│   │       └── GuestUpgradeModal.tsx  # Inline upgrade dialog (D-10)
│   ├── routes/
│   │   ├── index.tsx            # / redirect handler
│   │   ├── home.tsx             # /home placeholder (D-01)
│   │   └── auth/
│   │       ├── login.tsx        # /auth/login
│   │       ├── register.tsx     # /auth/register
│   │       ├── verify.tsx       # /auth/verify (check email CTA)
│   │       ├── reset-password.tsx  # /auth/reset-password
│   │       └── verified.tsx     # /auth/verified (auto-redirect to /home, D-04)
│   ├── styles/
│   │   ├── theme.css            # @import "tailwindcss" + @theme block (pirate tokens)
│   │   └── globals.css          # shadcn CSS variable → pirate token mapping
│   ├── main.tsx                 # Entry: RouterProvider + Toaster + initAuthListener()
│   └── setupTests.ts            # vitest global: import @testing-library/jest-dom
├── supabase/
│   ├── config.toml              # supabase init output
│   └── migrations/
│       ├── 20260518000001_initial_schema.sql   # All game tables + RLS
│       └── 20260518000002_rpc_stubs.sql        # SECURITY DEFINER stub functions
├── netlify/
│   └── functions/
│       └── keep-alive.ts        # Scheduled ping every 3 days (D-15)
├── index.html                   # Google Fonts link tags added
├── vite.config.ts               # + tailwindcss(), @ alias, test block
├── netlify.toml                 # SPA redirect + build config
└── .env.example                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## End-to-End Verification (Walking Skeleton passes when ALL true)

1. `pnpm dev` starts without errors; browser opens to `http://localhost:5173`
2. Unauthenticated visit to `/` redirects to `/auth/login`
3. Sign-in form renders with pirate theme (gold wordmark, dark wood background)
4. Email/password sign-in calls Supabase and redirects to `/home` on success
5. `/home` shows "Game loading… coming soon" with user email or GuestBadge
6. Browser refresh on `/home` keeps user signed in (session persists)
7. `supabase db push` applies both migrations without errors
8. All 8 game tables exist with RLS enabled (verifiable via Supabase dashboard)
9. Netlify deploy succeeds from `main` branch; app is live at production URL
10. Keep-alive function appears in Netlify dashboard scheduled functions list

---

## What Future Phases Build On

| Phase | Builds On Skeleton By |
|-------|----------------------|
| Phase 2: Game Engine | Imports `supabase` from `src/lib/supabase.ts`; uses migration tables |
| Phase 3: Lobby | Adds routes to `src/router/index.tsx`; uses `game_players` table |
| Phase 4: Gameplay | Uses `trick_cards` table with `declared_mode`; uses `authStore` for player identity |
| Phase 5–8 | All extend router, add Zustand slices, add migrations |

No phase renegotiates: the router root, the Supabase client config, the token system, or the Netlify deploy pipeline.
