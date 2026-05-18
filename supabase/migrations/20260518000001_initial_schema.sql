-- =============================================================================
-- Skull King Online — Initial Schema
-- Migration: 20260518000001_initial_schema.sql
-- Tables: profiles, games, game_players, rounds, tricks, trick_cards, bids, scores
-- All game mutations are reserved for SECURITY DEFINER RPCs (D-08, D-16).
-- No direct INSERT/UPDATE/DELETE policies are created here.
-- RLS USING clauses always use (select auth.uid()) for query-plan caching (T-1-04).
--
-- NOTE: All tables are created first, then RLS is enabled and policies are added.
-- This avoids forward-reference errors (e.g. games policy referencing game_players).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE DEFINITIONS
-- ---------------------------------------------------------------------------

-- PROFILES: One row per auth.users entry.
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        UNIQUE,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_user_id_idx ON public.profiles USING btree (user_id);

-- GAMES: One row per game session.
CREATE TABLE public.games (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id     uuid        NOT NULL REFERENCES auth.users(id),
  status      text        NOT NULL DEFAULT 'waiting',
  card_mode   text        NOT NULL DEFAULT 'standard',
  max_players int         NOT NULL DEFAULT 8 CHECK (max_players BETWEEN 2 AND 8),
  invite_code text        UNIQUE,
  is_public   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX games_host_id_idx     ON public.games (host_id);
CREATE INDEX games_invite_code_idx ON public.games (invite_code);

-- GAME_PLAYERS: Membership — links a user to a game with seat and host flag.
CREATE TABLE public.game_players (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    uuid        NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id),
  seat_order int         NOT NULL,
  is_host    boolean     NOT NULL DEFAULT false,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

CREATE INDEX game_players_game_id_idx ON public.game_players (game_id);
CREATE INDEX game_players_user_id_idx ON public.game_players (user_id);

-- ROUNDS: One round per game (1-10). cards_dealt equals the round number.
CREATE TABLE public.rounds (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      uuid        NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  round_number int         NOT NULL CHECK (round_number BETWEEN 1 AND 10),
  cards_dealt  int         NOT NULL,
  status       text        NOT NULL DEFAULT 'bidding',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, round_number)
);

CREATE INDEX rounds_game_id_idx ON public.rounds (game_id);

-- TRICKS: One trick per round. game_id denormalized for efficient RLS joins.
CREATE TABLE public.tricks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id       uuid        NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  game_id        uuid        NOT NULL REFERENCES public.games(id),
  trick_number   int         NOT NULL,
  winner_user_id uuid        REFERENCES auth.users(id),
  status         text        NOT NULL DEFAULT 'open',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tricks_round_id_idx ON public.tricks (round_id);
CREATE INDEX tricks_game_id_idx  ON public.tricks (game_id);

-- TRICK_CARDS: One card played per trick per user.
-- declared_mode: Tigress-specific declaration (D-17). NULL for all other cards.
CREATE TABLE public.trick_cards (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id      uuid        NOT NULL REFERENCES public.tricks(id) ON DELETE CASCADE,
  game_id       uuid        NOT NULL REFERENCES public.games(id),
  user_id       uuid        NOT NULL REFERENCES auth.users(id),
  card_id       text        NOT NULL,
  declared_mode text        CHECK (declared_mode IN ('pirate', 'escape')),
  play_order    int         NOT NULL,
  played_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trick_cards_trick_id_idx ON public.trick_cards (trick_id);
CREATE INDEX trick_cards_game_id_idx  ON public.trick_cards (game_id);
CREATE INDEX trick_cards_user_id_idx  ON public.trick_cards (user_id);

-- BIDS: One bid per player per round.
CREATE TABLE public.bids (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     uuid        NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  game_id      uuid        NOT NULL REFERENCES public.games(id),
  user_id      uuid        NOT NULL REFERENCES auth.users(id),
  bid_amount   int         NOT NULL CHECK (bid_amount >= 0),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, user_id)
);

CREATE INDEX bids_round_id_idx ON public.bids (round_id);
CREATE INDEX bids_user_id_idx  ON public.bids (user_id);

-- SCORES: Round score per player. game_id denormalized for efficient RLS joins.
CREATE TABLE public.scores (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     uuid        NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  game_id      uuid        NOT NULL REFERENCES public.games(id),
  user_id      uuid        NOT NULL REFERENCES auth.users(id),
  bid          int         NOT NULL,
  tricks_taken int         NOT NULL DEFAULT 0,
  points       int         NOT NULL DEFAULT 0,
  bonus_points int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, user_id)
);

CREATE INDEX scores_round_id_idx ON public.scores (round_id);
CREATE INDEX scores_game_id_idx  ON public.scores (game_id);
CREATE INDEX scores_user_id_idx  ON public.scores (user_id);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY — enable on all tables, then add policies
-- All tables exist at this point so cross-table USING clauses are safe.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tricks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trick_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores      ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles: users read own row"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "profiles: users update own row"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- GAMES policies
-- game_players exists at this point, so the EXISTS subquery is valid.
CREATE POLICY "games: players in game can read"
  ON public.games FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players
      WHERE game_players.game_id = games.id
        AND game_players.user_id = (select auth.uid())
    )
  );

-- GAME_PLAYERS policies
CREATE POLICY "game_players: player sees own row"
  ON public.game_players FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ROUNDS policies
CREATE POLICY "rounds: player in game can read"
  ON public.rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players
      WHERE game_players.game_id = rounds.game_id
        AND game_players.user_id = (select auth.uid())
    )
  );

-- TRICKS policies
CREATE POLICY "tricks: player in game can read"
  ON public.tricks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players
      WHERE game_players.game_id = tricks.game_id
        AND game_players.user_id = (select auth.uid())
    )
  );

-- TRICK_CARDS policies
CREATE POLICY "trick_cards: player in game can read"
  ON public.trick_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players
      WHERE game_players.game_id = trick_cards.game_id
        AND game_players.user_id = (select auth.uid())
    )
  );

-- BIDS policies
-- Players can only read their own bid until the bid reveal RPC fires (Phase 4).
CREATE POLICY "bids: player reads own bid"
  ON public.bids FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- SCORES policies
CREATE POLICY "scores: player in game can read"
  ON public.scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.game_players
      WHERE game_players.game_id = scores.game_id
        AND game_players.user_id = (select auth.uid())
    )
  );
