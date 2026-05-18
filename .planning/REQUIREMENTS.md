# Requirements: Skull King Online

**Defined:** 2026-05-18
**Core Value:** Friends can play Skull King online together in real-time, exactly as the physical game works, from any browser.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: User can sign in with Google OAuth
- [ ] **AUTH-06**: User can play as a guest (anonymous) without creating an account
- [ ] **AUTH-07**: Guest user can convert to a permanent account, retaining their game history

### Profile

- [ ] **PROF-01**: User can set a unique username
- [ ] **PROF-02**: User can set an avatar (upload photo or use auto-generated initials)
- [ ] **PROF-03**: User can view their stats: games played, win rate, best single-game score
- [ ] **PROF-04**: User can view their match history (last 20 games with scores and opponents)
- [ ] **PROF-05**: User can view another player's public profile

### Game Engine

- [ ] **GAME-01**: Deck contains all standard cards: Parrot/green (1–14), Treasure Chest/yellow (1–14), Pirate Map/purple (1–14), Jolly Roger/black 1–14), 5 Pirates, 1 Tigress, 1 Skull King, 2 Mermaids, 5 Escapes
- [ ] **GAME-02**: Game plays over 10 rounds; each round deals N cards equal to the round number (1 card in round 1, 10 in round 10)
- [ ] **GAME-03**: Bidding phase: all players simultaneously reveal bids (Yo-ho-ho mechanic)
- [ ] **GAME-04**: Playing phase: players follow lead suit when a suited card leads; special cards may be played at any time
- [ ] **GAME-05**: Trick resolution enforces correct card ranking: Escape < Suited (any non-trump) < Trump/Black < Pirate < Skull King; Mermaids beat Skull King; Tigress declared as Pirate or Escape on play; first-played wins ties at equal rank
- [ ] **GAME-06**: Scoring: correct bid = 20 pts × tricks taken; incorrect bid = −10 pts × difference; zero bid success = 10 pts × cards dealt that round; zero bid failure = −10 pts × cards dealt that round
- [ ] **GAME-07**: Bonus points awarded if player bid correctly: #14 standard suit = +10 pts; #14 black = +20 pts; Mermaid captures Pirate = +20 pts; Pirate captures by Skull King = +30 pts; Skull King captured by Mermaid = +40 pts
- [ ] **GAME-08**: 2–8 player support; round 9 and 10 cap at 8 cards per player when playing with 8 players
- [ ] **GAME-09**: Variable card count modes: Even Keeled (2/4/6/8/10), Skip to the Brawl (6/7/8/9/10), Swift-n-Salty (5 rounds of 5), Broadside Barrage (10 rounds of 10), Whirlpool (9/7/5/3/1), Past Your Bedtime (1 round of 1)
- [ ] **GAME-10**: Turn timer: each player has a configurable time limit per card play (default 60s); auto-skip on expiry
- [ ] **GAME-11**: Reconnect: player can rejoin an in-progress game after disconnect without forfeiting

### Lobby

- [ ] **LOBBY-01**: Authenticated user can create a private game room with a shareable 6-character invite code and link
- [ ] **LOBBY-02**: User can join a private room by entering an invite code
- [ ] **LOBBY-03**: User can browse and join public games (open matchmaking)
- [ ] **LOBBY-04**: Host can configure game settings: max players, card mode, turn timer duration
- [ ] **LOBBY-05**: Players can set ready status in the lobby; host can start the game once all players are ready

### Game UX

- [ ] **UX-01**: Simultaneous bid reveal animation — all bid tokens flip at once on "Yo-ho-ho" reveal
- [ ] **UX-02**: Card play animations: deal to hand, play to table, winner collects trick
- [ ] **UX-03**: Live scoresheet panel visible throughout the game, updated after each round
- [ ] **UX-04**: Post-game summary screen showing final scores, round breakdown, and a "Play Again" button
- [ ] **UX-05**: Sound effects: sea ambient, card play SFX, coin clink on scoring, Skull King capture sound; all mutable

### Chat & Emoji

- [ ] **CHAT-01**: Lobby chat available before game starts
- [ ] **CHAT-02**: In-round chat available during gameplay
- [ ] **CHAT-03**: Quick emoji reactions available in chat (pirate-themed emoji set)
- [ ] **CHAT-04**: Direct messages between friends (outside of games)
- [ ] **CHAT-05**: Post-game recap/reactions feed after each completed game

### Friends

- [ ] **SOC-01**: User can search for other players by username
- [ ] **SOC-02**: User can send, receive, and accept/decline friend requests
- [ ] **SOC-03**: User can see friends' real-time online / in-game status
- [ ] **SOC-04**: User can directly invite a friend to a game from their friend list
- [ ] **SOC-05**: User can generate and share a friend invite link

### Leaderboard

- [ ] **LB-01**: Global all-time leaderboard ranked by cumulative score
- [ ] **LB-02**: Global leaderboard ranked by win rate (with minimum games played threshold)
- [ ] **LB-03**: Friends-only leaderboard (filtered to friends)
- [ ] **LB-04**: Weekly leaderboard with automatic Sunday midnight reset

### Notifications

- [ ] **NOTIF-01**: In-app notification bell for: friend requests received, game invites, your turn during a game
- [ ] **NOTIF-02**: Browser push notifications (with permission prompt after first game) for: your turn, friend invite to game

---

## v2 Requirements

### Advanced Cards

- **ADV-01**: Loot cards (2) with advanced rules behavior
- **ADV-02**: Kraken card (1) with advanced rules behavior
- **ADV-03**: White Whale card (1) with advanced rules behavior

### Social

- **SOC-V2-01**: Spectator mode — friends can watch an in-progress game
- **SOC-V2-02**: Achievement badges (e.g. "Skull King Slayer" for taking SK with a Mermaid)

### Competitive

- **COMP-01**: Season-based competitive ladder with ranks

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app (iOS/Android native) | Web-first; PWA sufficient for v1 |
| GitHub OAuth | Google OAuth covers need; keep auth scope lean |
| Email notifications | Browser push covers urgency; email adds overhead |
| Spectator mode | Simplifies game state management; deferred to v2 |
| Achievement badges | Not critical for launch; deferred to v2 |
| Tournament / bracket mode | Scope creep; leaderboard satisfies competitive need |
| Voice / video chat | High complexity, not core to card game value |
| Advanced cards (Loot, Kraken, White Whale) | Adds game engine complexity at launch; standard rules first |
| Two-player "Graybeard's ghost" variant | Automated ghost player is complex; deferred |

---

## Traceability

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01–07 | Phase 1 | Pending |
| PROF-01–05 | TBD | Pending |
| GAME-01–11 | TBD | Pending |
| LOBBY-01–05 | TBD | Pending |
| UX-01–05 | TBD | Pending |
| CHAT-01–05 | TBD | Pending |
| SOC-01–05 | TBD | Pending |
| LB-01–04 | TBD | Pending |
| NOTIF-01–02 | TBD | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: TBD (roadmap pending)
- Unmapped: TBD

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after initial definition*
