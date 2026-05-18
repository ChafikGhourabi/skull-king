---
phase: 01-foundation
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - tsconfig.app.json
  - index.html
  - src/styles/theme.css
  - src/styles/globals.css
  - src/lib/utils.ts
  - src/test/setup.ts
  - src/components/ui/button.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/components/ui/dialog.tsx
autonomous: true
requirements:
  - AUTH-04

must_haves:
  truths:
    - "pnpm build exits 0 with no TypeScript or Vite errors"
    - "Tailwind v4 pirate theme tokens are active (OKLCH tokens in theme.css)"
    - "shadcn Button, Input, Label, and Dialog components are scaffolded"
    - "cn() utility is available at @/lib/utils"
    - "Vitest is configured and the test setup file imports jest-dom"
  artifacts:
    - path: "src/styles/theme.css"
      provides: "Tailwind v4 @theme block with pirate OKLCH tokens"
      contains: "@import \"tailwindcss\""
    - path: "src/styles/globals.css"
      provides: "shadcn CSS variable → pirate token mapping"
      contains: "--background: var(--color-background)"
    - path: "src/lib/utils.ts"
      provides: "cn() helper"
      exports: ["cn"]
    - path: "src/test/setup.ts"
      provides: "Vitest global test setup"
      contains: "import '@testing-library/jest-dom'"
    - path: "src/components/ui/button.tsx"
      provides: "shadcn Button component"
    - path: "src/components/ui/input.tsx"
      provides: "shadcn Input component"
    - path: "src/components/ui/label.tsx"
      provides: "shadcn Label component"
    - path: "src/components/ui/dialog.tsx"
      provides: "shadcn Dialog component"
  key_links:
    - from: "vite.config.ts"
      to: "src/styles/theme.css"
      via: "@tailwindcss/vite plugin"
      pattern: "tailwindcss()"
    - from: "src/styles/globals.css"
      to: "src/styles/theme.css"
      via: "CSS variable mapping"
      pattern: "--background: var\\(--color-background\\)"
---

<objective>
Install all runtime dependencies, configure Vite + Tailwind v4, run shadcn init, scaffold base UI components, and initialize the test infrastructure. After this plan the project builds cleanly, the pirate design system is active, and the shadcn component primitives are available for downstream plans.

Purpose: Establishes the design system, build tooling, and test infrastructure that every subsequent plan in Phase 1 depends on. Plan 01b wires the Supabase singleton and auth store against these already-installed packages.

Output: Configured vite.config.ts, tsconfig.app.json, pirate theme.css and globals.css, cn() utility, vitest setup, and four scaffolded shadcn components. No application logic yet.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-PATTERNS.md
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/SKELETON.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install dependencies and configure Vite + Tailwind v4 + shadcn</name>
  <files>
    package.json,
    vite.config.ts,
    tsconfig.app.json,
    index.html,
    src/styles/theme.css,
    src/styles/globals.css,
    src/lib/utils.ts,
    src/test/setup.ts,
    src/components/ui/button.tsx,
    src/components/ui/input.tsx,
    src/components/ui/label.tsx,
    src/components/ui/dialog.tsx
  </files>
  <read_first>
    - vite.config.ts — read before modifying (must preserve existing react() + babel plugins)
    - tsconfig.app.json — read before modifying (need to add paths alias for @/*)
    - index.html — read before modifying (add Google Fonts links to existing head)
    - .planning/phases/01-foundation/01-PATTERNS.md lines 60–200 — vite.config.ts, index.html, theme.css, globals.css, utils.ts target patterns
    - .planning/phases/01-foundation/01-UI-SPEC.md lines 46–144 — exact @theme token block to copy verbatim
  </read_first>
  <action>
    Step 1 — Install runtime dependencies (all Approved in Package Legitimacy Audit):
    `pnpm add @supabase/supabase-js react-router zustand sonner react-hook-form zod @hookform/resolvers`
    Then dev dependencies:
    `pnpm add -D tailwindcss @tailwindcss/vite lucide-react clsx tailwind-merge @netlify/functions vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`

    Step 2 — Update vite.config.ts per PATTERNS.md target pattern:
    - Import `tailwindcss` from `@tailwindcss/vite` and `resolve` from `path`
    - Add `tailwindcss()` as the FIRST plugin (before react() and babel()) — required by Tailwind v4 Vite docs
    - Add `resolve.alias: { '@': resolve(__dirname, 'src') }`
    - Add `test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' }`
    - Preserve existing `react()` and `babel({ presets: [reactCompilerPreset()] })` plugins exactly

    Step 3 — Update tsconfig.app.json: add `"baseUrl": "."` and `"paths": { "@/*": ["src/*"] }` inside `compilerOptions` so TypeScript resolves `@/` imports.

    Step 4 — Update index.html: add three Google Fonts `<link>` tags to `<head>` (preconnect to fonts.googleapis.com, preconnect to fonts.gstatic.com with crossorigin, then the combined Cinzel weight 700 + Inter weight 400 stylesheet URL). Use the exact href from PATTERNS.md index.html section.

    Step 5 — Create src/styles/theme.css: start with `@import "tailwindcss";` then a single `@theme { }` block. Copy ALL token values verbatim from 01-UI-SPEC.md Design Tokens section (lines 46–143) — fonts, wood palette, parchment palette, gold palette, suit colors, danger colors, semantic tokens (surfaces, borders, text, accent, destructive, success), radii, shadows, spacing. Do NOT invent values; do NOT use hex or HSL.

    Step 6 — Create src/styles/globals.css: the shadcn CSS variable mapping layer. Follow PATTERNS.md globals.css pattern exactly — `@layer base { :root { --background: var(--color-background); ... } }` mapping all shadcn variables (`--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--destructive-foreground`) to the pirate semantic tokens.

    Step 7 — Create src/lib/utils.ts with the `cn()` helper: imports `clsx` and `twMerge` from `tailwind-merge`, exports `function cn(...inputs: ClassValue[])` per PATTERNS.md cn() helper pattern.

    Step 8 — Create src/test/setup.ts: single line `import '@testing-library/jest-dom'`.

    Step 9 — Run shadcn CLI init and add required components:
    `pnpm dlx shadcn@latest init` (accept defaults; select "New York" style if prompted; set base color to neutral — will be overridden)
    Then add components:
    `pnpm dlx shadcn@latest add button`
    `pnpm dlx shadcn@latest add input`
    `pnpm dlx shadcn@latest add label`
    `pnpm dlx shadcn@latest add dialog`
    After init, verify that generated shadcn CSS variables in globals.css are fully overridden by pirate tokens (the shadcn init may write its own globals — merge, do not discard the pirate mapping layer).
  </action>
  <verify>
    <automated>pnpm build 2>&1 | tail -5 && grep -c "@import \"tailwindcss\"" src/styles/theme.css && grep -c "oklch" src/styles/theme.css && ls src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/dialog.tsx</automated>
  </verify>
  <done>
    - `pnpm build` exits 0 with no errors
    - `vite.config.ts` has tailwindcss() as the first plugin entry
    - `tsconfig.app.json` contains `"@/*": ["src/*"]` in paths
    - `src/styles/theme.css` starts with `@import "tailwindcss"` and contains OKLCH tokens
    - `src/styles/globals.css` contains `--background: var(--color-background)` and `--primary: var(--color-accent)`
    - `src/lib/utils.ts` exports `cn` function using `twMerge(clsx(inputs))`
    - `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`, `dialog.tsx` all exist
    - `src/test/setup.ts` contains `import '@testing-library/jest-dom'`
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry → local install | pnpm fetches packages at install time |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-1-SC | Tampering | npm/pnpm installs | mitigate | All packages verified in RESEARCH.md Package Legitimacy Audit; none flagged [ASSUMED] or [SUS]; no human checkpoint required |
</threat_model>

<verification>
After task completes:

1. `pnpm build` exits 0 — production build is clean
2. `pnpm tsc --noEmit` exits 0 — no TypeScript errors
3. `grep -c "tailwindcss()" vite.config.ts` returns >= 1 — plugin is registered
4. `grep -c "oklch" src/styles/theme.css` returns >= 10 — pirate tokens present
5. `ls src/components/ui/` lists button.tsx, input.tsx, label.tsx, dialog.tsx
</verification>

<success_criteria>
Build is clean, Tailwind v4 pirate theme is configured, shadcn components are scaffolded, and the test infrastructure is initialized. Plan 01b can now safely import from all installed packages.
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-01a-SUMMARY.md` when done
</output>
