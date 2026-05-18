---
phase: 01-foundation
plan: 01a
subsystem: build-tooling
tags: [tailwind-v4, shadcn, vitest, dependencies, design-system]
dependency_graph:
  requires: []
  provides:
    - tailwindcss-v4-pirate-theme
    - shadcn-components-button-input-label-dialog
    - cn-utility
    - vitest-setup
    - path-alias-at
  affects:
    - all-subsequent-plans-in-phase-01
tech_stack:
  added:
    - "@supabase/supabase-js@2.105.4"
    - "react-router@7.15.1"
    - "zustand@5.0.13"
    - "sonner@2.0.7"
    - "react-hook-form@7.76.0"
    - "zod@3.25.76"
    - "@hookform/resolvers@5.2.2"
    - "lucide-react@1.16.0"
    - "clsx@2.1.1"
    - "tailwind-merge@3.6.0"
    - "tailwindcss@4.3.0"
    - "@tailwindcss/vite@4.3.0"
    - "vitest@4.1.6"
    - "@testing-library/react@16.3.2"
    - "@testing-library/user-event@14.6.1"
    - "@testing-library/jest-dom@6.9.1"
    - "jsdom@29.1.1"
    - "@netlify/functions@5.2.1"
    - "class-variance-authority (via shadcn)"
    - "radix-ui (via shadcn)"
    - "tw-animate-css (via shadcn)"
  patterns:
    - "Tailwind v4 CSS-first @theme block with OKLCH pirate palette"
    - "shadcn/ui component scaffolding via CLI"
    - "cn() helper pattern (clsx + tailwind-merge)"
    - "vitest with jsdom environment + testing-library"
    - "Vite path alias @/ → src/"
key_files:
  created:
    - src/styles/theme.css
    - src/styles/globals.css
    - src/lib/utils.ts
    - src/test/setup.ts
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/dialog.tsx
    - components.json
  modified:
    - vite.config.ts
    - tsconfig.app.json
    - tsconfig.node.json
    - index.html
    - package.json
    - pnpm-lock.yaml
    - src/main.tsx
    - src/App.tsx
decisions:
  - "Kept zod at v3 (v3.25.76 resolved), not v4 — per CLAUDE.md constraint (ecosystem targets v3)"
  - "shadcn init used radix-nova preset then overrode all CSS vars with pirate OKLCH palette in :root"
  - "Added ignoreDeprecations: 6.0 to tsconfig.app.json to silence TS6 baseUrl deprecation warning"
  - "Added vitest/config to tsconfig.node.json types to enable test block type safety in vite.config.ts"
  - "Removed @fontsource-variable/geist from shadcn's generated imports — using Google Fonts (Cinzel+Inter) instead"
  - "Updated src/main.tsx to import theme.css (deviation — required for Tailwind CSS to load in build)"
  - "Updated src/App.tsx to minimal placeholder using pirate tokens (deviation — removed broken Vite default scaffold)"
metrics:
  duration: "7 minutes"
  completed_date: "2026-05-18T13:20:48Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 9
  files_modified: 8
---

# Phase 01 Plan 01a: Install Dependencies, Configure Vite + Tailwind v4, Scaffold shadcn Components Summary

**One-liner:** Tailwind v4 pirate OKLCH theme with shadcn/ui (button, input, label, dialog) scaffolded via CLI, cn() utility, and vitest infrastructure — build clean.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install deps, configure Vite+Tailwind v4, scaffold shadcn | 487d94f | theme.css, globals.css, utils.ts, setup.ts, button/input/label/dialog.tsx |

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm build` exits 0 | PASS |
| `pnpm tsc --noEmit` exits 0 | PASS |
| `tailwindcss()` first in vite.config.ts plugins | PASS |
| OKLCH tokens in theme.css (≥10) | PASS (66 occurrences) |
| `@/*` path alias in tsconfig.app.json | PASS |
| `@import "tailwindcss"` in theme.css | PASS |
| `--background: var(--color-background)` in globals.css | PASS |
| `--primary: var(--color-accent)` in globals.css | PASS |
| `cn()` exports from src/lib/utils.ts | PASS |
| `import '@testing-library/jest-dom'` in setup.ts | PASS |
| All 4 shadcn components exist | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod installed as v4, downgraded to v3**
- **Found during:** Task 1, Step 1
- **Issue:** `pnpm add zod` resolved to v4.4.3, but CLAUDE.md mandates Zod ^3.24.2 (ecosystem targets v3; react-hook-form resolvers not yet compatible with v4)
- **Fix:** `pnpm add zod@^3.24.2` which resolved to v3.25.76
- **Files modified:** package.json, pnpm-lock.yaml

**2. [Rule 3 - Blocking] TypeScript error: `test` property not recognized in vite.config.ts**
- **Found during:** Task 1, build verification
- **Issue:** `tsc -b` reported `test` does not exist in `UserConfigExport` — `tsconfig.node.json` lacked vitest types
- **Fix:** Added `/// <reference types="vitest" />` to vite.config.ts and added `"vitest/config"` to `tsconfig.node.json` types array
- **Files modified:** vite.config.ts, tsconfig.node.json

**3. [Rule 3 - Blocking] TypeScript error: `baseUrl` deprecated in TS 6.0**
- **Found during:** Task 1, build verification
- **Issue:** `tsc -b` reported TS5101: Option `baseUrl` is deprecated — TS 6.0 deprecation
- **Fix:** Added `"ignoreDeprecations": "6.0"` to `tsconfig.app.json` compilerOptions
- **Files modified:** tsconfig.app.json

**4. [Rule 3 - Blocking] shadcn CLI wrote components to literal `@/components/ui/` directory**
- **Found during:** Task 1, post-shadcn-init check
- **Issue:** shadcn CLI created files at `./\@/components/ui/` (literal directory named `@`) instead of resolving `@/` alias to `src/`
- **Fix:** Moved all components from `@/components/ui/` to `src/components/ui/`; removed empty `@/` directory
- **Files modified:** button.tsx, input.tsx, label.tsx, dialog.tsx (moved, not changed)

**5. [Rule 2 - Missing Critical] Updated src/main.tsx to import theme.css**
- **Found during:** Task 1, after creating theme.css
- **Issue:** `main.tsx` still imported `./index.css` (Vite default) — Tailwind v4 CSS would not load in build
- **Fix:** Updated `main.tsx` to import `@/styles/theme.css` instead
- **Files modified:** src/main.tsx

**6. [Rule 3 - Blocking] src/App.tsx referenced missing asset files**
- **Found during:** Task 1, inspecting existing scaffold
- **Issue:** `App.tsx` imported `./assets/hero.png` and `./App.css` — hero.png does not exist; App.css had Vite defaults
- **Fix:** Replaced with minimal pirate-themed placeholder component using CSS variables
- **Files modified:** src/App.tsx

**7. [Intentional] shadcn nova preset CSS variables overridden with pirate palette in :root**
- **Found during:** Task 1, after shadcn init
- **Issue:** shadcn init added its own `@theme inline` block + light-mode `:root` defaults (white background, dark text)
- **Fix:** Added explicit pirate `:root` overrides after shadcn's CSS imports, mapping all shadcn vars to pirate OKLCH values. Kept `shadcn/tailwind.css` import for component infrastructure.
- **Files modified:** src/styles/theme.css

**8. [Intentional] Removed @fontsource-variable/geist import from theme.css**
- **Found during:** Task 1, shadcn init added Geist font import
- **Issue:** shadcn nova preset adds `@import "@fontsource-variable/geist"` — conflicts with Cinzel+Inter design decision
- **Fix:** Removed the Geist import from theme.css; Google Fonts (Cinzel + Inter) are loaded via index.html `<link>` tags
- **Files modified:** src/styles/theme.css

## Known Stubs

None — this plan creates build tooling and design system infrastructure. No application UI with data dependencies.

## Threat Flags

None — this plan installs packages and configures build tooling only. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

Files verified:
- src/styles/theme.css: EXISTS
- src/styles/globals.css: EXISTS
- src/lib/utils.ts: EXISTS
- src/test/setup.ts: EXISTS
- src/components/ui/button.tsx: EXISTS
- src/components/ui/input.tsx: EXISTS
- src/components/ui/label.tsx: EXISTS
- src/components/ui/dialog.tsx: EXISTS

Commits verified:
- 487d94f: feat(01-01a): install deps, configure Vite+Tailwind v4, scaffold shadcn components — EXISTS
