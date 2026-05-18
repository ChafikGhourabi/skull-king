# Roadmap: Skull King Online

## Overview

From a scaffolded Vite + React app to a fully playable real-time multiplayer Skull King experience. The journey moves through foundation (auth + Supabase wiring), a pure-TypeScript game engine with all card rules, a lobby for finding opponents, the live in-game play loop with animations, full 10-round game polish and sound, a social layer with friends and chat, notifications, and finally leaderboards with player profiles. Each phase delivers a vertically complete user capability that can be verified end-to-end before the next begins.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, Supabase schema, DB setup, deploy pipeline, pirate theme tokens (completed 2026-05-18)
- [ ] **Phase 2: Game Engine** - Pure-TypeScript XState game machine — all card rules, scoring, bonus points, game modes, turn timer, reconnect logic
- [ ] **Phase 3: Lobby** - Room creation, invite codes, public matchmaking, game settings, ready-up flow
- [ ] **Phase 4: Core Gameplay Loop** - Deal, bid reveal, play tricks, score one round end-to-end with live animations and scoresheet
- [ ] **Phase 5: Full Game Polish** - Complete 10-round game, post-game summary, sound effects, all UX finishes
- [ ] **Phase 6: Social Layer** - Friends system, direct invites, online status, all chat channels (lobby, in-round, post-game, DMs)
- [ ] **Phase 7: Notifications** - In-app notification bell and browser push notifications
- [ ] **Phase 8: Leaderboard & Profile** - Player profiles, stats, match history, all leaderboard views

## Phase Details

### Phase 1: Foundation

**Goal**: Users can sign up, sign in (email or Google), play as a guest, and the app is live on Netlify backed by a fully-wired Supabase project with the correct schema (including `declared_mode` column for Tigress from day one).
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):

  1. User can create an account with email and password and receives a verification email
  2. User can sign in with Google OAuth and is redirected to the app
  3. User can play as a guest (anonymous session) without creating an account
  4. Guest user can convert to a permanent account and their game history is retained
  5. User session survives a browser refresh; user can reset their password via email link

**Plans**: 5 plans
Plans:
**Wave 1**

- [ ] 01-01-PLAN.md — Walking Skeleton: deps, Vite+Tailwind, shadcn, Supabase client, Zustand auth store, React Router
- [x] 01-02-PLAN.md — Database schema: 8 game tables + RLS policies + SECURITY DEFINER RPC stubs + db push

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Auth screens: login, register, verify, verified, reset-password with pirate theme
- [x] 01-04-PLAN.md — Guest experience: /home placeholder, GuestBadge, GuestUpgradeModal

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-05-PLAN.md — Netlify deploy: netlify.toml, keep-alive function, .env.example, production verify

**UI hint**: yes

### Phase 2: Game Engine

**Goal**: All Skull King card rules, trick resolution, scoring, bonus points, game modes, turn timer, and reconnect logic exist as a fully unit-tested pure-TypeScript XState v5 state machine — playable in isolation without any UI.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, GAME-08, GAME-09, GAME-10, GAME-11
**Success Criteria** (what must be TRUE):

  1. All 66 cards (Parrot/green 1–14, Treasure Chest/yellow 1–14, Pirate Map/purple 1–14, Jolly Roger/black 1–14, 5 Pirates, 1 Tigress, 1 Skull King, 2 Mermaids, 5 Escapes) are represented and dealt correctly per round
  2. Trick resolution correctly ranks cards (Escape < Suited < Trump/Black < Pirate < Skull King; Mermaids beat Skull King; Tigress declared as Pirate or Escape; first-played wins ties) and automated tests verify all edge cases
  3. Scoring produces correct results for every bid outcome including zero bids, incorrect bids, and all 5 bonus point scenarios
  4. All 6 variable card count modes (Even Keeled, Skip to the Brawl, Swift-n-Salty, Broadside Barrage, Whirlpool, Past Your Bedtime) produce the correct card sequence for each round
  5. Turn timer auto-skips an inactive player after the configured duration; player can rejoin a disconnected game and receive full current state

**Plans**: TBD

### Phase 3: Lobby

**Goal**: Authenticated users can create or find a game room, configure settings, share an invite link, and start a game once all players are ready.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: LOBBY-01, LOBBY-02, LOBBY-03, LOBBY-04, LOBBY-05
**Success Criteria** (what must be TRUE):

  1. Host can create a private game room and share a 6-character invite code or link; a second user can join that room by entering the code
  2. User can browse a list of open public games and join one without a code
  3. Host can configure max players, card mode, and turn timer duration before the game starts
  4. All players can set their ready status; host's Start button activates only when everyone is ready
  5. A player who closes the browser tab can re-open the game URL and rejoin the same room in progress

**Plans**: TBD
**UI hint**: yes

### Phase 4: Core Gameplay Loop

**Goal**: Players can play a complete single round end-to-end — receive cards, reveal bids simultaneously, play tricks in turn order, see trick animations, and view the live scoresheet updated after the round.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):

  1. All players' bid tokens flip simultaneously on "Yo-ho-ho" reveal — no player sees others' bids beforehand
  2. Cards animate from deck to hand on deal, fly to the table on play, and the trick winner's pile grows visually as they collect it
  3. The live scoresheet panel is visible throughout the round and updates immediately after each round ends, showing all players' cumulative scores

**Plans**: TBD
**UI hint**: yes

### Phase 5: Full Game Polish

**Goal**: Players can play a complete 10-round game, see a post-game summary with round breakdown, and experience sound effects throughout — all mutable.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: UX-04, UX-05
**Success Criteria** (what must be TRUE):

  1. After 10 rounds the game ends automatically and a post-game summary screen displays final rankings, per-round scores, and a "Play Again" button
  2. Sea ambient, card play SFX, coin clink on scoring, and Skull King capture sounds play at appropriate moments and a single mute toggle silences all audio

**Plans**: TBD
**UI hint**: yes

### Phase 6: Social Layer

**Goal**: Users can find friends, send requests, invite friends directly to games, see who is online or in a game, and chat in every context — lobby, in-round, post-game, and direct messages.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: SOC-01, SOC-02, SOC-03, SOC-04, SOC-05, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05
**Success Criteria** (what must be TRUE):

  1. User can search for another player by username and send them a friend request; the recipient can accept or decline
  2. User can see a friends list showing each friend's real-time status (online, in a game, offline) via Supabase Presence
  3. User can send a direct game invite to a friend from the friends list; the friend sees the invite and can join the room
  4. Lobby chat, in-round chat, and post-game reactions feed are all visible and functional in their respective contexts, with pirate-themed quick emoji reactions available
  5. User can exchange direct messages with a friend outside of any game

**Plans**: TBD
**UI hint**: yes

### Phase 7: Notifications

**Goal**: Users receive timely in-app and browser push notifications for the events that matter most — incoming friend requests, game invites, and their turn.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: NOTIF-01, NOTIF-02
**Success Criteria** (what must be TRUE):

  1. An in-app notification bell shows an unread badge and lists pending friend requests, game invites, and "your turn" alerts; badge clears on open
  2. After a user's first completed game, the browser prompts for push notification permission; if granted, a push notification arrives when it is their turn or a friend invites them to a game — even when the app tab is not in focus

**Plans**: TBD
**UI hint**: yes

### Phase 8: Leaderboard & Profile

**Goal**: Users have a full public profile with stats and match history, and can compare their performance against all players, friends, and weekly competitors on leaderboard views.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, LB-01, LB-02, LB-03, LB-04
**Success Criteria** (what must be TRUE):

  1. User can set a unique username and upload a profile photo (or see auto-generated initials avatar); another user can view their public profile page
  2. User's profile displays games played, win rate, best single-game score, and their last 20 match results with scores and opponent names
  3. Global all-time leaderboard ranks all players by cumulative score; a second view ranks by win rate with a minimum games played threshold
  4. Friends-only leaderboard shows ranking filtered to the user's friends list
  5. Weekly leaderboard resets automatically at Sunday midnight and shows only scores accumulated since the last reset

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete   | 2026-05-18 |
| 2. Game Engine | 0/TBD | Not started | - |
| 3. Lobby | 0/TBD | Not started | - |
| 4. Core Gameplay Loop | 0/TBD | Not started | - |
| 5. Full Game Polish | 0/TBD | Not started | - |
| 6. Social Layer | 0/TBD | Not started | - |
| 7. Notifications | 0/TBD | Not started | - |
| 8. Leaderboard & Profile | 0/TBD | Not started | - |
