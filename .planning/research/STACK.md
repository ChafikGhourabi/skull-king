# Stack Research

**Domain:** Real-time multiplayer browser card game (trick-taking)
**Researched:** 2026-05-17
**Confidence:** HIGH (versions verified against npm, official docs, and Context7)

---

## Scaffold State

The repo already has a Vite + React 19 + TypeScript scaffold. What is installed:

| Already installed | Version |
|---|---|
| react + react-dom | ^19.2.6 |
| vite | ^8.0.12 |
| typescript | ~6.0.2 |
| @vitejs/plugin-react | ^6.0.1 (with React Compiler via babel-plugin-react-compiler) |
| eslint + typescript-eslint | ^10 / ^8 |

React Compiler (`babel-plugin-react-compiler`) is already wired in via `@rolldown/plugin-babel`. This is the React 19 automatic memoization feature — do not add manual `useMemo`/`useCallback` wrappers on top of it.

Everything below is **to be added**.

---

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

**Use shadcn/ui** (version: shadcn CLI `^3.x`, component lib copied-not-installed).

Rationale: shadcn/ui is a copy-paste component system built on Radix UI + Tailwind CSS variables. It ships full source code into `src/components/ui/`, giving complete control to customize for the pirate theme. It is not a dependency in `package.json` — this matters for free-tier bundle size.

**Pirate theme token strategy** (CSS-first in Tailwind v4):

```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Dark wood base */
  --color-wood-950: oklch(10% 0.04 35);
  --color-wood-900: oklch(15% 0.05 35);
  --color-wood-800: oklch(22% 0.06 35);
  --color-wood-700: oklch(30% 0.07 35);

  /* Parchment */
  --color-parchment-100: oklch(94% 0.04 85);
  --color-parchment-200: oklch(88% 0.06 85);
  --color-parchment-300: oklch(80% 0.08 85);

  /* Pirate gold */
  --color-gold-400: oklch(80% 0.18 80);
  --color-gold-500: oklch(72% 0.20 78);
  --color-gold-600: oklch(62% 0.18 75);

  /* Suit colors */
  --color-suit-parrot: oklch(55% 0.18 145);    /* green */
  --color-suit-treasure: oklch(78% 0.18 80);   /* yellow */
  --color-suit-map: oklch(50% 0.22 295);       /* purple */
  --color-suit-jolly: oklch(20% 0.00 0);       /* black */

  /* Semantic */
  --color-background: var(--color-wood-950);
  --color-surface: var(--color-wood-900);
  --color-border: var(--color-wood-700);
  --color-text-primary: var(--color-parchment-100);
  --color-text-muted: var(--color-parchment-300);
  --color-accent: var(--color-gold-500);
}
```

shadcn/ui components should be overridden to reference `--color-background`, `--color-surface`, etc. rather than their default neutral tokens.

### Development & Testing Tools

| Tool | Purpose | Notes |
|---|---|---|
| vitest | ^4.1.6 | Unit + integration tests | Vite-native; reuses existing vite config; no separate Babel pipeline. Run with `vitest run` in CI. |
| @testing-library/react | ^16.x | Component tests | Standard React component testing. Works with jsdom environment in vitest. |
| @testing-library/user-event | ^14.x | Simulated user events | Prefer over `fireEvent` for realistic interaction tests. |
| jsdom | ^24.x | DOM environment for vitest | Set `environment: 'jsdom'` in vitest config. |
| @testing-library/jest-dom | ^6.x | Custom matchers | `toBeInTheDocument`, `toHaveClass`, etc. |
| eslint-plugin-react-hooks | ^7.x | Already scaffolded | Enforce hook rules; already in devDependencies. |

---

## Supabase Realtime: Which Feature for What

This is the most critical architectural decision. Misusing Realtime channels wastes the 200-connection free-tier limit and introduces sync bugs.

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

```
game:{gameId}                  — Broadcast: game state events (host → all)
game:{gameId}:chat             — Broadcast: in-game chat
game:{gameId}:player:{userId}  — Broadcast: private hand delivery (one per player)
lobby:{gameId}                 — Presence: who is in the room
users:online                   — Presence: global friend status (one channel for ALL users)
```

**Connection count per active game (8 players):**
- 8 players × 3 channels each = 24 connections
- Plus lobby presence: 8 connections (shared channel, 1 subscription each)
- Total: ~32 connections for one 8-player game

At 200 concurrent connection limit: supports ~6 simultaneous 8-player games before hitting the ceiling. Sufficient for launch.

### Broadcast vs Presence Decision Rule

- Use **Broadcast** when: you are sending an event (something happened), ephemeral, low latency critical.
- Use **Presence** when: you need a synchronized list of who is currently online/connected.
- Use **Postgres Changes** when: a DB write already happened and other clients need to react to it.

Do NOT use **Postgres Changes** for active game state — every card play would require a DB write, adding 50–200ms latency and burning DB operations on the free tier.

---

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

---

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

---

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

---

## Installation

```bash
# Core runtime dependencies
npm install @supabase/supabase-js react-router zustand xstate @xstate/react motion @tanstack/react-query react-hook-form zod immer

# UI
npm install @tailwindcss/vite tailwindcss clsx tailwind-merge lucide-react sonner

# shadcn/ui (run CLI to scaffold base components — does not add to node_modules)
npx shadcn@latest init

# Dev / test
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @hookform/resolvers
```

---

## Stack Patterns by Scenario

**Turn-based action flow (player plays a card):**
1. Player clicks card → React fires `PLAY_CARD` event to XState machine
2. XState validates the move is legal in current state (playing phase, correct turn, follow-suit rule)
3. If valid: XState transitions to `awaiting_next_player`
4. Zustand action broadcasts via Supabase `channel.send({ type: 'broadcast', event: 'card_played', payload: ... })`
5. All clients receive broadcast → fire `OPPONENT_PLAYED` event to their XState machine → Zustand updates game UI state

**Reconnection (player drops and rejoins):**
1. On reconnect, client fetches authoritative game state from DB via TanStack Query
2. XState machine initialized to current `game_state` row's `phase` + `round` fields
3. Player's hand re-fetched from private player channel (host re-broadcasts on rejoin request)

**Simultaneous bid reveal (Yo-ho-ho mechanic):**
1. Each player submits bid → stored client-side only (not broadcasted yet)
2. All bids tracked in Presence state as `{ user_id, bid_locked: true/false }`
3. When Presence `sync` shows all players have `bid_locked: true` → host broadcasts `bids_revealed` with all values simultaneously
4. This prevents bid sniping (no player can see others' bids before committing)

**Card dealing animation:**
1. XState fires `ROUND_STARTED` → Zustand clears previous hand
2. Motion `staggerChildren` variant fans cards from deck position to each player hand position using `layoutId` per card
3. Each card flips face-up using `animate={{ rotateY: 180 }}` with `backfaceVisibility: 'hidden'` on both faces
4. Animation duration: ~800ms total for 8-card deal

---

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

---

*Stack research for: Skull King Online — real-time multiplayer browser card game*
*Researched: 2026-05-17*
