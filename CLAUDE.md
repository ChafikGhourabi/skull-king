<!-- GSD:project-start source:PROJECT.md -->

## Project

**Skull King Online**

A real-time multiplayer web game based on the physical card game Skull King — a trick-taking game for 2-8 players played over 10 rounds where players bid on how many tricks they'll win each round. Built with React, Supabase (real-time DB + auth), and deployed on Netlify. Players can compete with friends via private invite or find opponents through public matchmaking.

**Core Value:** **Friends can play Skull King online together in real-time, exactly as the physical game works, from any browser.**

### Constraints

- **Tech stack**: React 19 + TypeScript + Vite (already scaffolded), Supabase (DB/Auth/Realtime/Storage), Netlify (hosting + CI) — all free tier
- **Budget**: $0 — only free-tier providers; no paid services
- **Database**: PostgreSQL via Supabase; schema must fit free tier storage limits
- **Real-time**: Supabase Realtime free tier — max 200 concurrent connections; game design must not require more
- **Auth**: Supabase Auth — handles email, Google OAuth, anonymous sessions natively
- **No backend server**: Serverless only (Netlify Functions or Supabase Edge Functions); no persistent Node process

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Scaffold State

| Already installed | Version |
|---|---|
| react + react-dom | ^19.2.6 |
| vite | ^8.0.12 |
| typescript | ~6.0.2 |
| @vitejs/plugin-react | ^6.0.1 (with React Compiler via babel-plugin-react-compiler) |
| eslint + typescript-eslint | ^10 / ^8 |

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| @supabase/supabase-js | ^2.105.4 | DB, Auth, Realtime, Storage client | The entire backend is Supabase; this is the official JS client. Free-tier sufficient for launch (200 concurrent connections, 2M messages/month). |
| react-router | ^7.15.1 | Client-side routing | v7 is the current major; ships as library-only (no framework mode needed for Vite SPA); fully React 19 compatible; `createBrowserRouter` API is stable. |
| zustand | ^5.0.13 | Client game state & UI state | Minimal API, zero boilerplate, React 19 / StrictMode safe via native `useSyncExternalStore`. Slice pattern scales to complex game state without fighting the library. |
| xstate | ^5.31.1 | Game engine state machine | Skull King has a strict turn state machine (waiting_for_bids → bidding → playing → resolving_trick → scoring → next_round). XState enforces that illegal transitions are impossible. v5 actor model integrates cleanly with Zustand for UI state. |
| @xstate/react | ^5.x | XState React bindings | `useMachine` hook bridges XState actors into React components. |
| motion | ^12.38.0 | Card animations | Renamed from `framer-motion` in 2025. `import { motion } from "motion/react"` is the current path. Best-in-class for card flip (rotateY), dealing (layout + stagger), trick resolution (drag + spring). 30M+ monthly downloads. GPU-accelerated transforms. |
| tailwindcss | ^4.3.0 | Utility CSS + theming | v4 uses CSS-first `@theme` directive, no `tailwind.config.js`. Supports custom OKLCH color tokens for the pirate palette (dark wood, parchment, gold). Vite plugin is the integration path. |
| @tanstack/react-query | ^5.100.10 | Server state (profiles, leaderboard, match history) | Handles caching, stale-while-revalidate, and optimistic updates for Supabase DB queries. Pattern: TanStack Query owns server state; Supabase Realtime events call `invalidateQueries` to trigger re-fetch. Do NOT use for active game state (use Zustand/XState instead). |
| react-hook-form | ^7.76.0 | Auth forms, settings | Zero re-renders on keystroke; native TypeScript; Zod resolver integration. Auth forms (sign-up, log-in, password reset) and game settings are the only form surfaces. |
| zod | ^3.24.2 | Schema validation | TypeScript-first. Used for: validating Supabase Realtime payloads before applying to game state, form validation via react-hook-form resolver, and validating game action payloads in Netlify Functions. Do NOT upgrade to Zod v4 until it is stable and shadcn/ui supports it. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| immer | ^10.x | Immutable state helpers | Use with Zustand's `immer` middleware for complex nested state mutations (e.g., updating player hand, trick pile, scores). Alternative: `zustand-mutative` for better performance on large trees, but immer is simpler and sufficient here. |
| @supabase/auth-helpers-react | (bundled in supabase-js v2) | Auth session in React | Session state via `supabase.auth.getSession()` + `onAuthStateChange`; no separate package needed in supabase-js v2. |
| lucide-react | ^0.x latest | Icon set | Consistent SVG icons (menu, user, trophy, settings). Tailwind-friendly sizing. |
| clsx + tailwind-merge | latest | Class name utilities | `cn()` helper pattern for conditional Tailwind classes. shadcn/ui requires this. |
| sonner | ^1.x | Toast notifications | Lightweight toast for in-app alerts (friend request, game invite, error feedback). Works with Tailwind v4 without config. |
| @radix-ui/react-* | via shadcn | Accessible primitives | Dialog, Dropdown, Tooltip, Avatar, Tabs — use via shadcn/ui CLI, not direct Radix import. |

### Design System

### Development & Testing Tools

| Tool | Purpose | Notes |
|---|---|---|
| vitest | ^4.1.6 | Unit + integration tests | Vite-native; reuses existing vite config; no separate Babel pipeline. Run with `vitest run` in CI. |
| @testing-library/react | ^16.x | Component tests | Standard React component testing. Works with jsdom environment in vitest. |
| @testing-library/user-event | ^14.x | Simulated user events | Prefer over `fireEvent` for realistic interaction tests. |
| jsdom | ^24.x | DOM environment for vitest | Set `environment: 'jsdom'` in vitest config. |
| @testing-library/jest-dom | ^6.x | Custom matchers | `toBeInTheDocument`, `toHaveClass`, etc. |
| eslint-plugin-react-hooks | ^7.x | Already scaffolded | Enforce hook rules; already in devDependencies. |

## Supabase Realtime: Which Feature for What

### Feature Map

| Feature | Realtime Mechanism | Rationale |
|---|---|---|
| Active game state (whose turn, cards played, current trick) | **Broadcast** | Low latency, no DB write per event. Host client publishes; all players receive. Ephemeral — does not need to persist mid-trick. |
| Bidding phase (simultaneous Yo-ho-ho reveal) | **Broadcast** | Host publishes `bids_revealed` event with all bids at once after all bids submitted. |
| Player hand (private per player) | **Broadcast on private per-player channel** | Each player subscribes to `game:{gameId}:player:{userId}` channel. Host broadcasts dealt cards only to that channel. |
| Player presence (who is in lobby, disconnection detection) | **Presence** | Track `{user_id, username, avatar, status}`. `sync` event drives lobby player list. `leave` event triggers reconnect timer. |
| Friends online status | **Presence on a global user channel** | All authenticated users track presence on `users:online`. Each user sees which friends are in the presence state. |
| Game record persistence (round scores, final result) | **Postgres Changes** (read) + DB write | Write scores via Supabase client directly; subscribe to `postgres_changes` on `game_rounds` for score broadcast to all players simultaneously. |
| Chat messages | **Broadcast** | In-game chat does not need to be persisted mid-game. Post-game recap is saved to DB after game ends. |
| Leaderboard / match history | **TanStack Query + DB polling** | Not real-time sensitive. Invalidate query after game ends. |
| Friend requests / notifications | **Postgres Changes** on `friend_requests` table | Insert-triggered DB change event to receiving user. |

### Channel Topology for a Single Game

- 8 players × 3 channels each = 24 connections
- Plus lobby presence: 8 connections (shared channel, 1 subscription each)
- Total: ~32 connections for one 8-player game

### Broadcast vs Presence Decision Rule

- Use **Broadcast** when: you are sending an event (something happened), ephemeral, low latency critical.
- Use **Presence** when: you need a synchronized list of who is currently online/connected.
- Use **Postgres Changes** when: a DB write already happened and other clients need to react to it.

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| Socket.io / Ably / Pusher | Paid tiers needed at scale; adds a second real-time layer when Supabase Realtime already covers all cases | Supabase Realtime Broadcast + Presence |
| Redux / Redux Toolkit | Excessive boilerplate for a game that doesn't need time-travel debugging in production; React 19 + Compiler makes re-render optimization redundant | Zustand + XState |
| Jotai | Atomic state is poorly suited to complex game state trees that update as a unit (a trick resolution updates 5+ things atomically) | Zustand slice pattern |
| Valtio | Proxy-based reactivity; harder to serialize/debug game state; no immer middleware | Zustand + Immer |
| React Context for game state | Context triggers full subtree re-renders; will cause jank during rapid game updates (card plays, trick animations) | Zustand store with selector subscriptions |
| CSS Modules / Styled Components | Tailwind v4 covers all theming needs; mixing systems adds cognitive overhead | Tailwind v4 + shadcn/ui |
| Framer Motion (old package) | The `framer-motion` package is now legacy/redirect. Use `motion` package with `import { motion } from "motion/react"` | `motion@^12.38.0` |
| Vercel | User specified Netlify; both are functionally equivalent on free tier for this project | Netlify |
| Next.js | Overkill for a client-rendered SPA with Supabase handling the backend; adds SSR complexity with no benefit on free tier | Vite SPA |
| Supabase Edge Functions for game logic | Cold start latency (100–500ms) is unacceptable for turn-by-turn game actions; edge functions are suitable only for webhooks, auth hooks, and scheduled jobs | Client-side game engine + Broadcast |
| Netlify Background Functions for game logic | Same latency argument; 15-minute timeout is irrelevant for card game events | Same as above |
| Zod v4 | Not stable at research date; ecosystem (react-hook-form resolvers, shadcn) still targets v3 | Zod ^3.24.2 |
| @tanstack/react-query for live game state | React Query does not subscribe to WebSocket streams natively; it is optimized for request/response patterns | Zustand + Supabase Realtime subscriptions for game state |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Animation | motion@^12 | react-spring@10 | React Spring requires more boilerplate for card sequences; lacks `layoutId` for card morphing animations; Framer Motion (now Motion) has superior gesture + drag support |
| Animation | motion@^12 | CSS Keyframes only | Cannot react to dynamic values (who is playing, which card, where it lands); no physics-based spring transitions |
| State machine | XState v5 | Finite state with useReducer | useReducer can model states but doesn't enforce impossible transitions; no visual debugger; harder to test transitions in isolation |
| State machine | XState v5 | Robot (lightweight FSM) | Smaller bundle but less ecosystem; no actor model for async operations (dealing cards, Supabase calls) |
| UI components | shadcn/ui | Mantine | Mantine v7 is opinionated about color system; overriding to a dark pirate palette requires fighting its theme layer; shadcn gives raw Tailwind control |
| UI components | shadcn/ui | Radix UI direct | shadcn wraps Radix with pre-styled implementations; starting from raw Radix means building every component from scratch |
| Server state | TanStack Query v5 | SWR | TanStack Query has better DevTools, more granular cache invalidation, and better TypeScript inference; SWR is simpler but TanStack wins on features at same bundle cost |
| Routing | React Router v7 | TanStack Router | TanStack Router has excellent type safety but v1 is newer and smaller ecosystem; React Router v7 is mature and has explicit React 19 support statement |
| Forms | React Hook Form | Formik | Formik re-renders on every keystroke (proven performance issue); RHF uses uncontrolled inputs; no reason to use Formik in 2026 |

## Version Compatibility Notes

| Constraint | Detail |
|---|---|
| React 19 + Zustand v5 | Zustand v5 requires React 18+; uses native `useSyncExternalStore`. Fully compatible with React 19. |
| React 19 + Motion v12 | Motion v12 supports React 19 via `motion/react` import. Use `motion/react`, NOT the legacy `framer-motion` sub-package. |
| React 19 + React Router v7 | React Router v7 bills itself as "bridging React 18 to 19". Full support confirmed. |
| Tailwind v4 + shadcn | shadcn CLI 3.x supports Tailwind v4 with CSS-variable theming. Do not use `tailwind.config.js` — use `@theme` in CSS. |
| Tailwind v4 Vite integration | Use `@tailwindcss/vite` Vite plugin, NOT the PostCSS plugin. The PostCSS path works but is slower in dev. |
| Zod v3 + React Hook Form | Use `@hookform/resolvers` which ships a `zodResolver`. Pinned to Zod v3 as above. |
| XState v5 + Zustand v5 | No coupling required. XState actors live in a Zustand slice; the machine sends events, Zustand UI state reads machine snapshots via `@xstate/react`'s `useMachine`. |
| supabase-js v2 + React 19 | supabase-js v2.x is framework-agnostic; no React peer dep conflict. |

## Installation

# Core runtime dependencies

# UI

# shadcn/ui (run CLI to scaffold base components — does not add to node_modules)

# Dev / test

## Stack Patterns by Scenario

## Sources

- Context7 `/websites/supabase` — Realtime Broadcast, Presence, Postgres Changes JS API (HIGH confidence)
- Context7 `/pmndrs/zustand` — Slice pattern, v5 API (HIGH confidence)
- Context7 `/remix-run/react-router` — v7 BrowserRouter setup (HIGH confidence)
- Context7 `/colinhacks/zod` — v3 schema and parse API (HIGH confidence)
- Context7 `/vitest-dev/vitest` — v4 Vite merge config (HIGH confidence)
- Context7 `/websites/motion_dev` — Motion v12 layout animation, transforms (HIGH confidence)
- npm registry — `@supabase/supabase-js@2.105.4`, `zustand@5.0.13`, `react-router@7.15.1`, `motion@12.38.0`, `tailwindcss@4.3.0`, `xstate@5.31.1`, `@tanstack/react-query@5.100.10`, `react-hook-form@7.76.0`, `vitest@4.1.6` (HIGH confidence — verified against live npm data)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture) — channel model, free-tier limits (HIGH confidence)
- [Supabase Free Tier Limits](https://supabase.com/docs/guides/realtime/limits) — 200 concurrent connections, 2M messages/month confirmed (HIGH confidence)
- [Motion (prev Framer Motion) site](https://motion.dev/) — v12.38.0, `motion/react` import path (HIGH confidence)
- [React State Management in 2025 — Makers' Den](https://makersden.io/blog/react-state-management-in-2025) — XState for explicit flows, Zustand for global UI state (MEDIUM confidence)
- [Tailwind CSS v4.3 release](https://tailwindcss.com/blog/tailwindcss-v4-3) — CSS-first `@theme`, OKLCH colors, Vite plugin (HIGH confidence)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — CSS variable theming in v4 (HIGH confidence)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
