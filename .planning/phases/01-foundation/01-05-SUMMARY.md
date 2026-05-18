---
phase: 01-foundation
plan: "05"
subsystem: deploy
tags: [netlify, supabase, keep-alive, scheduled-functions, spa-routing]
dependency_graph:
  requires: [01-01b, 01-02, 01-03, 01-04]
  provides: [netlify-deploy-config, supabase-keep-alive, spa-routing]
  affects: [all-routes, production-url]
tech_stack:
  added:
    - "@netlify/functions ^5.2.1 — scheduled functions Config type"
  patterns:
    - "Netlify scheduled function: export default async () + export const config: Config"
    - "SPA fallback redirect: [[redirects]] /* → /index.html :200 in netlify.toml"
    - "Supabase keep-alive: GET /rest/v1/ with apikey header every 3 days"
key_files:
  created:
    - netlify.toml
    - netlify/functions/keep-alive.ts
  modified:
    - .env.example
decisions:
  - "Used VITE_SUPABASE_PUBLISHABLE_KEY (not VITE_SUPABASE_ANON_KEY) in keep-alive to match the actual env var name in src/lib/supabase.ts"
  - "Schedule: 0 0 */3 * * (every 3 days at midnight UTC) — within 7-day inactivity threshold per D-15"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-18"
  tasks_completed: 1
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 1 Plan 05: Deploy Config + Keep-Alive Summary

**One-liner:** netlify.toml with SPA fallback redirect + scheduled keep-alive Supabase ping every 3 days to prevent free-tier inactivity pause.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create netlify.toml, keep-alive function, and .env.example | 7ce4737 | netlify.toml, netlify/functions/keep-alive.ts, .env.example |

## Blocked Tasks

| Task | Name | Status | Blocker |
|------|------|--------|---------|
| 2 | Deploy to Netlify and verify production app | BLOCKED | Requires human: GitHub push, Netlify site connection, env vars in Netlify dashboard, production verification |

## What Was Built

**netlify.toml** — Production build configuration:
- Build command: `pnpm build`
- Publish directory: `dist`
- SPA fallback: `[[redirects]] /* → /index.html :200` so all React Router routes work on direct navigation and browser refresh

**netlify/functions/keep-alive.ts** — Netlify scheduled function:
- Runs every 3 days at midnight UTC (`0 0 */3 * *`)
- GETs `${VITE_SUPABASE_URL}/rest/v1/` with the anon key header
- Prevents Supabase free-tier project from pausing after 7 days of inactivity (D-15)
- Uses `VITE_SUPABASE_PUBLISHABLE_KEY` to match the actual env var name in `src/lib/supabase.ts`

**.env.example** — Updated to document required env vars for Netlify dashboard configuration.

**Local build verified:** `pnpm build` exits 0, 1992 modules transformed, no TypeScript errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used correct Supabase key env var name**
- **Found during:** Task 1 — reading `src/lib/supabase.ts`
- **Issue:** Plan specified `VITE_SUPABASE_ANON_KEY` in keep-alive.ts, but the codebase uses `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase's new publishable key naming). Using mismatched names would require maintaining two separate env vars pointing to the same value.
- **Fix:** keep-alive.ts uses `process.env.VITE_SUPABASE_PUBLISHABLE_KEY` — matches the name users already configure in `.env.local`
- **Files modified:** netlify/functions/keep-alive.ts, .env.example
- **Commit:** 7ce4737

## Known Stubs

None — this plan creates configuration files, not UI components.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model:
- `VITE_SUPABASE_PUBLISHABLE_KEY` is the Supabase anon/public key — intentionally public-safe, accepted per T-DEPLOY-01
- `.env.local` covered by `.gitignore` (`*.local` pattern) — T-DEPLOY-02 mitigated
- Keep-alive pings every 3 days — T-DEPLOY-03 mitigated

## Self-Check

Files created:
- netlify.toml: EXISTS
- netlify/functions/keep-alive.ts: EXISTS
- .env.example: EXISTS (updated)

Commits:
- 7ce4737: feat(01-05): add netlify.toml, keep-alive function, and .env.example — EXISTS
