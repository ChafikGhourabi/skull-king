# Phase 1: Foundation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 01-foundation
**Areas discussed:** App shell & routing, Supabase schema scope, Guest upgrade prompt, Netlify deploy strategy

---

## App shell & routing

### Q1: Authenticated home in Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder 'lobby coming soon' page | Simple branded screen, keeps Phase 1 lean | ✓ |
| Skeleton nav shell with empty sections | Full chrome, earlier architecture setup | |
| Redirect to /dashboard route | Clean URL structure from the start | |

**User's choice:** Placeholder 'lobby coming soon' page

---

### Q2: Route set for Phase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: / + /auth/* + /home | Only what Phase 1 needs | ✓ |
| Full route tree stubbed out | All routes as empty pages now | |
| SPA-style hash routing | Hash-based URLs | |

**User's choice:** Minimal route set

---

### Q3: Landing page at /

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect: / → /auth/login or /home | No separate landing page | ✓ |
| Simple branded landing page | Brief splash with CTAs | |
| You decide | Claude picks | |

**User's choice:** Redirect — no landing page in Phase 1

---

### Q4: Post-email-verification landing

| Option | Description | Selected |
|--------|-------------|----------|
| /auth/verified screen → auto-redirect to /home | Brief confirmation, then into app | ✓ |
| Straight to /home with toast | Faster, toast announces verification | |
| Back to /auth/login with success banner | More friction | |

**User's choice:** /auth/verified screen with auto-redirect

---

## Supabase schema scope

### Q1: How much schema to provision in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Full game schema now | All tables upfront, no future migrations | ✓ |
| Auth-only (profiles table) | Leaner Phase 1, Phase 2 adds game tables | |
| Profiles + skeleton tables | Tables without constraints | |

**User's choice:** Full game schema now

---

### Q2: RLS in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| RLS policies written in Phase 1 | Enabled from day one | ✓ |
| RLS off until Phase 3–4 | Simpler Phase 1 | |
| You decide | Claude decides | |

**User's choice:** RLS on from day one

---

### Q3: Schema management approach

| Option | Description | Selected |
|--------|-------------|----------|
| SQL migration files in repo | Version-controlled, reproducible | ✓ |
| Supabase dashboard (manual) | No git tracking | |
| Prisma migrations | More overhead than needed | |

**User's choice:** SQL migration files in supabase/migrations/

---

### Q4: RPCs in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Schema + placeholder RPC stubs | Tables + stubs returning "not implemented" | ✓ |
| Schema only, RPCs in Phase 2 | Cleaner phase separation | |
| You decide | Claude decides | |

**User's choice:** Schema + placeholder RPC stubs

---

## Guest upgrade prompt

### Q1: When to show upgrade prompt?

| Option | Description | Selected |
|--------|-------------|----------|
| After first game ends | Highest conversion moment | ✓ |
| On first restricted action | Fully frictionless until then | |
| Immediately with dismissible banner | Always visible | |

**User's choice:** After first game ends

---

### Q2: Upgrade UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline modal | Sign-up form over current screen, no navigation | ✓ |
| Full-page redirect to /auth/register?upgrade=true | Clean page, more focused | |
| You decide | Claude decides | |

**User's choice:** Inline modal — Supabase anonymous session linked to new account

---

### Q3: Guest session persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase anon JWT in localStorage — persists through browser close | Survives session | ✓ |
| Session expires after X hours, data purged | DB cleanliness | |
| You decide | Claude decides | |

**User's choice:** Persistent anon JWT in localStorage

---

### Q4: Guest vs. authed UI differentiation

| Option | Description | Selected |
|--------|-------------|----------|
| 'Guest Mode' chip + 'Create account' CTA in header | Subtle, persistent nudge | ✓ |
| Identical UI, upgrade prompt only contextually | No permanent distinction | |
| You decide | Claude decides | |

**User's choice:** "Guest Mode" indicator in header for guests

---

## Netlify deploy strategy

### Q1: Environment setup

| Option | Description | Selected |
|--------|-------------|----------|
| Single env: main → production | Simple, zero overhead | ✓ |
| main → prod + branch preview deploys | Each PR gets a URL | |
| main → prod + separate staging site | Two Netlify sites + two Supabase projects | |

**User's choice:** Single environment, main → production only

---

### Q2: Supabase credentials management

| Option | Description | Selected |
|--------|-------------|----------|
| Netlify environment variables (set in dashboard) + .env.example in repo | Standard, secrets never in repo | ✓ |
| .env file committed to repo | Security anti-pattern | |
| Netlify CLI encrypted secrets | Team-friendly but overkill | |

**User's choice:** Netlify env vars + .env.example

---

### Q3: Keep-alive cron in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — set it up in Phase 1 | Prevents Supabase project from pausing | ✓ |
| Defer to post-MVP | Risk of forgetting | |
| You decide | Claude decides | |

**User's choice:** Wire keep-alive cron in Phase 1

---

## Claude's Discretion

- Exact Supabase migration numbering scheme and file naming convention
- Specific RLS policy SQL conditions per table
- Auto-redirect delay duration on /auth/verified (e.g., 3 seconds)
- Netlify scheduled function cron expression for keep-alive

## Deferred Ideas

None — discussion stayed within phase scope.
