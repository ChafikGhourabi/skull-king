# Skull King Online

## What This Is

A real-time multiplayer web game based on the physical card game Skull King — a trick-taking game for 2-8 players played over 10 rounds where players bid on how many tricks they'll win each round. Built with React, Supabase (real-time DB + auth), and deployed on Netlify. Players can compete with friends via private invite or find opponents through public matchmaking.

## Core Value

**Friends can play Skull King online together in real-time, exactly as the physical game works, from any browser.**

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Game Engine
- [ ] **GAME-01**: Core Skull King rules implemented (10 rounds, trick-taking, lead suit, trump suit)
- [ ] **GAME-02**: Full card deck: 4 suited suits (Parrot/green 1-14, Treasure Chest/yellow 1-14, Pirate Map/purple 1-14, Jolly Roger/black 1-14), 5 Pirates, 1 Tigress, 1 Skull King, 2 Mermaids, 5 Escapes
- [ ] **GAME-03**: Bidding phase — simultaneous reveal of bids (Yo-ho-ho mechanic)
- [ ] **GAME-04**: Playing phase — follow lead suit rule, special cards played freely
- [ ] **GAME-05**: Trick resolution — correct card ranking (Escape < Suited < Trump < Pirate < Skull King, Mermaids beat Skull King but lose to Pirates; first-played tiebreak)
- [ ] **GAME-06**: Tigress special behavior (plays as Pirate or Escape, declared on play)
- [ ] **GAME-07**: Scoring: correct bid = 20pts × tricks, incorrect = -10pts × difference; zero bid = 10pts × cards dealt (or -10pts × cards if fail)
- [ ] **GAME-08**: Bonus points: #14 standard suit = +10pts, #14 black = +20pts; Mermaid captures Pirate = +20pts; Skull King captures Pirate = +30pts; Mermaid captures Skull King = +40pts
- [ ] **GAME-09**: Variable card count modes (Even Keeled, Skip to the Brawl, Swift-n-Salty, Broadside Barrage, Whirlpool, Past Your Bedtime)
- [ ] **GAME-10**: 2-8 player support including 8-player variant (8 cards cap on rounds 9-10)
- [ ] **GAME-11**: Live scoresheet visible during and after each round

#### Lobby & Matchmaking
- [ ] **LOBBY-01**: Create private game room with shareable invite code/link
- [ ] **LOBBY-02**: Public matchmaking — join available open games
- [ ] **LOBBY-03**: Host can configure game settings (player count, card mode)
- [ ] **LOBBY-04**: Players can ready up; host starts when ready
- [ ] **LOBBY-05**: Reconnect to in-progress game if disconnected

#### Authentication
- [ ] **AUTH-01**: Sign up and log in with email + password (Supabase Auth)
- [ ] **AUTH-02**: Sign in with Google OAuth
- [ ] **AUTH-03**: Guest/anonymous play (limited to game features, no stats/friends)
- [ ] **AUTH-04**: Email verification flow
- [ ] **AUTH-05**: Password reset via email

#### Friends System
- [ ] **SOCIAL-01**: Search and find players by username
- [ ] **SOCIAL-02**: Send/receive/accept friend requests
- [ ] **SOCIAL-03**: Invite friends directly to a game
- [ ] **SOCIAL-04**: See friends' online / in-game status in real-time
- [ ] **SOCIAL-05**: Share friend invite link

#### Chat & Emoji
- [ ] **CHAT-01**: Lobby chat before game starts
- [ ] **CHAT-02**: In-round chat during gameplay
- [ ] **CHAT-03**: Emoji reactions (quick emoji picker)
- [ ] **CHAT-04**: Direct messages between friends (out-of-game)
- [ ] **CHAT-05**: Post-game recap/reactions feed

#### Leaderboard
- [ ] **LB-01**: Global all-time leaderboard (cumulative score)
- [ ] **LB-02**: Win rate and games played ranking
- [ ] **LB-03**: Friends-only leaderboard
- [ ] **LB-04**: Weekly leaderboard with auto-reset

#### Player Profile
- [ ] **PROFILE-01**: Username + avatar (uploaded photo or auto-generated initials)
- [ ] **PROFILE-02**: Stats: games played, win rate, best single-game score
- [ ] **PROFILE-03**: Match history (recent game results with scores and opponents)

#### Notifications
- [ ] **NOTIF-01**: In-app notification bell (friend requests, game invites, turn alerts)
- [ ] **NOTIF-02**: Browser push notifications (your turn, friend invites you)

### Out of Scope

- **Advanced cards (Loot, Kraken, White Whale)** — v2 feature; adds complexity, launch with standard rules first
- **Spectator mode** — deferred to v2; simplifies game state management
- **Achievement badges** — v2 feature; not critical for launch
- **GitHub OAuth** — Google covers most OAuth need; keep auth scope lean
- **Email notifications** — browser push covers urgency; email adds overhead for v1
- **Mobile app (iOS/Android)** — web-first; PWA capabilities sufficient for v1
- **Tournament / bracket mode** — scope creep; leaderboard covers competitive need for now

## Context

- **Existing repo**: Fresh Vite + React 19 + TypeScript scaffold already initialized
- **Rulebook**: Full rules in `Skull_King_Rulebook.pdf` at project root; official how-to-play at grandpabecksgames.com/pages/skull-king
- **Real-time layer**: Supabase Realtime (Presence + Broadcast channels) for game state, chat, and friend online status — all on free tier
- **Card interaction complexity**: Tigress, Mermaid/Pirate/Skull King bonus rules, and first-played tiebreaks need careful game engine design
- **Free tier limits**: Supabase free = 500MB DB, 2GB bandwidth, 50MB file storage; Netlify free = 100GB bandwidth, 300 build minutes/month — sufficient for launch

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite (already scaffolded), Supabase (DB/Auth/Realtime/Storage), Netlify (hosting + CI) — all free tier
- **Budget**: $0 — only free-tier providers; no paid services
- **Database**: PostgreSQL via Supabase; schema must fit free tier storage limits
- **Real-time**: Supabase Realtime free tier — max 200 concurrent connections; game design must not require more
- **Auth**: Supabase Auth — handles email, Google OAuth, anonymous sessions natively
- **No backend server**: Serverless only (Netlify Functions or Supabase Edge Functions); no persistent Node process

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Realtime for all real-time (game + chat + presence) | Single real-time layer, free tier, already integrated with Supabase Auth | — Pending |
| Standard rules only in v1, advanced cards in v2 | Reduces game engine complexity at launch; advanced rules add 3 new cards with unique behaviors | — Pending |
| No spectator mode in v1 | Simplifies game state and Realtime channel management | — Pending |
| Netlify hosting (not Vercel) | User specified; both free-tier equivalent | — Pending |
| React 19 with Vite | Already scaffolded; React 19 with compiler optimizations for real-time UI updates | — Pending |
| Faithful pirate theme (dark wood, parchment, gold) | Matches physical game aesthetic; creates immersive feel the user specifically requested | — Pending |
| Impeccable design system | User specifically requested `impeccable` skill for design system/UX/UI | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-17 after initialization*
