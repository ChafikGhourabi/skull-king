-- =============================================================================
-- Skull King Online — SECURITY DEFINER RPC Stubs
-- Migration: 20260518000002_rpc_stubs.sql
-- All game mutation entry points are established here as stubs.
-- Phase 2 fills in the logic. Stubs enforce the RPC-only mutation pattern (D-08, D-16).
-- SECURITY DEFINER: functions run as the postgres role — bypasses RLS for writes.
-- SET search_path = public: prevents search path injection (RESEARCH.md anti-patterns).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- create_game
-- Called by host to create a new game session.
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_game(
  p_max_players int  DEFAULT 8,
  p_card_mode   text DEFAULT 'standard'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_game(int, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- join_game
-- Called by a player to join an existing game via invite code.
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_game(
  p_invite_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_game(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- play_card
-- Called by the active player to play a card during a trick.
-- declared_mode is non-null only when playing the Tigress card (D-17).
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.play_card(
  p_trick_id      uuid,
  p_card_id       text,
  p_declared_mode text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.play_card(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- submit_bid
-- Called by each player to submit their trick bid at the start of a round.
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_bid(
  p_round_id   uuid,
  p_bid_amount int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_bid(uuid, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- resolve_trick
-- Called (by host client) once all players have played a card in a trick.
-- Determines winner, updates trick.winner_user_id and trick.status.
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_trick(
  p_trick_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_trick(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- end_game
-- Called (by host client) after all 10 rounds complete.
-- Persists final scores and transitions game.status to 'finished'.
-- Phase 2 fills in the logic. Stub establishes RPC-only mutation pattern (D-08, D-16).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_game(
  p_game_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object('error', 'not_implemented');
END;
$$;

GRANT EXECUTE ON FUNCTION public.end_game(uuid) TO authenticated;
