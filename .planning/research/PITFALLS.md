# Pitfalls Research

**Domain:** Real-time multiplayer web card game (Skull King) — React 19 + Supabase + Netlify, free tier only, no custom backend server
**Researched:** 2026-05-17
**Confidence:** HIGH (Supabase limits verified against official docs; game rules verified against BGA and official rulebook; reconnection behavior verified against Supabase GitHub issues)

---

## Critical Pitfalls

### Pitfall 1: Supabase Free Tier Project Pauses After 7 Days of Inactivity

**What goes wrong:**
The Supabase free tier pauses the compute instance after 7 consecutive days of no database activity. The project is not deleted, but when the next request arrives it takes ~30 seconds to wake up. For a game lobby, the first player to open the app will see a blank screen or failed connection while the database cold-starts. This is not "dashboard visits" — it requires actual queries hitting the database.

**Why it happens:**
Free-tier resource management by Supabase. Dashboard access and cached API calls do not count. Only authenticated queries or direct DB writes reset the inactivity timer.

**How to avoid:**
Set up a scheduled keep-alive ping using a free GitHub Actions cron job or Netlify Scheduled Function that runs a lightweight query (e.g., `SELECT 1`) every 5 days. This is the standard community solution — multiple open-source tools exist for it (e.g., `supabase-pause-prevention` on GitHub). Document this in the project so it does not get forgotten when the project is inactive between development sessions.

**Warning signs:**
- First cold open of the app shows a loading spinner for 30+ seconds
- Supabase dashboard shows project status as "Paused"
- All API calls return 503 or connection refused errors until wake-up completes

**Phase to address:**
Infrastructure / Deployment phase (before any user-facing launch). Add the keep-alive cron as part of the CI/CD setup on Netlify.

---

### Pitfall 2: Simultaneous Bid Reveal Race Condition (GAME-03: Yo-ho-ho mechanic)

**What goes wrong:**
Skull King uses simultaneous bid reveal — all players submit bids and they are revealed at once. If the game engine writes bids directly to the database as they arrive and broadcasts each write, some clients will see bids before all players have submitted. In the worst case, a client that reconnects mid-bidding phase fetches the game state and sees partial bids, leaking information that should be hidden until all bids are in.

**Why it happens:**
Supabase Realtime Postgres Changes broadcasts every INSERT or UPDATE immediately. There is no built-in "atomic batch reveal" — each player's bid write fires a change event independently. Without explicit state machine control, the frontend cannot distinguish "bid received" from "all bids locked and ready to reveal."

**How to avoid:**
Use a two-column design on the bids table: `bid_value` (hidden until reveal) and `bid_submitted` (boolean, immediately visible). Add a `phase` field to the game state table (`bidding` → `bid_locked`). Only reveal `bid_value` values once `phase = bid_locked`. Transition to `bid_locked` via a Supabase RPC (PostgreSQL function) that atomically checks all players have submitted and updates `phase` in one transaction. Clients read all bids only after the phase transition, never during.

**Warning signs:**
- Players can see each other's bids before everyone has submitted
- A player refreshing the page mid-bidding sees different data than those who stayed connected
- The "reveal" animation sometimes shows already-known values

**Phase to address:**
Game Engine phase — must be designed before any bidding UI is built. The RPC + phase state machine is foundational.

---

### Pitfall 3: Client State Divergence ("Split Brain") After Reconnect

**What goes wrong:**
A player temporarily loses connection (mobile switching from WiFi to cellular, tab backgrounded, brief network hiccup). Supabase Realtime uses exponential backoff to reconnect (1s, 2s, 5s, up to 30s). During the gap, the game state advances — tricks are played, a round ends. When the client reconnects, the Realtime channel re-subscribes but it only receives events going forward. The client's local React state is now stale and diverged from the server. The player sees a game state from 2 minutes ago until they manually refresh.

**Why it happens:**
Supabase Realtime delivers events in real time but does not replay missed events on reconnect. The channel re-joins from the current moment, not from where the client was before the disconnection. There is also a known silent disconnection issue: when a browser tab is backgrounded, JavaScript timer throttling stops heartbeat messages, causing the server to silently drop the connection with no error surfaced to the client.

**How to avoid:**
Two complementary strategies:
1. **On every channel reconnect event**, re-fetch the canonical game state from the database directly (`supabase.from('games').select(...)`) and overwrite local state. Treat the database as the source of truth, not the event stream.
2. **Enable the Realtime Web Worker option** (`{ worker: true }` in Realtime config) so heartbeats are sent from a worker thread not subject to browser timer throttling. This prevents most silent disconnections in backgrounded tabs.

Also implement a visible "Reconnecting..." overlay so players know the game is paused while sync recovers, rather than letting them make decisions on stale state.

**Warning signs:**
- Players report "the game jumped ahead" after coming back to the tab
- Game phase shows "bidding" on one client and "playing" on another
- Console shows WebSocket state cycling CHANNEL_ERROR → CLOSED → SUBSCRIBED without the app refreshing state

**Phase to address:**
Game Engine phase — build the reconnect handler as part of the initial real-time subscription setup. Do not defer to a later polish phase.

---

### Pitfall 4: Tigress Dual-Mode Scoring Bug

**What goes wrong:**
The Tigress card can be declared as Pirate or Escape at the moment of play. Implementations that store only the card identity (not the declared mode) will incorrectly evaluate trick resolution. If stored as Pirate, the Tigress can win tricks and yield +20/+30/+40 bonus points. If declared as Escape, it explicitly cannot win, and **no capture bonus is awarded** even if the Tigress "would have" beaten other cards. Additionally, the Tigress declaration must be irrevocable — the player cannot change it after seeing other cards play.

**Why it happens:**
Card identity and play-mode are treated as the same thing. The game state only records which card was played, not how it was declared. The trick resolution function operates on card values, not player intent.

**How to avoid:**
Model played cards with an additional `declared_mode` field: `{ card_id: "tigress", declared_mode: "pirate" | "escape" }`. The trick resolution function must use `declared_mode` to rank the Tigress, not its base card type. The UI must require the player to choose mode before the card is committed to the game state (a modal confirmation at play time, not after).

**Warning signs:**
- The Tigress played as Escape is still winning tricks
- Bonus points are being awarded when Tigress was declared as Escape
- Players can retroactively change their Tigress declaration

**Phase to address:**
Game Engine phase — `declared_mode` must be in the initial schema and play-submission RPC. This is a data model decision, not a UI decision.

---

### Pitfall 5: Bonus Points Only Count When Bid Is Correct

**What goes wrong:**
Bonus points (14 black = +20, Mermaid captures Pirate = +20, Skull King captures Pirate = +30, Mermaid captures Skull King = +40) are silently discarded if the player misses their bid. Implementations that calculate bonuses independently and add them unconditionally produce inflated or incorrect scores. The official rules state bonuses are awarded only on a correct bid.

**Why it happens:**
Bonuses and bid-scoring are implemented as separate calculations that get summed. The interdependency — bonuses are conditional on bid correctness — is easy to miss, especially when scoring is built feature by feature.

**How to avoid:**
The scoring function must calculate bid success first, then conditionally apply bonuses. Structure it as: `roundScore = bidSuccessPoints + (bidCorrect ? bonusPoints : 0)`. This must be a single server-side RPC call (Supabase PostgreSQL function) that runs the entire scoring calculation atomically. Do not compute bonuses client-side or in a separate step.

**Warning signs:**
- Players who fail their bid are still gaining bonus points
- Scores are higher than expected when bids are missed
- The scoresheet shows bonus point rows even for incorrect bids

**Phase to address:**
Game Engine phase — write a comprehensive test suite for the scoring function before any UI. Cover: correct bid with bonuses, incorrect bid with bonuses (bonuses zeroed), zero bid success, zero bid failure with round multiplier.

---

### Pitfall 6: Zero-Bid Scoring Uses Round Multiplier, Not Trick Count

**What goes wrong:**
A zero bid success scores `10 × round_number` (not `10 × cards_dealt`, not a flat 10). A zero bid failure (player wins at least one trick) scores `-10 × round_number`. In round 5, a failed zero bid costs -50 points. Implementations that use tricks taken (0 or N) as the multiplier instead of the round number will produce wrong scores in every round except round 1.

**Why it happens:**
The rule reads "10 points times the number of cards dealt in the round" — which equals the round number since round N deals N cards. Developers may implement it as `10 × cards_in_hand` or `10 × tricks_won`, both of which coincidentally work only in round 1.

**How to avoid:**
Store `round_number` explicitly in the scoring function. The formula must be `abs_points = 10 * round_number`. Write a unit test covering round 10 zero-bid success (should be +100) and round 10 zero-bid failure with 2 tricks (should be -100, not -20).

**Warning signs:**
- Scores in rounds 1-3 look correct but diverge later in the game
- Round 10 zero bids are worth the same as round 1 zero bids
- Players notice scores seem wrong "in later rounds"

**Phase to address:**
Game Engine phase — verify with the unit test suite before releasing any scoring UI.

---

### Pitfall 7: Postgres Changes RLS Authorization Fan-Out Kills Performance at Scale

**What goes wrong:**
When using Supabase Realtime Postgres Changes on a table with RLS enabled and multiple subscribers, every single database change triggers an RLS authorization check for every subscribed client. With 8 players watching a `game_state` table, one UPDATE generates 8 RLS authorization queries. At peak play (multiple tricks per minute × 8 players), this creates a multiplied read load on the database that can slow change delivery from milliseconds to 500ms–1s, degrading the real-time feel of the game.

**Why it happens:**
Postgres Changes authorization is per-subscriber, not per-event. It is a deliberate security design — each client must be verified before receiving a row — but it becomes a fan-out tax at the free tier's resource limits.

**How to avoid:**
Use **Broadcast** (not Postgres Changes) for in-game real-time events. The pattern: game actions write to the database via RPC (authoritative, persistent), then the RPC triggers a Broadcast message to the game channel with the new state snapshot. Clients receive the Broadcast (no per-client RLS fan-out) and update local state. Only use Postgres Changes for lobby-level events (player joining, game starting) where fan-out is low.

**Warning signs:**
- Trick plays feel sluggish compared to how fast cards are submitted
- Supabase dashboard shows high read query counts relative to write counts
- Latency increases as more players join the game

**Phase to address:**
Game Engine phase — architectural decision. Choose Broadcast-first for in-game events from the start. Retrofitting later requires rewriting the entire event delivery layer.

---

### Pitfall 8: Multiple Supabase Client Instances Exhaust the 200-Connection Free Limit

**What goes wrong:**
Each `createClient()` call creates a new WebSocket connection to Supabase Realtime. If the app creates a new Supabase client in a React context that re-renders frequently, or if developers use `createClient()` in multiple components without a singleton, concurrent connections multiply rapidly. With 200 total connections on the free tier (across all users), a 4-player game room where each client accidentally creates 2-3 connections consumes 8-12 connections for a single game — the project hits the ceiling at ~20 simultaneous games.

**Why it happens:**
Supabase client creation looks cheap (just a constructor call) but each instance opens its own WebSocket. React development patterns that create services inside components or hooks without memoization trigger repeated client instantiation.

**How to avoid:**
Create a single Supabase client as a module-level singleton (`src/lib/supabase.ts` that exports one instance). Never call `createClient()` inside a component render function or React hook directly. Audit with browser devtools — open the Network tab, filter by WS — and count WebSocket connections. Should be exactly 1 per browser tab.

**Warning signs:**
- Browser devtools shows multiple WebSocket connections to Supabase per tab
- Console errors: `too_many_connections` from the Supabase Realtime server
- Lobby page causes a spike in connection count visible in the Supabase dashboard

**Phase to address:**
Project scaffold phase — establish the singleton pattern in `src/lib/supabase.ts` before any feature work. Enforce with a linting rule or code review checklist item.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Validate game moves only client-side | Faster to implement | Players can cheat by manipulating JS state or API calls directly | Never — always validate in PostgreSQL RPC |
| Store full game state as a JSON blob on one row | Simpler schema | One large UPDATE per action creates write amplification; hard to query history; difficult to add features | Early prototyping only, rewrite before game logic is complete |
| Skip reconnect state-refresh and rely purely on event stream | Less code | Diverged state after any disconnection; impossible to recover without page reload | Never for a real-time game |
| Use Postgres Changes for all real-time updates | Simpler architecture | RLS fan-out degrades performance; 500ms+ latency under load | Acceptable for lobby events, never for in-game trick plays |
| Single `games` channel for all real-time (lobby + game + chat) | One subscription to manage | One channel carries everything; chat messages trigger game-state re-renders; hard to add per-game scoping | Never — separate channels by concern from the start |
| Allow client to calculate its own final score | Avoids RPC complexity | Diverged scores between clients; exploitable; impossible to reconstruct history | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Realtime + RLS | Enabling Postgres Changes on an RLS table and assuming it "just works" | Postgres Changes + RLS generates N authorization queries per event (N = subscriber count). Use Broadcast for high-frequency in-game events; reserve Postgres Changes for low-frequency lobby events |
| Supabase Anonymous Auth + RLS | Forgetting that anonymous users use the `authenticated` role | RLS policies that grant `authenticated` users access accidentally expose data to anonymous sessions. Check `auth.jwt() ->> 'is_anonymous'` to distinguish. Write separate policies for anonymous vs full accounts |
| Supabase Anonymous Auth → Permanent conversion | Calling `updateUser()` and assuming data migrates automatically | Data is not migrated. The user's UUID changes on email link, not identity. Must manually reassign all game history rows from `anon_id` to `permanent_id` in a transaction. Handle this in an Edge Function, not client-side |
| Supabase Storage avatars | Uploading full-resolution photos without client-side resize | Free tier has 1GB total storage and no free image transformation CDN. 100 users uploading 3MB phone photos = 300MB consumed. Resize to max 256×256px on client before upload using `canvas` API |
| Netlify Functions cold start | Using a Netlify Function for game move validation expecting sub-100ms | Netlify Functions (AWS Lambda) have cold starts of 200-500ms. Not suitable for real-time game move validation. Use Supabase RPC (PostgreSQL functions) instead — they run in the same process as the database |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering the entire game board on every Realtime event | Card animations replay; full component tree re-renders when any player action arrives | Use `React.memo` on individual card and player components; use Zustand or Jotai with selectors so only components subscribed to changed state slices re-render | At ~8 players per game; every trick play triggers visible jank |
| Storing the full 8-player hand state in one subscription | Every card play by anyone re-renders every player's hand | Split state: only subscribe each client to its own hand state; receive other players' hand counts (not contents) via Broadcast | Immediately visible during 8-player games |
| Fetching leaderboard data on every page mount | Leaderboard page causes full table scan on every visit | Cache leaderboard results in a `materialized_view` that refreshes on a schedule; serve stale data with a cache-control header | When >10 concurrent users are browsing the leaderboard |
| Blocking bid reveal on polling instead of event | Bid reveal latency tied to poll interval (1-3s perceived lag) | Use Broadcast for the `phase = bid_locked` transition event; clients reveal bids immediately on event receipt | Every game, always — polling adds unnecessary latency |
| Friend presence status as individual DB rows | 50 friends = 50 Postgres Changes subscriptions per user | Use Realtime Presence (built-in Supabase feature) to track online status; one Presence channel covers all friends with push semantics | At 10+ friends listed; scales to Presence's key limit (10 keys per Presence object on free tier) |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Game move validation client-side only | Any player can play any card at any time (including cards they don't hold, cards that violate lead suit, playing out of turn) | All move validation in a PostgreSQL RPC function that checks: correct player's turn, card is in the player's hand, lead suit follow rule, card legal for current phase |
| RLS disabled on `game_state` or `player_hands` tables | Any authenticated user can read all players' hands (full game data exposed via PostgREST) | Enable RLS on every table. `player_hands` must have a policy: `auth.uid() = player_id`. Use the Supabase Performance Advisor — it flags tables with RLS disabled |
| Invite codes as incrementing integers or short UUIDs | Invite codes are guessable; strangers join private games | Generate invite codes as `nanoid(10)` or `crypto.randomUUID()` on server side. Never client-generated. Set a TTL: expire codes after 24 hours via a `expires_at` column checked in the join RPC |
| Missing `WITH CHECK` on UPDATE policies | Players can update other players' rows (e.g., overwrite someone else's bid) | Every UPDATE RLS policy needs both `USING` (read access) and `WITH CHECK` (write access). The two clauses are not the same — `USING (auth.uid() = player_id)` only controls what rows are visible; `WITH CHECK (auth.uid() = player_id)` controls what can be written |
| Storing sensitive game state in Broadcast messages | Broadcast messages are sent to all channel members by default; hand contents could be leaked | Never Broadcast private hand data. Use Postgres Changes with RLS for private data, or server-side Broadcast via Edge Function that sends targeted messages per player |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible "it's your turn" signal | Players miss their turn; game stalls waiting for an unaware player | Browser push notification (NOTIF-02) + in-app pulsing indicator + sound effect for turn alerts. Show elapsed time on the active player's avatar |
| Bidding interface allows changing bid after submission | Confusion about whether bid is final; race condition if phase transitions during re-bid | Lock the bid UI immediately on submission with a pending state. Only unlock if the server rejects the bid (e.g., validation error). Show "Waiting for others..." after bid is accepted |
| Showing 14 cards in hand on a 375px mobile screen without fan layout | Cards overlap illegibly; touch targets are too small (< 44px) | Use a fan/arc CSS layout with overlap for small screens. Cards fan out on hover/focus. Provide a horizontal scroll fallback for accessibility. Test on iPhone SE viewport (375×667) |
| Game ends abruptly with no summary | Players have no closure; no incentive to replay | Show a post-game score summary screen with per-round breakdown, winner announcement, and "Play Again" button before redirecting to lobby |
| Emoji reactions trigger on every received event | Emoji animations play for every new message, causing distraction during tense trick plays | Throttle emoji display: maximum one emoji animation per player per 3 seconds. Queue excess reactions and show a "+N more" badge |

---

## "Looks Done But Isn't" Checklist

- [ ] **Bidding phase:** Bids are hidden until all players submit — verify by opening two browser tabs and confirming neither shows the other's bid value before full submission
- [ ] **Tigress:** Declaring Tigress as Escape produces no bonus points — verify with a test where Tigress (Escape) is the only card in a trick containing a Pirate
- [ ] **Zero bid scoring:** Round 7 zero-bid failure (player takes 1 trick) = -70 points, not -10 — verify with a scoring unit test
- [ ] **Reconnect state sync:** Closing/reopening the tab mid-trick shows the correct current game state — verify by refreshing during another player's turn
- [ ] **Invite link expiry:** A game invite link generated 25 hours ago is rejected — verify by manually setting `expires_at` in the past and attempting to join
- [ ] **Supabase client singleton:** Opening 3 game tabs in the same browser creates exactly 3 WebSocket connections total, not 6 or 9 — verify in browser devtools Network → WS
- [ ] **RLS on player hands:** Player A cannot fetch Player B's hand via the Supabase client SDK — verify by calling `supabase.from('player_hands').select('*')` from Player A's session and confirming Player B's rows are absent
- [ ] **Project keep-alive:** After 6 days of no activity, the app still loads without a 30-second cold start — verify by deliberately leaving the project idle and checking Supabase dashboard project status

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Project paused due to inactivity | LOW | Manually unpause from Supabase dashboard; add keep-alive cron; no data is lost |
| Client state divergence in production | MEDIUM | Add a "Sync Game State" button that re-fetches from DB; implement the reconnect fetch handler (no deploy needed if structured correctly) |
| Scoring bug found post-launch with wrong scores in DB | HIGH | Write a migration script to recompute affected `round_scores` rows using the corrected formula; notify affected users; requires careful data archaeology |
| Supabase 200-connection limit hit | MEDIUM | Audit and fix client singleton pattern (same-day fix); consider upgrading to Pro ($25/mo) if organic growth is hitting the ceiling |
| RLS misconfiguration exposing hands | HIGH | Immediately add the correct RLS policy (minutes to deploy); audit logs to determine if any hand data was accessed by unauthorized users; rotate game invite codes as a precaution |
| Tigress mode not persisted, game history incorrect | HIGH | Add `declared_mode` column with a migration; backfill historical games as "unknown" mode (cannot reconstruct); correct formula for future games |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Project pauses on inactivity | Infrastructure / Deployment | Supabase dashboard shows project active after 6-day idle; keep-alive cron visible in GitHub Actions |
| Bid reveal race condition | Game Engine — Bidding mechanic | Two-client integration test: neither sees bids before `phase = bid_locked` |
| Client state divergence after reconnect | Game Engine — Real-time subscriptions | Simulate disconnect mid-trick; confirm state re-syncs on reconnect without page reload |
| Tigress dual-mode bug | Game Engine — Card ranking & trick resolution | Unit test: Tigress(Escape) loses to all, no bonus; Tigress(Pirate) beats suited cards, earns bonuses |
| Bonus points conditional on correct bid | Game Engine — Scoring | Unit test: failed bid with Mermaid-captures-Skull-King bonus = 0 bonus points applied |
| Zero-bid round multiplier | Game Engine — Scoring | Unit test: round 10 zero-bid success = +100; round 10 zero-bid failure = -100 |
| Postgres Changes RLS fan-out | Game Engine — Real-time architecture | Load test: 8 clients in a game; measure trick-play event delivery latency < 200ms |
| Multiple Supabase client instances | Project scaffold | devtools WS count = 1 per tab; add to PR checklist |
| Client-side move validation only | Game Engine — Move submission RPC | Attempt to play a card not in hand via direct `supabase.from('plays').insert(...)` call; confirm RPC rejects it |
| Avatar storage filling up | Auth / Profile phase | Client-side image resize before upload; verify uploaded file < 100KB |
| Anonymous user data loss on account conversion | Auth phase | Integration test: guest plays game, converts to account, game history rows reassigned to permanent user ID |
| Invite code guessability | Lobby / Matchmaking phase | Confirm invite codes are generated server-side with `nanoid(10)` and have `expires_at` TTL |

---

## Sources

- Supabase Realtime Limits (official): https://supabase.com/docs/guides/realtime/limits
- Supabase Free Tier Pause Behavior: https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263
- Supabase Realtime Best Practices Discussion: https://github.com/orgs/supabase/discussions/21995
- Supabase Realtime Concurrent Connections Quota: https://supabase.com/docs/guides/troubleshooting/realtime-concurrent-peak-connections-quota-jdDqcp
- Supabase Postgres Changes vs Broadcast (official performance notes): https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase Anonymous Auth conversion: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase RLS Best Practices: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- Supabase silent disconnection (background tabs): https://github.com/supabase/realtime-js/issues/121
- Supabase irrecoverable client after tab suspension: https://github.com/supabase/supabase/issues/36046
- Skull King official rules and edge cases: https://www.grandpabecksgames.com/pages/skull-king
- Skull King BGA implementation rules reference: https://en.doc.boardgamearena.com/Gamehelpskullking
- Supabase SERIALIZABLE isolation for race conditions: https://github.com/orgs/supabase/discussions/30334
- Game state synchronization and conflict resolution patterns: https://oneuptime.com/blog/post/2026-02-06-instrument-game-state-sync-opentelemetry/view
- Supabase Storage upload limits: https://supabase.com/docs/guides/storage/uploads/file-limits

---
*Pitfalls research for: Real-time multiplayer web card game (Skull King) — React 19 + Supabase free tier*
*Researched: 2026-05-17*
