# Architecture Research

**Domain:** Real-time multiplayer browser card game (trick-taking, serverless)
**Researched:** 2026-05-17
**Confidence:** HIGH (Supabase patterns verified via Context7 + official docs; game architecture patterns from multiple cross-verified sources)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        React 19 Client (Browser)                     │
├────────────────┬──────────────────────┬──────────────────────────────┤
│   UI Layer     │   Game State Layer   │     Real-time Layer          │
│                │                      │                              │
│  GameTable     │  useGameStore        │  PresenceChannel             │
│  PlayerHand    │  (Zustand)           │  (lobby/friends status)      │
│  TrickPile     │                      │                              │
│  ScoreSheet    │  gameReducer         │  GameChannel (Broadcast)     │
│  ChatSidebar   │  (deterministic      │  (card_played, bid_locked,   │
│  LobbyPanel    │   state machine)     │   trick_resolved, chat_msg)  │
│  Notifications │                      │                              │
│                │  gameSelectors       │  DB Change Listeners         │
│                │  (derived state)     │  (round_started, game_ended, │
│                │                      │   score_updated, notifs)     │
└────────────────┴──────────┬───────────┴──────────┬───────────────────┘
                             │                      │
              ┌──────────────▼──────────────────────▼──────────────┐
              │              Supabase Platform                      │
              ├──────────────────────────────────────────────────── ┤
              │  Auth           Realtime          PostgreSQL        │
              │  (JWT tokens)   (WebSocket        (canonical state) │
              │                  cluster)                           │
              │                                   RLS Policies      │
              │  Edge Fns       Storage            Postgres Fns     │
              │  (game action   (avatars)         (atomic game      │
              │   validation)                      actions via RPC) │
              └─────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Data Owner |
|-----------|---------------|------------|
| `GameTable` | Orchestrates the play area; positions trick pile and player seats radially | Reads from game store |
| `PlayerHand` | Renders current player's cards; enforces legal-play highlighting | Local derived state |
| `OpponentHand` | Shows face-down card backs + count for each opponent | game_players row |
| `TrickPile` | Animates cards played in the current trick; shows last-trick winner | current_trick from store |
| `BidPanel` | Collects bid input, locks on submit, shows revealed bids post-Yo-Ho-Ho | round.phase from store |
| `ScoreSheet` | Full running scoresheet per player per round; collapsible during play | game_rounds + game_players |
| `ChatSidebar` | In-game and lobby chat; emoji reactions | Broadcast messages |
| `LobbyPanel` | Room creation, join by code, ready-up, settings | Presence + games table |
| `NotificationBell` | Friend requests, invites, turn alerts | DB changes on notifications |
| `Scoreboard` | Post-game and leaderboard display | leaderboard view |

---

## Game State Architecture

### Source of Truth: DB vs Client Memory

**Rule: PostgreSQL is the single source of truth. Clients only render confirmed state.**

Do not use optimistic updates for game actions (card plays, bids). The round-trip latency for a turn-based card game (< 500ms on a good connection) is acceptable, and premature optimism introduces divergence bugs that are very hard to debug with hidden information (players should never know they sent a card that got rejected until it happens). Optimism is appropriate only for cosmetic interactions (hover states, drag previews).

| State | Lives In | Rationale |
|-------|----------|-----------|
| Deck composition and deal | DB only (never sent to client in full) | Prevents cheating — player can only see own hand |
| Current player's hand | DB, sent to that player only via RLS | Secret per player |
| All bids after reveal | DB + broadcast to all | Shared after reveal phase |
| Cards played in current trick | DB + broadcast to all | Everyone sees played cards |
| Trick history | DB only | Queryable for scoresheet, not needed live |
| Scores per round | DB, broadcast on round end | Everyone sees scores |
| Game phase / whose turn | DB, broadcast on change | All clients must agree |
| Chat messages | DB (for history) + broadcast | Persistent and live |
| Friend online status | Presence channel only | Ephemeral, no DB needed |
| Lobby membership | Presence channel + games.status | Presence for live, DB for reconnect |

### Handling Simultaneous Actions: Bidding (Yo-Ho-Ho)

The bidding phase requires simultaneous sealed bids — no player should see others' bids until all have submitted. Use this pattern:

1. **Client submits bid** → `supabase.rpc('submit_bid', { game_id, round_number, bid_value })`
2. **Postgres function validates** (is it bid phase? has player already bid?) and writes to `game_rounds.bids` as `{ player_id: null }` — the null hides the actual value
3. **Postgres function checks** whether all players have bid
4. **If all bid**: function atomically flips all bids to their real values and transitions `round.phase` to `playing`
5. **DB change triggers** broadcast to all clients: `{ event: 'bids_revealed', payload: { bids: {...} } }`
6. **Clients update** simultaneously — everyone sees reveals at the same moment

This is atomic at the DB level. No client can see partial bid state. No race condition possible.

### Handling Card Plays (Turn Enforcement)

1. **Client taps a card** → drag released → `supabase.rpc('play_card', { game_id, card_id, tigress_mode? })`
2. **Postgres function validates**: is it this player's turn? is the card in their hand? does the card follow lead-suit rule?
3. **On success**: remove card from hand, insert into `game_tricks`, check if trick is complete
4. **If trick complete**: resolve winner (Postgres function), advance to next trick or end round
5. **Broadcast**: `{ event: 'card_played', player_id, card, position }` goes to all channel subscribers
6. **DB change**: `game_tricks` INSERT propagates via Postgres Changes listener

Only one Postgres function call per action. All validation is server-side. Never trust the client's card legality check.

### Row-Level Security Patterns

```sql
-- Helper: is this user in the game?
create or replace function is_game_participant(p_game_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from game_players
    where game_id = p_game_id
    and player_id = auth.uid()
    and status = 'active'
  );
$$;

-- games: participants can read their game
create policy "players_read_own_game" on games
  for select using (is_game_participant(id));

-- game_players: players see all seats in their game
create policy "players_read_game_seats" on game_players
  for select using (is_game_participant(game_id));

-- game_rounds: participants can read round data
create policy "players_read_rounds" on game_rounds
  for select using (is_game_participant(game_id));

-- game_tricks: all trick cards visible to participants
create policy "players_read_tricks" on game_tricks
  for select using (is_game_participant(game_id));

-- CRITICAL: player hands — each player sees ONLY their own cards
-- hands are stored in game_players.hand JSONB column, OR a separate
-- player_hands table with player_id. If using a table:
create policy "players_read_own_hand" on player_hands
  for select using (player_id = auth.uid());

-- No direct inserts allowed — all mutations go through RPC functions
-- (security definer functions bypass RLS for internal mutations)
create policy "no_direct_insert_tricks" on game_tricks
  for insert with check (false); -- blocked; use play_card() RPC only
```

---

## Realtime Channel Design

Use exactly **two channel types per active game session**. Keep channel count low — each connection supports up to 100 channels, but subscriptions multiply per connection.

### Channel 1: Lobby Presence Channel (`presence:lobby`)

**Purpose:** Who is online, who is waiting for a game, friends' statuses.
**Type:** Presence (CRDT-based, auto-synced)
**Payload per user:**
```typescript
{
  user_id: string,
  display_name: string,
  avatar_url: string,
  status: 'online' | 'in_game' | 'in_lobby',
  game_id?: string  // if in_game
}
```
**Lifecycle:** Track on app load, untrack on tab close (automatic via WebSocket disconnect).

### Channel 2: Game Channel (`game:{game_id}`)

**Purpose:** All in-game events. One channel per active game room.
**Type:** Broadcast (low-latency ephemeral events) + DB Change listeners layered on same channel topic

**Broadcast events (ephemeral, not stored — just delivery):**

| Event | Payload | Who sends |
|-------|---------|-----------|
| `card_played` | `{ player_id, card_face, position_in_trick }` | Server-triggered after RPC |
| `bids_revealed` | `{ bids: { [player_id]: number } }` | Server-triggered on all-bid |
| `trick_resolved` | `{ winner_id, winning_card, bonus_points }` | Server after trick RPC |
| `round_started` | `{ round_number, card_counts }` | Server on round advance |
| `chat_message` | `{ player_id, text, timestamp }` | Client directly |
| `emoji_reaction` | `{ player_id, emoji }` | Client directly |
| `player_reconnected` | `{ player_id }` | Server on reconnect RPC |

**DB Change listeners (persistent, derive from committed writes):**

| Table | Event | Used For |
|-------|-------|----------|
| `game_rounds` | INSERT / UPDATE | Round transitions, score updates |
| `games` | UPDATE (status) | Game ended, waiting → active |
| `notifications` | INSERT (for auth.uid()) | In-app notification bell |

**Recommendation:** Trigger most game events via Broadcast sent from within the Postgres RPC function body using `pg_notify` + a Supabase Edge Function webhook, or send them from the client after a successful RPC response. The cleanest pattern for Supabase specifically: after `supabase.rpc('play_card')` resolves on the acting client, that client broadcasts `card_played` to the channel. Other clients receive it without a round-trip to the DB.

**Channel 3: Friend Presence (`presence:friends:{user_id}`)** — optional, lower priority

For the direct-message and friends sidebar. Track friend online status by having all friends subscribe to a shared channel. At 200-connection free-tier limit, skip this for MVP and derive friend status from the lobby presence channel instead.

---

## Component Architecture

### Folder Structure

```
src/
├── game/                    # Core game engine (pure TS, no React)
│   ├── engine/
│   │   ├── deck.ts          # Card definitions, deal logic
│   │   ├── rules.ts         # Trick resolution, scoring, card ranking
│   │   ├── state-machine.ts # Game phases: dealing → bidding → playing → scoring
│   │   └── validators.ts    # Legal card play checks (follow suit, tigress mode)
│   └── types.ts             # GameState, Card, Trick, Round types
│
├── store/                   # Client state (Zustand)
│   ├── game.store.ts        # Active game state + actions
│   ├── lobby.store.ts       # Lobby/matchmaking state
│   └── notifications.store.ts
│
├── supabase/                # Supabase integration layer
│   ├── client.ts            # createClient singleton
│   ├── channels/
│   │   ├── game-channel.ts  # Subscribe/unsubscribe game broadcasts
│   │   └── lobby-channel.ts # Presence tracking
│   ├── rpc/
│   │   ├── play-card.ts     # supabase.rpc('play_card', ...)
│   │   ├── submit-bid.ts    # supabase.rpc('submit_bid', ...)
│   │   └── start-game.ts    # supabase.rpc('start_game', ...)
│   └── queries/
│       ├── game.queries.ts  # fetchGame, fetchRound, fetchHand
│       └── leaderboard.queries.ts
│
├── components/
│   ├── game/
│   │   ├── GameTable.tsx    # Root layout: positions seats, trick pile, chat
│   │   ├── PlayerHand/
│   │   │   ├── PlayerHand.tsx      # Current user's cards (fanned, interactive)
│   │   │   ├── CardInHand.tsx      # Single draggable/clickable card
│   │   │   └── LegalPlayMask.tsx   # Overlay for illegal cards
│   │   ├── OpponentSeat/
│   │   │   ├── OpponentSeat.tsx    # Face-down hand + name + bid/score
│   │   │   └── CardBack.tsx
│   │   ├── TrickPile/
│   │   │   ├── TrickPile.tsx       # Cards played this trick, centered
│   │   │   └── CardOnTable.tsx     # Face-up played card with player label
│   │   ├── BidPanel/
│   │   │   ├── BidPanel.tsx        # Bid input + reveal animation
│   │   │   └── BidCounter.tsx      # +/- stepper for bid value
│   │   ├── ScoreSheet/
│   │   │   ├── ScoreSheet.tsx      # Full per-round breakdown table
│   │   │   └── ScoreRow.tsx        # One player's row
│   │   └── GameLog.tsx             # Last N events (trick won, bonus, etc.)
│   ├── lobby/
│   │   ├── LobbyRoom.tsx           # Pre-game waiting room
│   │   ├── PlayerSlot.tsx          # One player slot (ready/waiting)
│   │   └── InviteLink.tsx          # Copy shareable link
│   ├── chat/
│   │   ├── ChatSidebar.tsx
│   │   ├── ChatMessage.tsx
│   │   └── EmojiPicker.tsx
│   ├── social/
│   │   ├── FriendsList.tsx
│   │   ├── FriendRequest.tsx
│   │   └── OnlineIndicator.tsx
│   └── ui/                         # Design system primitives
│       ├── Card.tsx                # Pirate-themed card face component
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Avatar.tsx
│
├── pages/                   # Route-level components
│   ├── Home.tsx             # Landing / matchmaking entry
│   ├── Lobby.tsx            # /lobby/:gameId
│   ├── Game.tsx             # /game/:gameId
│   ├── Profile.tsx          # /profile/:userId
│   └── Leaderboard.tsx      # /leaderboard
│
└── hooks/
    ├── useGame.ts           # Subscribes to game channel, syncs store
    ├── useLobby.ts          # Presence + lobby DB subscription
    ├── useMyHand.ts         # Fetches + listens for hand updates
    └── useNotifications.ts  # DB change listener for notifications table
```

### Component Boundary Rules

1. **`game/engine/`** — zero React, zero Supabase. Pure TypeScript functions. Unit-testable in isolation. This is the referee: it knows rules, not network.
2. **`supabase/`** — zero React, zero game rendering. All network calls live here.
3. **`store/`** — bridges engine and Supabase. Receives real-time events → runs local state updates.
4. **`components/game/`** — renders store state, dispatches RPC calls via `supabase/rpc/`. Never calls Supabase directly.
5. **`hooks/`** — channel subscription lifecycle tied to React component mount/unmount.

---

## Data Model

### Core Tables

```sql
-- Identity
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Social graph
create table friendships (
  id          uuid primary key default gen_random_uuid(),
  requester   uuid references profiles(id),
  addressee   uuid references profiles(id),
  status      text check (status in ('pending','accepted','blocked')) default 'pending',
  created_at  timestamptz default now(),
  unique (requester, addressee)
);

-- Game rooms
create table games (
  id              uuid primary key default gen_random_uuid(),
  host_id         uuid references profiles(id),
  status          text check (status in ('waiting','active','finished')) default 'waiting',
  invite_code     text unique not null,       -- 6-char alphanumeric
  max_players     int check (max_players between 2 and 8) default 4,
  card_mode       text default 'even_keeled', -- see GAME-09 modes
  current_round   int default 0,
  created_at      timestamptz default now(),
  started_at      timestamptz,
  ended_at        timestamptz
);

-- Seats in a game
create table game_players (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid references games(id) on delete cascade,
  player_id   uuid references profiles(id),
  seat_index  int not null,                  -- 0-7, determines play order
  status      text check (status in ('active','disconnected','left')) default 'active',
  is_ready    boolean default false,
  total_score int default 0,
  unique (game_id, player_id),
  unique (game_id, seat_index)
);

-- One row per player per round (bid + trick count + round score)
create table game_rounds (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid references games(id) on delete cascade,
  round_number    int not null,              -- 1-10
  phase           text check (phase in ('bidding','playing','scoring','complete')) default 'bidding',
  cards_dealt     int not null,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  unique (game_id, round_number)
);

-- Per-player bid and result for a round
create table round_results (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid references games(id) on delete cascade,
  round_id        uuid references game_rounds(id) on delete cascade,
  player_id       uuid references profiles(id),
  bid             int,                       -- null until submitted
  bid_locked      boolean default false,
  tricks_won      int default 0,
  round_score     int default 0,
  bonus_points    int default 0,
  running_total   int default 0
);

-- Cards played in a trick
create table game_tricks (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid references games(id) on delete cascade,
  round_id        uuid references game_rounds(id) on delete cascade,
  trick_number    int not null,
  player_id       uuid references profiles(id),
  card_id         text not null,             -- e.g. "parrot_7", "pirate_1", "skull_king"
  tigress_mode    text,                      -- 'pirate' | 'escape' | null
  play_order      int not null,              -- 1-N within trick
  winner_id       uuid references profiles(id), -- set when trick resolves
  played_at       timestamptz default now()
);

-- Player hands (secret per player — enforced by RLS)
create table player_hands (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid references games(id) on delete cascade,
  round_id    uuid references game_rounds(id) on delete cascade,
  player_id   uuid references profiles(id),
  cards       jsonb not null,               -- ["parrot_7","skull_king",...] — dealt hand
  unique (round_id, player_id)
);

-- Chat messages (lobby + in-game)
create table messages (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid references games(id) on delete cascade,
  player_id   uuid references profiles(id),
  body        text not null,
  created_at  timestamptz default now()
);

-- In-app notifications
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  recipient   uuid references profiles(id),
  type        text not null,                -- 'friend_request','game_invite','your_turn'
  payload     jsonb,
  read        boolean default false,
  created_at  timestamptz default now()
);

-- Aggregate leaderboard (updated by trigger on game finish)
create table leaderboard (
  player_id       uuid primary key references profiles(id),
  games_played    int default 0,
  games_won       int default 0,
  total_score     bigint default 0,
  best_game_score int default 0,
  updated_at      timestamptz default now()
);
```

### JSONB Usage Decision

Use JSONB only for `player_hands.cards` (the list of card IDs in a hand) and `notifications.payload`. Every other game state — bids, scores, played cards — is normalized into its own column or row. This avoids the partial-update problem (JSONB rewrites the whole value on any change) for hot paths like trick advancement and scoring.

---

## Data Flow

### Action Flow: Playing a Card

```
Player taps card
    │
    ▼
CardInHand.tsx: onPlay(cardId)
    │
    ▼
useGame.ts: playCard(cardId, tigressMode?)
    │  (no optimistic update — wait for server)
    ▼
supabase.rpc('play_card', { game_id, card_id, tigress_mode })
    │
    ▼ (Postgres SECURITY DEFINER function)
Validates: player turn? card in hand? follows suit rule?
    │  (raises exception on violation → client gets error)
    ▼
Removes card from player_hands.cards
Inserts row into game_tricks
Checks if trick is complete (all players played)
    │ if complete
    ▼
Resolves trick winner (Skull King > Pirate > Mermaid logic)
Updates round_results.tricks_won for winner
Advances trick_number or ends round
    │
    ▼
RPC returns: { success: true, played_card, trick_complete, winner? }
    │
    ▼
Acting client broadcasts to game channel:
  { event: 'card_played', player_id, card_id, play_order, trick_complete, winner_id? }
    │
    ▼
All clients receive broadcast → update game store → re-render
    │
    ▼
If round ended: DB Change on game_rounds UPDATE fires
    → all clients fetch fresh round_results for scoresheet
```

### Bidding Flow: Simultaneous Reveal

```
Player submits bid N (finger count)
    │
    ▼
supabase.rpc('submit_bid', { game_id, round_id, bid_value })
    │
    ▼
Postgres function:
  - Checks phase = 'bidding'
  - Stores bid as SEALED in round_results (sets bid = N, bid_locked = true)
  - Returns: { waiting_for: [player_ids...] } or { all_locked: true }
    │
    ▼ (if all_locked)
Postgres atomically marks phase = 'playing'
    │
    ▼
DB Change on game_rounds UPDATE (phase) fires to all subscribers
    │
    ▼
All clients re-fetch round_results (now with all bids visible)
BidPanel transitions to bid-reveal animation → playing phase
```

### Reconnect Flow

```
Player tab closes / network drops
    │
    ▼
Supabase WebSocket disconnects (auto-detected by server)
Presence channel removes player
    │
    ▼ (on reconnect)
App loads → checks games table for active game with player_id
    │
    ▼
supabase.rpc('reconnect_to_game', { game_id })
    → Updates game_players.status = 'active'
    → Returns full current game snapshot:
       { game, current_round, round_results, my_hand, tricks_this_round }
    │
    ▼
Client rebuilds store from snapshot
Re-subscribes to game channel
Broadcasts { event: 'player_reconnected', player_id }
```

---

## Architectural Patterns

### Pattern 1: Server-Authoritative RPC for Game Actions

**What:** All game mutations (play card, submit bid, start game, advance round) are Postgres `SECURITY DEFINER` functions called via `supabase.rpc()`. Clients never `INSERT`/`UPDATE` game tables directly.

**When to use:** Every stateful game action. Non-game actions (sending chat, updating profile) can use direct table operations.

**Trade-offs:** Slightly more setup per action (write SQL function + TypeScript wrapper). Payoff: impossible to cheat, atomic validation, no race conditions, no need for a separate Node game server.

### Pattern 2: Deterministic Broadcast After RPC

**What:** The client that performed an action broadcasts the result event to the game channel immediately after the RPC call succeeds. Other clients update their state from this broadcast. DB Change listeners serve as fallback and for persistent transitions (round end, game end).

**When to use:** `card_played`, `bids_revealed`, `trick_resolved`, `emoji_reaction`, `chat_message`.

**Why not DB Changes for everything:** Postgres Changes at scale creates a bottleneck — the Realtime server polls Postgres WAL and fans out. For ephemeral gameplay events, Broadcast is lower latency and does not stress the WAL reader. Supabase's own recommendation is to prefer Broadcast for high-frequency events.

**Trade-offs:** The acting client is responsible for broadcasting. If they disconnect mid-action after RPC succeeds but before broadcast, other clients will not see the event via broadcast — but they will via the DB Change listener on the relevant table (fallback). This is acceptable.

### Pattern 3: Game Phase State Machine (Serverside)

**What:** `games.status` and `game_rounds.phase` together form the game state machine. All valid transitions are enforced in Postgres functions. The client's state machine (in `game/engine/state-machine.ts`) mirrors this for UI logic only — it never overrides what the DB says.

```
games.status:   waiting → active → finished
game_rounds.phase: bidding → playing → scoring → complete
```

**When to use:** Any phase gate. E.g., `play_card()` checks `phase = 'playing'` before accepting input.

**Trade-offs:** Phase checks add 1-2 SQL conditions per RPC. Worth it. Prevents double-submits, out-of-phase actions, and replay attacks.

---

## Anti-Patterns

### Anti-Pattern 1: Client-side Card Shuffle and Deal

**What people do:** Generate the deck on the client, shuffle it there, and distribute to players.

**Why it's wrong:** Any player can inspect their network traffic or JS state to see all hands before they're dealt. Even with encryption it creates an attack surface.

**Do this instead:** Shuffle and deal happens in a `SECURITY DEFINER` Postgres function. The function stores each player's hand into `player_hands` with that player's `player_id`. RLS ensures each player only ever reads their own row.

### Anti-Pattern 2: Storing Full Game State in One JSONB Column

**What people do:** Put the entire game state (`{ round, hands, tricks, scores }`) in one `games.state JSONB` column. Seems simple.

**Why it's wrong:** Every card play rewrites the entire JSON blob. Concurrent writes cause conflicts. Realtime DB Change payloads balloon to kilobytes. Impossible to query history. RLS cannot filter within the blob (so you can't hide opponent hands).

**Do this instead:** Normalized tables as designed above. Use JSONB only for the player's own card list (`player_hands.cards`) — a value that only one player writes and reads.

### Anti-Pattern 3: Subscribing to Full Table Changes Without Filters

**What people do:** `supabase.channel('...').on('postgres_changes', { event: '*', schema: 'public', table: 'game_tricks' }, handler)` with no `filter`.

**Why it's wrong:** Every trick played by every concurrent game fires at every subscriber. At 200 connections and 25 concurrent games, each event fires 200 times. Hits the 100 msg/s limit quickly.

**Do this instead:** Always filter: `filter: 'game_id=eq.' + gameId`. Each client only receives events for their game.

### Anti-Pattern 4: Using Presence for Game State

**What people do:** Track `{ currentTrick: [...], bids: {...} }` in Presence state.

**Why it's wrong:** Presence is designed for ephemeral identity state (is Alice online?). It syncs via CRDT across all channel members. Large presence payloads slow sync. Presence state is capped at 10 keys per object per Supabase limits.

**Do this instead:** Presence for: `{ user_id, display_name, status }`. Game state via Broadcast events + DB.

---

## Suggested Build Order

Dependencies cascade strictly in this order. Each phase produces working software usable by subsequent phases.

### Phase 1: Foundation (Auth + Profiles + DB Schema)
Unblocks everything. Nothing else can be built without this.
- Supabase project setup + local dev (supabase CLI)
- Database migrations: all tables above with RLS
- Auth: email/password, Google OAuth, anonymous sessions
- Profile creation on signup (trigger)
- Basic Vite/React shell with routing

### Phase 2: Game Engine (Pure Logic, No Network)
Build the referee before the game. Test it in isolation.
- `game/engine/deck.ts`: full 66-card deck (suited 1-14 x4, Pirates x5, Tigress, Skull King, Mermaids x2, Escapes x5)
- `game/engine/rules.ts`: card ranking, trick resolution, scoring formula, bonus points
- `game/engine/validators.ts`: legal card play checks
- `game/engine/state-machine.ts`: phase transitions
- Unit tests for all special card interactions (Tigress, Mermaid captures SK, etc.)

### Phase 3: Lobby + Matchmaking
Players need rooms before they can play.
- `create_game()` / `join_game()` RPC functions
- Lobby Presence channel (online status)
- Invite link generation and redemption
- Ready-up + host start game

### Phase 4: Core Gameplay Loop (Single Round)
The most complex phase. Build bidding → playing → scoring for one round.
- `deal_cards()`, `submit_bid()`, `play_card()` Postgres RPC functions
- Game channel (Broadcast + DB Changes)
- `GameTable`, `PlayerHand`, `TrickPile`, `BidPanel` components
- Trick resolution and scoring display
- Reconnect flow

### Phase 5: Full 10-Round Game
Extend single round to full game.
- Round advancement logic
- `ScoreSheet` component (running totals)
- Game end detection + final scoring
- Post-game recap screen

### Phase 6: Chat + Emoji
No blocking dependencies on game logic, but adds value in play.
- `ChatSidebar` + Broadcast chat events
- Emoji reactions

### Phase 7: Social (Friends + Notifications)
Needs auth (Phase 1) and profiles. Independent of game logic.
- Friendship requests / accept / block
- Friend online status via Presence
- In-game and turn alert notifications
- Direct invite to game

### Phase 8: Leaderboard + Profile Stats
Needs completed games (Phase 5).
- Leaderboard trigger on game finish
- Profile stats page
- Match history
- Friends leaderboard

---

## Scaling Considerations

| Scale | Connection budget | Architecture |
|-------|-------------------|-------------|
| 0-25 concurrent users | ~25-50 connections (1-2 channels each) | Free tier sufficient; standard setup |
| 25-100 concurrent users | ~100-200 connections | Approaching free tier limit; audit channel count per user; collapse presence channels |
| 100+ concurrent users | Exceeds free tier 200-connection limit | Upgrade to Pro ($25/mo, 500 concurrent) or implement channel pooling |

**First bottleneck:** Supabase free tier 200 concurrent WebSocket connections. Each browser tab uses 1 connection. Each connection supports multiple channels. Do not create per-feature channels — keep it to 2 channels per active user (game channel + lobby presence).

**Second bottleneck:** Postgres Changes WAL reader overhead at high game concurrency. Mitigate by using Broadcast for gameplay events and reserving Postgres Changes for round/game lifecycle events only.

**Third bottleneck:** Netlify edge function cold starts for complex game RPCs. Mitigate by using Postgres functions (always warm) instead of edge functions for game action validation.

---

## Integration Points

### Supabase Services

| Service | Used For | Pattern |
|---------|----------|---------|
| Supabase Auth | Email, Google OAuth, anonymous sessions | JWT in every request; RLS reads `auth.uid()` |
| Supabase Realtime | Game events, lobby presence, notifications | 2 channels per user: `presence:lobby` + `game:{id}` |
| Supabase PostgreSQL | All persistent state | Normalized tables; RPC for mutations |
| Supabase Storage | Avatar images | Public bucket; max 50MB free tier |
| Supabase Edge Functions | (minimal) Browser push notification delivery | Deno; only if Web Push API needed |

### Netlify

| Service | Used For | Pattern |
|---------|----------|---------|
| Static Hosting | React SPA | Vite build → Netlify CDN |
| Netlify Functions | None required initially; possible future: push notification relay | Avoid if Supabase Edge Functions can handle it |

---

## Sources

- Supabase Realtime Limits: https://supabase.com/docs/guides/realtime/limits
- Supabase Realtime Multiplayer GA announcement: https://supabase.com/blog/supabase-realtime-multiplayer-general-availability
- Supabase RLS patterns (Context7 / official docs): https://supabase.com/docs/guides/database/postgres/row-level-security
- Turn-based game networking patterns: https://longwelwind.net/blog/networking-turn-based-game/
- Multiplayer card game scalability: https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6
- Broadcast vs Postgres Changes decision: https://eastondev.com/blog/en/posts/dev/supabase-realtime/
- Supabase multiplayer game example (Flutter): https://supabase.com/blog/flutter-real-time-multiplayer-game
- Realtime Broadcast from Database (server-side triggers): https://supabase.com/blog/realtime-broadcast-from-database

---

*Architecture research for: Skull King Online — real-time multiplayer serverless card game*
*Researched: 2026-05-17*
