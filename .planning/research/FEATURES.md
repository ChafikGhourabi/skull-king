# Feature Research

**Domain:** Real-time multiplayer web card game (trick-taking)
**Researched:** 2026-05-17
**Confidence:** HIGH — sourced from Board Game Arena docs, Trickster Cards platform analysis, academic game design research, and community feedback across card game platforms

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete, broken, or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Turn timer with visual countdown | Without it, one player can stall indefinitely; BGA's clock system shows this is universal for real-time play | MEDIUM | Per-turn countdown visible to all; audible tick at <10s; auto-skip on timeout prevents game lock |
| Disconnection detection + grace period | Players on mobile, unstable networks, or accidental tab close expect the game to hold their seat | HIGH | 60–90s reconnect window (per BGA standard); "Player reconnecting..." shown to others; auto-play with best card only as last resort |
| Reconnect-to-active-game | Users who close a tab or refresh expect to land back in the game they left | HIGH | Critical for trust; requires persisted game state and session token recovery |
| Simultaneous bid reveal (Yo-ho-ho) | Core Skull King mechanic; players tap to lock bid, all reveal at once | MEDIUM | Animation of flipping/revealing all bids simultaneously is the defining moment of each round |
| Live scorecard during and after each round | Players track standings; absence makes scoring feel opaque | MEDIUM | Round-by-round breakdown: bid, tricks won, delta score; cumulative total always visible |
| Visual turn indicator | Players must know whose turn it is instantly, at a glance | LOW | Highlighted seat, pulsing border, or animated indicator on the active player |
| Card play validation feedback | Illegal card plays (wrong suit without valid follow card) must be rejected clearly | LOW | Shake animation + tooltip explaining the rule; never silently ignore the tap |
| Card hover / enlarge on focus | Standard in every digital card game; without it players can't read low-res card text | LOW | Hover lifts card above arc with 1.2–1.3x scale; tooltip for special cards (Skull King, Mermaids, Tigress) |
| Fan/arc hand display | Visual convention for card games; flat rows feel unpolished | MEDIUM | Arc layout with rotation per index; non-hoverable opponent hands shown face-down as counts |
| Played trick visible until next trick starts | Players must see what was played; instant clear is disorienting | LOW | Show all played cards for ~2s before sweeping to winner; animate trick collection to winner seat |
| Persistent lobby state | Players who open the invite link before host starts should wait in lobby, not error | LOW | Show "Waiting for host to start" with player slots and ready status |
| Invite code / shareable link | Friends-first game; manual code sharing is the primary flow | LOW | Short alphanumeric code + one-click copy link; both work |
| Guest play (no account required for game) | Friction barrier; PROJECT.md already includes this | MEDIUM | Anonymous Supabase session; stats and social features gated behind registration |
| Error states and loading indicators | Blank screens on slow connections lose users immediately | LOW | Skeleton loaders for lobby/game; toast errors for failed actions; never leave users guessing |
| End-of-game summary screen | Players need closure; without it the game just stops | MEDIUM | Final rankings, per-round score breakdown, winner celebration; "Play Again" and "Back to Lobby" CTAs |
| "Play Again" / Rematch from end screen | Rematch button dramatically increases session length and retention | LOW | Returns players to the same private lobby with same settings; host re-starts |
| Emoji reactions / quick emotes | Universal in card game platforms; replaces voice for remote friends; enables the Skull King "table moments" | LOW | Predefined set (laugh, groan, shocked, celebrate, pirate taunt); anchored to player seat |
| Basic chat in lobby | Players need to coordinate before game starts | LOW | Text chat in the lobby waiting room; ephemeral, not persisted |
| In-round chat | Friends playing together expect to banter during the game | LOW | Collapsible chat panel; does not obstruct the card play area |
| Online/away status for friends | Required for coordinating play sessions | MEDIUM | Real-time presence via Supabase Presence; "Online", "In Game [game name]", "Offline" states |
| Notification bell (in-app) | Friend requests and game invites must surface without full-page navigation | MEDIUM | Badge count on bell icon; dropdown with unread items; mark-all-read |
| Player avatar + username | Players need identity in-game and in the social layer | LOW | Initials fallback is fine for v1; uploaded photo as option |

---

### Differentiators (Competitive Advantage)

Features that set the product apart from a basic implementation. Not universally expected, but significantly elevate perceived quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Faithful pirate theme (dark wood, parchment, gold) | Immersive experience that mirrors the physical game; most online card game platforms look generic | HIGH | Thematic card backs, felt/wood table texture, sound design (sea ambient, coin drop, sword clash); aligns with PROJECT.md design intent |
| Animated bid reveal (simultaneous flip) | Makes the Yo-ho-ho moment feel as dramatic as the physical game | MEDIUM | All bid tokens flip over simultaneously on a count; short stagger animation for reading; gasps of joy at the table |
| Trick resolution animation | Watching the winning card "claim" the trick creates a satisfying micro-moment | MEDIUM | Winning card scales up briefly, other cards slide toward winner; sound cue; not skippable but fast (<1s) |
| Bonus point callout animations | Mermaid-captures-Skull-King (+40pts) is a rare and exciting event; surfacing it creates table moments | MEDIUM | Splash overlay announcing the bonus trigger (e.g., "Mermaid Triumphs! +40 bonus!"); disappears after 2s |
| Friends-only leaderboard | Friends-only ranking is proven to drive more engagement than global rankings; seeing a friend 10pts ahead is motivating | LOW | Filtered view of the global leaderboard; no backend change needed, just filter by friend IDs |
| Weekly leaderboard with reset | Creates recurring urgency; players who would never reach global top feel competitive weekly | LOW | Sunday midnight reset; display "Season X" framing; email or push notification on reset (v1.x) |
| Scorecard delta display per round | Showing +/- per round alongside cumulative makes the score story readable | LOW | "+120" in green, "-30" in red next to each round entry; makes comeback moments legible |
| Tigress declaration UX | The Tigress card requires a declared intent (Pirate or Escape) at play time; poor UX here causes confusion | MEDIUM | On Tigress drag-to-play: modal/popup with two large buttons "Play as Pirate" / "Play as Escape" before committing |
| Variable card mode selector in lobby | Six game modes (Even Keeled, Skip to the Brawl, etc.) are a differentiator vs generic trick-taking | LOW | Host selects mode in lobby settings; tooltip explains each mode; default to standard |
| Post-game recap feed | Quick highlight reel of notable moments (biggest bonus, most tricks won in a round) creates shareable memories | MEDIUM | Auto-generated 3–5 callouts: "Chafik triggered the Skull King capture 3 times"; displayed on end screen |
| Direct messages between friends | Enables "want to play?" coordination without leaving the app | MEDIUM | Thread-per-friendship model; in-app only (no push for DM in v1 to avoid complexity) |
| Match history with score breakdown | Serious players replay past games mentally; history builds investment | MEDIUM | Per-game record: date, players, final scores, winner; tappable to see round-by-round breakdown |
| Browser push notifications | The only way to re-engage users when the tab is closed; "Ali invited you to a game" | HIGH | VAPID-based Web Push via service worker; permission prompt after first game completed (not on load); "Your turn" and "Friend invite" only in v1 |
| Skeleton loading states (themed) | Generic spinners feel cheap; a themed loader (spinning compass, sea waves) stays on-brand during connection | LOW | Single Lottie/CSS animation asset; reused everywhere |
| Keyboard navigation for card play | Accessibility signal; also useful for power users | MEDIUM | Tab through hand, Enter to play selected card; Escape to cancel; announced via ARIA |

---

### Anti-Features (Deliberately NOT Building)

Features that seem good, are often requested, but waste time or create problems for a v1 launch.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Spectator mode | "Let me watch my friends play" is a common ask | Requires separate channel management, permission scoping, and hiding opponent hands from observers — doubles game state complexity; PROJECT.md correctly deferred this | Invite links already allow players to join; defer spectator to v2 when state model is proven |
| Voice chat built-in | Trickster Cards added video chat; players playing remotely want to talk | Requires WebRTC infrastructure, browser permissions, echo cancellation; scope far exceeds value for a friend-group game where Discord already exists | Document in onboarding: "Use Discord or Google Meet while playing"; emoji reactions fill the lightweight expression need |
| Achievement badge system | Common in games; feels rewarding | Requires badge definition, trigger logic, notification for each unlock, badge display on profile; high design + implementation cost for marginal retention gain in a friend-group game | Defer to v2; simple win-count stats on profile fill the "progress" need |
| Full chat moderation / AI toxicity filter | Public matchmaking creates risk of harassment | For v1 with a small player base, automated toxicity tooling is premature; adds a paid API dependency against the $0 budget | Private lobbies are the primary mode; for public matchmaking, add a simple report/block user flag (store in DB) as the entire v1 moderation system |
| Tournament / bracket mode | Competitive players want organized competition | Requires schedule management, bracket logic, result adjudication, and notifications — easily a 2-week feature | Weekly leaderboard with reset covers competitive motivation; brackets in v2 |
| Advanced cards (Loot, Kraken, White Whale) | Hardcore fans of the second edition want all cards | Three new cards each with unique edge-case rule interactions; multiplies game engine test surface | Standard rules only for v1; clean expansion path in v2 |
| Undo / take-back feature | "I mis-clicked" is a real issue | Undo in a turn-based game with other live players is a social contract problem; needs consent from all players; creates disputes | Clear confirmation step on card play for special cards (Tigress, Pirates); mobile users get a "tap to play" confirmation modal |
| Real-time typing indicators in chat | Polished feel from messaging apps | Generates Supabase Realtime events at every keystroke; on free tier with 200 connection limit, this is wasteful channel traffic | Omit; presence and message delivery is sufficient |
| In-game voice / video emotes (animated avatars) | Modern game feel (like Brawl Stars taunts) | Asset creation cost is high; requires animation pipeline; adds bundle weight | Static emoji reactions with a sound cue deliver 80% of the social signal at 5% of the cost |
| Email notifications | "Notify me when my turn" | Requires transactional email provider (SendGrid etc.), template design, unsubscribe management; duplicates browser push | Browser push handles urgency; email notifications in v1.x only if push opt-in rate is below 30% |
| GitHub OAuth | Some devs request it | Marginal user type for this game; Google OAuth covers 95%+ of the casual user base | Google + email/password covers the auth surface |
| Mobile native app | Better mobile experience | Out of scope per PROJECT.md; web-first is correct; PWA via Netlify covers installability | Ensure the responsive layout is excellent; test on iOS Safari and Android Chrome |

---

## Feature Dependencies

```
Auth (email + Google OAuth)
    └──required by──> Friends System (SOCIAL-01 to SOCIAL-05)
    └──required by──> Player Profile (PROFILE-01 to PROFILE-03)
    └──required by──> Leaderboard (LB-01 to LB-04)
    └──required by──> Match History (PROFILE-03)
    └──required by──> DMs (CHAT-04)
    └──required by──> Notifications (NOTIF-01, NOTIF-02)

Core Game Engine (GAME-01 to GAME-11)
    └──required by──> Lobby + Matchmaking (LOBBY-01 to LOBBY-05)
    └──required by──> Bidding UX (simultaneous reveal animation)
    └──required by──> Scoring display (scorecard, delta, bonus callouts)
    └──required by──> Match History (PROFILE-03)

Lobby + Matchmaking
    └──required by──> Friends invite flow (SOCIAL-03)
    └──required by──> Public matchmaking (LOBBY-02)
    └──required by──> Game notifications (NOTIF-01)

Supabase Realtime Presence
    └──required by──> Online status (SOCIAL-04)
    └──required by──> In-game turn sync
    └──required by──> Reconnection detection

Friends System (SOCIAL-01 to SOCIAL-05)
    └──required by──> Friends leaderboard (LB-03)
    └──required by──> DMs (CHAT-04)
    └──required by──> Friend invite to game (SOCIAL-03)

In-app notification bell (NOTIF-01)
    └──enhances──> Friends invite flow (SOCIAL-03)
    └──required by──> Browser push (NOTIF-02) [push is layered on top of in-app]

Browser push (NOTIF-02)
    └──requires──> Service worker registration
    └──requires──> VAPID key setup
    └──enhances──> Turn alerts and friend invites

Post-game summary screen
    └──enhances──> Match History (PROFILE-03)
    └──enhances──> "Play Again" flow
    └──requires──> Core Game Engine (score totals)
```

### Dependency Notes

- **Auth required before Social/Profile/Leaderboard:** All social features assume an authenticated identity. Guest mode gets a session but cannot accumulate stats, friends, or leaderboard entries. Build Auth before any of these.
- **Game engine required before game UX polish:** Animations, bid reveal, bonus callouts — all depend on a working rules engine producing correct game state. Polish features are a second layer.
- **Supabase Presence required for online status:** This is the lowest-level social signal. Must be wired to the auth session and active on login, not just in-game.
- **Browser push requires service worker:** Service worker must be registered and VAPID keys configured before any push notification can be sent. This is infrastructure work, not a UI feature.
- **Friends system required before friends leaderboard and DMs:** The friendship edge (stored in DB) is what filters leaderboard entries and enables private messaging.
- **Post-game screen enhances but does not block match history:** Match history can be stored in DB after game completion without displaying it in the post-game screen. Post-game screen and history view can be built independently.

---

## MVP Definition

### Launch With (v1)

Minimum viable for the core promise: "Friends can play Skull King online together in real-time, exactly as the physical game works, from any browser."

- [ ] Core game engine (all 11 GAME requirements) — without this nothing exists
- [ ] Private lobby with invite code/link (LOBBY-01, LOBBY-03, LOBBY-04) — primary play mode is friends
- [ ] Reconnect to in-progress game (LOBBY-05) — without this, any network hiccup ends the game; trust-breaker
- [ ] Turn timer with visual countdown — without it, one player stalls; unplayable for strangers
- [ ] Simultaneous bid reveal animation — the defining Skull King moment; required for the experience to feel right
- [ ] Live scorecard (GAME-11) — players need to track the game
- [ ] Auth: email + Google OAuth + Guest (AUTH-01 to AUTH-03) — flexible entry
- [ ] Friends: search, request, invite to game, online status (SOCIAL-01 to SOCIAL-04) — social layer that drives retention
- [ ] Lobby + in-round chat (CHAT-01, CHAT-02) — friends playing together need to communicate
- [ ] Emoji reactions (CHAT-03) — lightweight expression; table moments
- [ ] In-app notification bell for invites and friend requests (NOTIF-01) — coordination glue
- [ ] Player profile: username + avatar (PROFILE-01) — identity in-game
- [ ] Global leaderboard + friends leaderboard (LB-01, LB-03) — motivation after the first game
- [ ] End-of-game summary screen with Play Again — session continuity
- [ ] Card hover/enlarge and fan arc hand display — table stakes for card game UX
- [ ] Tigress declaration modal — required for correct rule implementation

### Add After Validation (v1.x)

- [ ] Public matchmaking (LOBBY-02) — add when friend-group play is proven stable; adds matchmaking queue complexity
- [ ] Browser push notifications (NOTIF-02) — add after confirming in-app notifications are used; requires service worker setup
- [ ] Weekly leaderboard with reset (LB-04) — add after there are enough players to make weekly competition meaningful
- [ ] Match history (PROFILE-03) — add once a few games have been played; data is already stored, just needs the view
- [ ] Stats: win rate, best score (PROFILE-02) — depends on match history data
- [ ] Post-game recap feed — add after validating end-screen engagement
- [ ] Direct messages between friends (CHAT-04) — useful once friend network exists

### Future Consideration (v2+)

- [ ] Spectator mode — after game state model is stable and Realtime channel management is proven
- [ ] Advanced cards (Loot, Kraken, White Whale) — second edition rules; clean expansion if engine is well-abstracted
- [ ] Tournament / bracket mode — after leaderboard proves competitive motivation
- [ ] Achievement badges — after core retention loop (leaderboard + match history) is shipped
- [ ] Mobile PWA install prompt — after web experience is proven; add manifest + service worker
- [ ] Variable game mode selector beyond default (GAME-09) — mode variants add lobby config complexity; standard first

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Core game engine (rules, deck, scoring) | HIGH | HIGH | P1 |
| Reconnect to active game | HIGH | HIGH | P1 |
| Turn timer | HIGH | MEDIUM | P1 |
| Simultaneous bid reveal | HIGH | MEDIUM | P1 |
| Private lobby + invite link | HIGH | LOW | P1 |
| Auth (email + Google + guest) | HIGH | LOW | P1 |
| Live scorecard | HIGH | MEDIUM | P1 |
| Fan arc card display + hover | HIGH | MEDIUM | P1 |
| Friends: search, request, invite, status | HIGH | MEDIUM | P1 |
| In-app notification bell | HIGH | MEDIUM | P1 |
| Lobby + in-round chat | MEDIUM | LOW | P1 |
| Emoji reactions | HIGH | LOW | P1 |
| End-of-game summary + Play Again | HIGH | MEDIUM | P1 |
| Pirate theme + animations | HIGH | HIGH | P1 |
| Tigress declaration UX | HIGH | LOW | P1 |
| Global + friends leaderboard | MEDIUM | MEDIUM | P2 |
| Match history view | MEDIUM | MEDIUM | P2 |
| Public matchmaking | MEDIUM | HIGH | P2 |
| Browser push notifications | MEDIUM | HIGH | P2 |
| Weekly leaderboard reset | MEDIUM | LOW | P2 |
| Post-game recap feed | MEDIUM | MEDIUM | P2 |
| Direct messages | LOW | MEDIUM | P2 |
| Player stats (win rate, best score) | MEDIUM | LOW | P2 |
| Variable card mode selector | LOW | LOW | P3 |
| Spectator mode | LOW | HIGH | P3 |
| Advanced cards | MEDIUM | HIGH | P3 |
| Achievement badges | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible after v1 core is stable
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Board Game Arena | Trickster Cards | CardzMania | Skull King Approach |
|---------|-----------------|-----------------|------------|---------------------|
| Turn timer | Full clock with per-turn + total time; negative clock triggers skip; ELO penalty for timeout | Time settings configurable; slower games allowed | Basic timer | Per-turn countdown only; auto-skip on expiry; no ELO system needed (not ranked-first) |
| Reconnection | 90s window; game continues with AI or pauses | Unknown | Unknown | 90s grace period; game pauses in 2-8p real-time game; clear "waiting for X to reconnect" UI |
| Chat | Mandatory; cannot be turned off (user complaint) | Integrated | Minimal | Collapsible panel; off by default during play; quick emotes always visible |
| Lobby / invite | Code + link; public matchmaking | Public + private | Public + private | Private-first (invite code/link); public matchmaking in v1.x |
| Notifications | None (browser-level) | In-app; "next round alerts" added Jan 2026 | None | In-app bell (v1) + browser push (v1.x); permission prompt after first game |
| Social / friends | Full social graph; clubs; ELO history | Clubs; video chat | None | Friends list; online status; invite to game; friends leaderboard |
| Leaderboard | Full ELO ranking; game-specific rankings | Game-specific + chips economy | Weekly cup | Global all-time + win rate + friends + weekly; no ELO in v1 |
| Profile | Full ELO, game stats, achievement badges | Chips balance, game stats | None | Username + avatar + stats + match history |
| Theming | Generic UI; functional | Theme customization options | Plain | Full pirate theme is a core differentiator vs all competitors |
| Post-game | Basic results | Score summary | Basic | Full summary + round breakdown + bonus callouts + Play Again |
| Emotes / reactions | Yes | Unknown | No | Quick emoji reactions (6–8 predefined); sound cue on use |

---

## Game UX Patterns — Card-Specific Details

These are implementation notes for the card game UI layer specifically.

### Hand Display (Arc / Fan)

- Cards arranged in an arc; rotation angle proportional to index from center
- Center card is vertical (0°); leftmost/rightmost cards tilt ±20–30°
- On hover: card lifts 20–30px along the tilt axis, scales to 1.25x, z-index raises above siblings
- Non-playable cards (wrong suit, out-of-turn): dimmed to 50% opacity; cursor shows not-allowed
- Special cards (Skull King, Mermaids, Pirates, Tigress, Escape): on hover, show a tooltip with the card's special ability text
- Opponent hands: shown face-down as a compact fan; card count shown numerically

### Card Play

- Drag to play area OR click/tap to select + confirm (two-tap for accessibility and mobile)
- Played card animates from hand to center table area with a ~200ms ease-out
- Illegal play: card snaps back to hand with shake animation; toast "You must follow [suit]"

### Bid Phase

- Each player's bid token is shown face-down until all players lock in
- Yo-ho-ho reveal: all tokens flip simultaneously with a 300ms flip animation
- After reveal: bid value persists in the player's seat area for the entire trick-taking phase
- First reveal in round 1 should feel celebratory; consider a subtle drum roll sound cue

### Trick Resolution

- Winning card: briefly scales up (1.3x, 200ms), glows, or pulsates
- All cards in the trick then slide toward the winner's seat position (400ms)
- Winner's trick count increments with a +1 number pop-up
- Bonus triggers (Mermaid capture, Skull King capture): overlay callout for 1.5s before clearing

### Scorecard

- Always accessible via persistent tab or slide-out panel
- Shows: round number, cards dealt, bid, tricks won, round score (delta), cumulative total
- Current round row highlighted; past rounds grayed; upcoming rounds shown as dashes
- Delta shown with color: green for positive, red for negative, gray for zero

### Turn Indicator

- Active player's card slot / name area: animated pulsing border in accent color (gold)
- Turn timer shown as a circular countdown inside the player avatar or beneath the name
- At 5s remaining: timer turns red; audible tick (optional, user-controlled)

---

## What Makes Online Card Games Feel "Alive" vs Sterile

Research synthesis from game design literature and platform analysis:

**Sound design is the fastest path from sterile to alive.** Ambient background (sea waves for Skull King), card shuffle on deal, card play "thwack," coin clink for scoring, and a distinct sound for special captures create emotional resonance at minimal implementation cost.

**Micro-animations communicate state.** A card that lifts when hovered, a bid token that flips, a trick that slides to the winner — these are not decorations. They answer the question "what just happened?" without text. Remove them and the game feels like a spreadsheet.

**Emotes are the social glue when text chat is impractical.** Academic research (Arjoranta & Siitonen, 2018) found that emote systems in card games create emergent social vocabulary beyond their designed purpose. Six or eight well-chosen emotes covering celebration, frustration, taunt, and acknowledgment cover 90% of social communication needs.

**Seeing all players' states simultaneously prevents confusion.** Each seat should show: name, avatar, bid (after reveal), trick count, and turn indicator. Players need to orient themselves in under two seconds when returning to the tab.

**Lobby wait time shapes expectations.** Research shows that if a lobby wait exceeds a player's patience without any feedback or activity, they leave and often don't return. For a private game, the "waiting for host" state should show who is present, who hasn't joined yet, and actively encourage the host to start.

**Post-game is the retention hook.** The moments after a game ends are when players decide whether to play again. A final score screen with round breakdown, a winner celebration, and a highly visible "Play Again" button dramatically increase session length. BGA and Trickster Cards both show this pattern.

---

## Sources

- [Board Game Arena Game Clock Documentation](https://en.doc.boardgamearena.com/Game_clock) — turn timer mechanics, clock penalty system, reconnection window (90s standard)
- [Trickster Cards Update History](https://www.trickstercards.com/help/update-history/) — feature evolution pattern; notification granularity; rule customization driven by community feedback
- [Fairtravel Battle Card Game UI Design](https://gdkeys.com/the-card-games-ui-design-of-fairtravel-battle/) — hero corners, card popping elements, board definition, negative space
- [Online Card Game Trends 2024](https://outof.games/news/7609-online-card-game-trends-in-2024-whats-hot-and-whats-not/) — social features as baseline expectation; multiplayer retention data
- [How Leaderboards Impact Player Retention](https://adriancrook.com/how-leaderboards-impact-player-retention/) — friends leaderboard outperforms global; weekly reset mechanics
- [Leaderboard Design Guide — Yu-kai Chou](https://yukaichou.com/gamification-analysis/leaderboard-design-definitive-guide-octalysis/) — short-term + long-term ranking combination
- [Reconnect Ability in Multiplayer Games](https://www.getgud.io/blog/how-to-successfully-create-a-reconnect-ability-in-multiplayer-games/) — session persistence, grace period patterns
- [PWA Push Notifications for Games](https://onesignal.com/blog/push-notifications-messaging-for-game-developers/) — post-first-game permission timing; 9+ session retention for push opt-ins
- [Emote System Design for Online Games](https://mocaponline.com/blogs/mocap-news/emote-system-design-guide) — social vocabulary emergence; emote set design
- [Multiplayer Waiting Lobby UX](https://medium.com/@ahtashamali263/multiplayer-waiting-lobby-e652b82793b5) — lobby as liminal space; engagement during wait
- [Skull King on Board Game Arena](https://en.boardgamearena.com/gamepanel?game=skullking) — reference implementation; established that BGA hosts Skull King with active player base
- [Building Scalable Real-Time Multiplayer Card Games](https://dev.to/krishanvijay/building-scalable-real-time-multiplayer-card-games-3kn6) — WebSocket patterns, state synchronization
- [CSS Card Fan with Arc/Hover](https://medium.com/@leferreyra/first-blog-building-an-interactive-card-fan-with-css-c79c9cd87a14) — fan arc implementation with CSS transforms
- [Emotes in Hearthstone (Academic)](https://gamestudies.org/1802/articles/arjoranta_siitonen) — academic study on emote social function in card games
- [Game Design Patterns in Digital Card Games (TU Wien)](https://repositum.tuwien.at/bitstream/20.500.12708/2993/2/Steinboeck%20Matthias%20-%202017%20-%20Game%20design%20patterns%20in%20digital%20card%20games%20a...pdf) — trick patterns, card interaction patterns
- [Kind Games: Prosocial Multiplayer Design](https://polarisgamedesign.com/2022/kind-games-designing-for-prosocial-multiplayer/) — friend-group chat, moderation tradeoffs

---
*Feature research for: Skull King Online — real-time multiplayer web card game*
*Researched: 2026-05-17*
