---
status: complete
phase: 01-foundation
source:
  - 01-01a-SUMMARY.md
  - 01-01b-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-04-SUMMARY.md
  - 01-05-SUMMARY.md
started: 2026-05-18T17:30:00.000Z
updated: 2026-05-18T18:10:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `pnpm dev`. Server should boot without errors on localhost:5173. Opening the URL in a browser should load the app and redirect to /auth/login without any blank screen, console errors, or crash.
result: pass

### 2. App loads and redirects to login
expected: Navigate to http://localhost:5173. You should be automatically redirected to /auth/login. The page shows "Welcome Back, Captain" as the title, with email + password fields, a "Play as Guest" button, "Continue with Google", links to Register and Forgot Password. The pirate dark wood background and gold accent colors should be visible. The card should be centered and properly sized (not 8px wide).
result: issue
reported: "pass overall, but email field has autoFocus — clicking away to other actions (Sign in with Google, Play as Guest) immediately triggers the 'required' validation error on the email field. Should remove autoFocus and show field errors only on form submit, not on blur."
severity: minor

### 3. Play as Guest — reaches /home
expected: On the login screen, click "Play as Guest". You should land on /home. The page shows a sticky nav bar with "Skull King" wordmark on the left. On the right you should see a "Guest Mode" chip and a "Create account" button. Main content says "Game loading… coming soon".
result: pass

### 4. Guest badge "Create account" navigates to register
expected: While on /home as a guest, click the "Create account" button in the nav. You should navigate to /auth/register showing the "Join the Crew" form with email, password, and confirm password fields.
result: issue
reported: "pass, same autoFocus + onBlur validation issue as login screen — email field auto-focused, premature validation errors on blur before submit."
severity: minor

### 5. Email/password registration
expected: Fill in a valid email, a password of 8+ characters, and matching confirm password on the register screen. Submit. You should land on /auth/verify?email=... showing "Check Your Compass" title, the email address you entered, and a "Resend verification email" button.
result: issue
reported: "Verify page loads correctly. But clicking 'Wrong email address? Go back', then re-registering with a new email but same password throws Supabase error: 'New password should be different from the old password.' — second updateUser call fails because password was already set on the anonymous session."
severity: major

### 6. Email verify resend cooldown
expected: On the /auth/verify screen, click "Resend verification email". The button should immediately change to "Resend in 60s" and count down. During the countdown the button should be disabled. After 60 seconds it re-enables.
result: pass

### 7. Password reset — always shows success
expected: On /auth/login, click "Forgot password?". You should reach /auth/reset-password. Enter any email (real or fake) and submit. Regardless of whether the email exists, you should ALWAYS see a "Check Your Inbox" success message — no error about "email not found".
result: pass

### 8. Google OAuth button present
expected: On /auth/login, the "Continue with Google" button is visible. Clicking it should initiate a redirect toward Google's consent screen (you don't need to complete the OAuth flow — just confirm the redirect begins or you reach accounts.google.com).
result: issue
reported: "First Google sign-in works. But after signing out and clicking 'Continue with Google' again, it skips Google's consent screen and goes directly to /home as already signed in."
severity: major

### 9. Authenticated home — correct nav state
expected: After successfully signing in with email/password (use a verified account), the /home nav bar should show your display name (the part of your email before the @) and a "Sign Out" button on the right. The "Guest Mode" chip should NOT be visible.
result: pass

### 10. Sign Out
expected: While signed in on /home, click "Sign Out". You should be redirected to /auth/login. If you then navigate to /home directly, the router should redirect you back to /auth/login (since you're no longer authenticated).
result: pass

### 11. App live on Netlify
expected: Open https://skull-king-app.netlify.app/ in a browser. The login page should load with the dark pirate theme, "Welcome Back, Captain" title, and the auth form centered on screen. The layout should NOT be broken (form card properly sized, not collapsed to a sliver).
result: issue
reported: "Netlify loads correctly. But browser console shows Supabase /auth/v1/signup API is triggered on every login page load — automatically registering an anonymous user even for visitors who just want to sign in with email/Google. Should only create anonymous session when user explicitly clicks 'Play as Guest'."
severity: major

## Summary

total: 11
passed: 7
issues: 5
skipped: 0
blocked: 0
pending: 0

## Gaps

- truth: "Auth form fields show validation errors only when the user submits — not on blur or auto-focus loss"
  status: failed
  reason: "User reported on both login and register: email field has autoFocus, causing 'required' error to appear immediately when clicking away before submitting. Should remove autoFocus from all auth forms and switch validation mode from onBlur to onSubmit."
  severity: minor
  test: 2
  artifacts: [src/routes/auth/login.tsx, src/routes/auth/register.tsx]
  missing: []

- truth: "After signing out, clicking 'Continue with Google' should redirect to Google's OAuth consent/account-picker screen"
  status: failed
  reason: "User reported: first Google sign-in works correctly. After sign-out, clicking 'Continue with Google' skips Google entirely and goes directly to /home as already signed in. Two likely causes: (1) Supabase session not fully cleared — signOut() may need { scope: 'global' } to revoke server-side session, not just clear local storage; (2) Google's OAuth silent re-auth — Google browser cookie still active so Google re-authenticates silently without showing consent screen. Fix: add queryParams: { prompt: 'select_account' } to the signInWithOAuth call so Google always shows account picker after logout. Also verify home.tsx awaits signOut() before navigate()."
  severity: major
  test: 8
  artifacts: [src/routes/auth/login.tsx, src/routes/home.tsx]
  missing: []

- truth: "Anonymous session is only created when user explicitly clicks 'Play as Guest' — not on login page load"
  status: failed
  reason: "User reported: browser console shows Supabase /auth/v1/signup firing on every login page load. Root cause: ensureAnonymousSession loader on the login route calls signInAnonymously() for every sessionless visitor, including those who want to sign in with email/Google. Fix: remove ensureAnonymousSession from the login route loader; move signInAnonymously() call into the 'Play as Guest' button click handler in login.tsx instead."
  severity: major
  test: 11
  artifacts: [src/router/index.tsx, src/routes/auth/login.tsx]
  missing: []

- truth: "User can correct their email by going back from /auth/verify and re-registering with the same password"
  status: failed
  reason: "User reported: clicking 'Wrong email address? Go back' then re-submitting register form with a new email but same password fails with Supabase error 'New password should be different from the old password.' Root cause: register.tsx always calls updateUser({ email, password }) for anonymous users — on second submit the password is already set on the session so Supabase rejects the same password. Fix: on second updateUser attempt, call updateUser({ email }) only (omit password if session already has one set), or catch this specific error and retry without password."
  severity: major
  test: 5
  artifacts: [src/routes/auth/register.tsx]
  missing: []
