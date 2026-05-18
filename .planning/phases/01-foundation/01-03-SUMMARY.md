---
phase: 01-foundation
plan: 03
subsystem: auth-screens
tags: [auth, react-hook-form, zod, supabase-auth, sonner, tailwind-v4, pirate-theme]

dependency_graph:
  requires:
    - 01-01b (supabase.ts, authStore.ts, router, shadcn components, theme.css)
  provides:
    - src/components/auth/AuthLayout.tsx
    - src/routes/auth/login.tsx
    - src/routes/auth/register.tsx
    - src/routes/auth/verify.tsx
    - src/routes/auth/verified.tsx
    - src/routes/auth/reset-password.tsx
  affects:
    - 01-04 (GuestBadge, GuestUpgradeModal — build on same AuthLayout)

tech_stack:
  added: []
  patterns:
    - react-hook-form + zodResolver for all auth forms (onBlur validation)
    - sonner toast.error(error.message) for all API error surface
    - supabase.auth.onAuthStateChange for PASSWORD_RECOVERY mode detection
    - Anonymous guest upgrade via supabase.auth.updateUser (AUTH-07)
    - 60-second resend cooldown via setInterval + useEffect cleanup

key_files:
  created:
    - src/components/auth/AuthLayout.tsx
  modified:
    - src/routes/auth/login.tsx
    - src/routes/auth/register.tsx
    - src/routes/auth/verify.tsx
    - src/routes/auth/verified.tsx
    - src/routes/auth/reset-password.tsx

decisions:
  - "AuthLayout: tagline 'Rule the seas. One trick at a time.' rendered above the card (not inside) to keep card contents clean"
  - "verified.tsx: kept simple standalone layout (min-h-screen bg-background) rather than AuthLayout card — success state doesn't need the card chrome"
  - "reset-password.tsx Mode A: fire-and-forget on resetPasswordForEmail — intentionally not checking error response to prevent email existence disclosure (T-AUTH-01)"
  - "resend cooldown: 60s via setInterval stored in useRef to survive re-renders without leaking"

metrics:
  duration: "5 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 1
  files_modified: 5
---

# Phase 01 Plan 03: Auth Screens Summary

**One-liner:** Five auth route components (login, register, verify, verified, reset-password) and shared AuthLayout implementing the full Skull King auth lifecycle with pirate theme, react-hook-form validation, Supabase Auth calls, and STRIDE threat mitigations.

## What Was Built

All five authentication route components replaced their Plan 01-01b stubs with complete implementations. The shared `AuthLayout` wrapper provides a centered card (max-w-sm, bg-surface, border-border, shadow-md) on the dark wood background (`bg-background`) with Cinzel display font for the tagline and page title.

### AuthLayout (`src/components/auth/AuthLayout.tsx`)
Shared wrapper for all auth screens. Accepts `title`, optional `subtitle`, and `children`. Renders the "Rule the seas. One trick at a time." tagline in Cinzel above the card. Nav-bar-free per UI-SPEC App Shell Contract.

### Login (`src/routes/auth/login.tsx`)
- Email + password form with zodResolver (onBlur) — min 1 char password (server validates credentials)
- Eye/EyeOff toggle for password visibility
- Inline AlertCircle error banner on API failures + `toast.error`
- Google OAuth via `signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/home' } })` — PKCE flow
- "Play as Guest" ghost button → navigate('/home')
- Links to /auth/register and /auth/reset-password
- Title: "Welcome Back, Captain" (exact UI-SPEC copy)

### Register (`src/routes/auth/register.tsx`)
- Three-field form: email, password (min 8), confirmPassword
- `.refine()` for password match check — error on `confirmPassword` path
- Anonymous guest upgrade: if `isAnonymous === true` → `supabase.auth.updateUser({ email, password })` (AUTH-07, same user_id preserved)
- New account path: `supabase.auth.signUp` → navigate to `/auth/verify?email=encoded`
- "At least 8 characters" hint below password field
- "By joining, you agree to our Terms of Service" below submit
- Title: "Join the Crew"

### Verify (`src/routes/auth/verify.tsx`)
- Reads `email` from `useSearchParams`
- "Check Your Compass" title (exact UI-SPEC copy)
- Body copy with encoded email displayed in `text-text-primary`
- Resend button: calls `supabase.auth.resend({ type: 'signup', email })`
- 60-second cooldown via `setInterval` stored in `useRef` (prevents timer leak across re-renders)
- Countdown text "Resend in {N}s" during cooldown; re-enables as "Resend verification email"
- "Wrong email address? Go back" link to /auth/register

### Verified (`src/routes/auth/verified.tsx`)
- `useEffect` with `setTimeout(() => navigate('/home'), 3000)` — 3-second auto-redirect
- `return () => clearTimeout(timer)` cleanup prevents navigation after unmount
- Standalone layout (`min-h-screen bg-background`) — no AuthLayout card (success state)
- "Email Confirmed!" heading in `font-display text-accent text-3xl`
- "Redirecting you to the game…" in `text-text-secondary`
- No manual token exchange — `detectSessionInUrl: true` in supabase.ts handles it

### Reset Password (`src/routes/auth/reset-password.tsx`)
- **Mode A** (initial): email field → `resetPasswordForEmail(email, { redirectTo: origin + '/auth/reset-password' })` → ALWAYS shows "Check Your Inbox" success state regardless of API response (T-AUTH-01: no email existence disclosure)
- **Mode B** (PASSWORD_RECOVERY): activated by `onAuthStateChange` listener detecting `'PASSWORD_RECOVERY'` event; shows new password + confirm form → `updateUser({ password })` → toast + navigate('/home')
- Mode B cannot be triggered by URL manipulation — requires valid Supabase recovery token (T-AUTH-02)
- Title "Reset Your Course" (Mode A) / "Set a New Password" (Mode B)

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` | PASSED (0 errors) |
| `pnpm build` | PASSED (77 modules, all auth chunks 0.64–0.72KB) |
| `grep PASSWORD_RECOVERY reset-password.tsx` | MATCH |
| `grep clearTimeout verified.tsx` | MATCH |
| `grep updateUser\|signUp register.tsx` | MATCH (both calls) |
| `grep redirectTo login.tsx` | MATCH (OAuth redirectTo) |
| `grep useSearchParams verify.tsx` | MATCH |

## Deviations from Plan

### None — plan executed exactly as written.

Minor implementation choice: `verified.tsx` uses a standalone `<main>` layout instead of wrapping in `AuthLayout`. The plan allowed for this ("if preferred, use `min-h-screen bg-background flex flex-col...`") — the success-with-redirect state doesn't benefit from the card chrome.

## Known Stubs

None. All five auth screens have full implementations with real Supabase Auth calls. No placeholder text or hardcoded empty values remain.

## Threat Surface Scan

No new threat surface introduced beyond what was specified in the plan's threat model. All STRIDE mitigations are implemented:
- T-1-03: PKCE flow in supabase.ts + redirectTo in OAuth call
- T-AUTH-01: reset-password Mode A ALWAYS shows success (no email existence leak)
- T-AUTH-02: Mode B only activates on PASSWORD_RECOVERY event, not URL params

## Self-Check: PASSED

Files exist:
- src/components/auth/AuthLayout.tsx: FOUND
- src/routes/auth/login.tsx: FOUND
- src/routes/auth/register.tsx: FOUND
- src/routes/auth/verify.tsx: FOUND
- src/routes/auth/verified.tsx: FOUND
- src/routes/auth/reset-password.tsx: FOUND

Commits:
- 87d8aa1 feat(01-03): implement AuthLayout, Login, and Register screens — FOUND
- e70736b feat(01-03): implement Verify, Verified, and Reset-Password screens — FOUND
