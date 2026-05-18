---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.6 |
| **Config file** | `vite.config.ts` (vitest config merged) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | — | — | N/A — infrastructure | setup | `npx vitest run` exits 0 | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | T-1-01 | signInAnonymously only if session is null | unit | `npx vitest run src/lib/supabase.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-03 | T-1-02 | anonymous session created, user.role = 'anon' | unit | `npx vitest run src/auth/` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | AUTH-01 | T-1-03 | email+password signup creates user, verification email sent | integration | manual + `npx vitest run src/auth/signup.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | AUTH-02 | T-1-04 | Google OAuth redirects to /auth/callback, session created | manual | manual (OAuth round-trip) | N/A | ⬜ pending |
| 1-03-01 | 03 | 2 | AUTH-04 | T-1-05 | guest upgrade preserves user_id, game_history rows intact | unit | `npx vitest run src/auth/upgrade.test.ts` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 3 | AUTH-05 | T-1-06 | session survives refresh, getSession() returns non-null | unit | `npx vitest run src/auth/session.test.ts` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 3 | AUTH-06 | — | Netlify deploy returns 200 on /, SPA fallback works | manual | `curl -I https://<site>.netlify.app/` | N/A | ⬜ pending |
| 1-06-01 | 06 | 3 | AUTH-07 | T-1-07 | supabase db push exits 0, profiles table + declared_mode column exist | integration | `supabase db push && supabase db diff` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/supabase.test.ts` — stubs for AUTH-01 (singleton guard)
- [ ] `src/auth/signup.test.ts` — stubs for AUTH-01 (email flow)
- [ ] `src/auth/upgrade.test.ts` — stubs for AUTH-04 (guest conversion)
- [ ] `src/auth/session.test.ts` — stubs for AUTH-05 (session persistence)
- [ ] `vitest` install + `@testing-library/react` — if not yet in package.json

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth round-trip | AUTH-02 | Requires live Google OAuth app + browser redirect | Click "Sign in with Google", verify redirect back to app with session |
| Verification email delivered | AUTH-01 | Requires real SMTP delivery | Sign up with real email, check inbox within 5 min |
| Netlify live deploy | AUTH-06 | Requires linked Netlify site + DNS | Deploy, visit `https://<site>.netlify.app/`, verify 200 on `/` and `/game/fake-route` |
| Supabase remote DB schema | AUTH-07 | Requires live Supabase project | Run `supabase db push`, check dashboard for `profiles` table and `declared_mode` column |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
