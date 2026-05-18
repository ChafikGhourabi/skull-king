---
phase: 01-foundation
plan: "04"
subsystem: auth-ui
tags: [guest-ux, home-page, app-shell, auth-components]
dependency_graph:
  requires: [01-01b, 01-03]
  provides: [home-page-shell, GuestBadge, GuestUpgradeModal]
  affects: [Phase 4 post-game upgrade trigger (D-09)]
tech_stack:
  added: []
  patterns:
    - Zustand selector pattern (useAuthStore((s) => s.field)) enforced in all new components
    - react-hook-form + zodResolver for inline upgrade form
    - supabase.auth.linkIdentity for identity linking (Manual Linking required — T-1-05)
    - supabase.auth.updateUser for email/password attachment to anon session (D-18 atomicity)
key_files:
  created:
    - src/components/auth/GuestBadge.tsx
    - src/components/auth/GuestUpgradeModal.tsx
  modified:
    - src/routes/home.tsx
decisions:
  - GuestBadge "Create account" CTA navigates to /auth/register in Phase 1 (no game to end yet); Phase 4 will wire GuestUpgradeModal post-game (D-09)
  - GuestUpgradeModal onOpenChange calls handleDismiss to set sk_upgrade_dismissed when dialog closed via backdrop/escape, consistent with explicit "Maybe later" dismiss behavior
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 2
  files_modified: 1
  completed_date: "2026-05-18T14:48:19Z"
---

# Phase 1 Plan 04: Guest UX and App Shell Summary

**One-liner:** Branded /home page with sticky nav + pirate wordmark, GuestBadge chip for guest status visibility, and GuestUpgradeModal with email/password and Google OAuth upgrade paths preserving user_id (D-18).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | /home branded page + GuestBadge nav component | 03679d9 | src/routes/home.tsx (modified), src/components/auth/GuestBadge.tsx (created) |
| 2 | GuestUpgradeModal — inline account conversion dialog | c6e42cf | src/components/auth/GuestUpgradeModal.tsx (created) |

## What Was Built

### Task 1: /home placeholder page and GuestBadge

**src/routes/home.tsx** — Full replacement of the plan 01-01b stub:
- Named export `Component` (React Router v7 lazy convention)
- Sticky nav bar: `h-14 bg-surface border-b border-border shadow-sm sticky top-0 z-50`
- Left: "Skull King" wordmark in `font-display text-accent text-xl font-bold`
- Right (guest): `<GuestBadge />` component
- Right (authenticated): display name (pre-@ portion of email) + ghost Sign Out button calling `supabase.auth.signOut()` then navigating to `/auth/login`
- Main content: full-screen pirate placeholder — "Skull King" heading, tagline "Rule the seas. One trick at a time.", "Game loading… coming soon"
- Both `isAnonymous` and `user` read via Zustand selectors (not full store destructure)

**src/components/auth/GuestBadge.tsx** — New component:
- Returns `null` if `!isAnonymous` (authenticated users never see this)
- "Guest Mode" chip: `bg-accent-muted text-accent text-xs px-2 py-1 rounded-full font-body`
- "Create account" ghost Button navigating to `/auth/register`
- Comment documents Phase 4 upgrade to GuestUpgradeModal trigger (D-09)

### Task 2: GuestUpgradeModal

**src/components/auth/GuestUpgradeModal.tsx** — Controlled dialog component:
- Props: `{ open: boolean; onClose: () => void }`
- shadcn `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle`
- Heading "Save Your Progress" in `font-display text-accent`
- Body: "Create a free account to keep your game history."
- **PATH 1 (email/password):** `react-hook-form` + `zodResolver` with `z.object({ email: z.string().email(), password: z.string().min(8) })`. Calls `supabase.auth.updateUser({ email, password })` — attaches credentials to existing anonymous session, preserving `user_id` (D-18). On success: `toast.success('Check your email to verify your account')` + `onClose()`. On error: inline alert banner inside modal.
- **PATH 2 (Google):** "Continue with Google" outlined button with inline Google G SVG. Calls `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.origin + '/home' } })`. Code comment: "Requires 'Manual Linking' enabled in Supabase Dashboard → Authentication → Settings (T-1-05)". On error: `toast.error(error.message)`.
- "Or" divider between paths
- "Maybe later" ghost button: calls `localStorage.setItem('sk_upgrade_dismissed', 'true')` + `onClose()`
- `onOpenChange` also calls `handleDismiss` to handle backdrop/escape dismiss consistently

## Deviations from Plan

**[Rule 2 - Missing Functionality] GuestUpgradeModal onOpenChange consistency**
- **Found during:** Task 2 implementation review
- **Issue:** Plan spec said dismiss button should call `onClose()` and set `sk_upgrade_dismissed` but didn't address the shadcn Dialog's `onOpenChange` callback (backdrop click / Escape key). Without handling this, users could bypass the dismiss path and reopen the modal on next visit without setting the flag.
- **Fix:** `onOpenChange` calls `handleDismiss` (which sets the flag and calls `onClose()`) for any close event, whether triggered by the explicit "Maybe later" button or by backdrop/escape.
- **Files modified:** src/components/auth/GuestUpgradeModal.tsx

None of the other plan actions required deviation.

## Success Criteria Verification

- [x] `src/routes/home.tsx` — branded /home placeholder with pirate theme, sticky nav, "coming soon" content
- [x] `src/components/auth/GuestBadge.tsx` — nav component showing guest status with chip + CTA
- [x] `src/components/auth/GuestUpgradeModal.tsx` — dialog with both upgrade paths (email + Google)
- [x] `pnpm build` passes (verified via main repo: `tsc -b && vite build` — 835ms, 0 errors)
- [x] SUMMARY.md created and committed

## Requirements Satisfied

- **AUTH-06:** Anonymous user can reach /home without creating an account (router protects via `requireAuth` which returns session for anon users; GuestBadge shows status)
- **AUTH-07:** GuestUpgradeModal implements both upgrade paths with `user_id` preservation (D-18 — same anon session upgraded in-place via `updateUser` / `linkIdentity`)

## Known Stubs

- GuestBadge CTA currently navigates to `/auth/register` instead of triggering GuestUpgradeModal — intentional for Phase 1 (no game has ended yet). Phase 4 will wire the modal trigger post-game (D-09). Comment in code.
- Home page main content is a branded placeholder ("coming soon"). Future phases replace this with the actual game lobby/matchmaking UI.

## Threat Surface Scan

No new trust boundaries or network endpoints introduced beyond what the plan's threat model documents:
- `GuestUpgradeModal → Supabase Auth` — `linkIdentity` + `updateUser` calls (T-1-05 mitigated via code comment)
- `localStorage → component state` — `sk_upgrade_dismissed` flag (T-1-06 accepted)

## Self-Check: PASSED

- `src/routes/home.tsx` exists: FOUND
- `src/components/auth/GuestBadge.tsx` exists: FOUND
- `src/components/auth/GuestUpgradeModal.tsx` exists: FOUND
- Task 1 commit 03679d9: FOUND
- Task 2 commit c6e42cf: FOUND
- `tsc --noEmit`: 0 errors
- `pnpm build`: passes (verified from main repo)
