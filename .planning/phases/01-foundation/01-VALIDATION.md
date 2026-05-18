---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsc --noEmit`
- **After every plan wave:** Run `pnpm build`
- **Before `/gsd:verify-work`:** Full build + grep checks must be green
- **Max feedback latency:** 15 seconds

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — plans validate via `pnpm tsc --noEmit`, `pnpm build`, and grep checks rather than vitest unit stubs. Vitest test files are post-execution deliverables for `/gsd:verify-work`.

No Wave 0 stub files are required before execution begins.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 1-01a-01 | 01a | 1 | AUTH-04 | T-1-SC | All packages from approved legitimacy audit | build | `pnpm build 2>&1 \| tail -5` | ⬜ pending |
| 1-01b-01 | 01b | 1 | AUTH-04, AUTH-06 | T-1-01, T-1-03 | signInAnonymously only if session is null; flowType: pkce | tsc + grep | `pnpm tsc --noEmit 2>&1 \| head -20 && grep -c "flowType.*pkce\|pkce" src/lib/supabase.ts && grep -c "signInAnonymously" src/router/index.tsx` | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-01, AUTH-07 | T-1-04 | RLS on every table, declared_mode column present | grep | `grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/20260518000001_initial_schema.sql && grep -c "SET search_path = public" supabase/migrations/20260518000002_rpc_stubs.sql && grep -v "^--" supabase/migrations/20260518000001_initial_schema.sql \| grep -c "declared_mode"` | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-01, AUTH-07 | — | Supabase schema pushed successfully | manual | manual (supabase db push + dashboard check) | ⬜ pending |
| 1-03-01 | 03 | 2 | AUTH-01–AUTH-05 | T-AUTH-01, T-AUTH-02 | Both signUp + updateUser paths present; PASSWORD_RECOVERY detection | tsc + grep | `pnpm tsc --noEmit 2>&1 \| grep -E "auth/(login\|register\|verify\|verified\|reset)" \| head -10` | ⬜ pending |
| 1-04-01 | 04 | 2 | AUTH-06, AUTH-07 | T-1-05 | Guest upgrade preserves user_id path present | tsc + grep | `pnpm tsc --noEmit 2>&1 \| head -20 && grep -c "updateUser\|linkIdentity" src/components/auth/GuestUpgradeModal.tsx` | ⬜ pending |
| 1-05-01 | 05 | 3 | AUTH-01–AUTH-05 | — | Netlify deploy returns 200, SPA fallback works | manual | `curl -I https://<site>.netlify.app/` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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

- [x] All tasks have `<automated>` verify commands (tsc, build, or grep)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 complete: no stub files required — plans validate via build + grep
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
