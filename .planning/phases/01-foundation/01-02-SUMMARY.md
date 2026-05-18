---
phase: 01-foundation
plan: "02"
subsystem: database
tags: [schema, rls, rpc, supabase, postgresql, migrations]
dependency_graph:
  requires: []
  provides:
    - "8-table game schema in Supabase PostgreSQL"
    - "RLS on all 8 tables — client reads own rows only"
    - "SECURITY DEFINER RPC stubs — mutation entry points locked"
    - "trick_cards.declared_mode column for Tigress card"
    - "Denormalized game_id on tricks/trick_cards/bids/scores for efficient RLS joins"
  affects:
    - "01-03 (auth screens — Supabase project must be initialized)"
    - "01-04 (Supabase client setup — uses tables established here)"
    - "Phase 2 (game engine — fills in RPC stub logic)"
tech_stack:
  added: []
  patterns:
    - "SECURITY DEFINER RPCs for all game mutations (D-08, D-16)"
    - "(select auth.uid()) in all RLS USING clauses — query-plan caching (T-1-04)"
    - "game_id denormalized on child tables for O(1) RLS existence checks"
    - "SET search_path = public on every SECURITY DEFINER function — injection prevention"
key_files:
  created:
    - supabase/migrations/20260518000001_initial_schema.sql
    - supabase/migrations/20260518000002_rpc_stubs.sql
  modified: []
decisions:
  - "profiles allows FOR UPDATE directly from client (self-service username/avatar); all game tables have SELECT-only RLS"
  - "bids RLS is own-row-only until Phase 4 bid reveal RPC wires the broadcast reveal event"
  - "play_card RPC accepts p_declared_mode as DEFAULT NULL — only non-null for Tigress card plays"
metrics:
  duration: "15 minutes"
  completed: "2026-05-18"
  tasks_completed: 1
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 1 Plan 02: Database Schema + RPC Stubs Summary

**One-liner:** PostgreSQL schema with 8 game tables (full RLS), 6 SECURITY DEFINER mutation stubs, and Tigress declared_mode column — ready for `supabase db push`.

## What Was Built

Two SQL migration files establishing the complete Skull King database foundation:

**Migration 1 — `20260518000001_initial_schema.sql`:** All 8 game tables with RLS enabled on every table. All mutation policies (INSERT/UPDATE/DELETE) are intentionally absent on game tables — mutations reserved for SECURITY DEFINER RPCs (D-08, D-16). The only mutation policy is `profiles: users update own row` (self-service profile updates). All USING clauses use `(select auth.uid())` for query-plan caching.

**Migration 2 — `20260518000002_rpc_stubs.sql`:** 6 SECURITY DEFINER stub functions (`create_game`, `join_game`, `play_card`, `submit_bid`, `resolve_trick`, `end_game`). Every stub: returns `not_implemented`, has `SET search_path = public`, grants EXECUTE to `authenticated`. Phase 2 fills in game logic without changing function signatures.

## Tasks Completed

| Task | Status | Commit | Files |
|------|--------|--------|-------|
| 1: Write SQL migration files | DONE | b6063b1 | supabase/migrations/20260518000001_initial_schema.sql, supabase/migrations/20260518000002_rpc_stubs.sql |
| 2: Push schema to Supabase | BLOCKED — awaiting human action | — | — |

## Checkpoint Reached

**Task 2** is a `checkpoint:human-action` (gate=blocking). The migration files are written and committed. The user must run `supabase db push` to apply them to the live Supabase project.

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| ENABLE ROW LEVEL SECURITY count | 8 | 8 | PASS |
| SET search_path = public (in functions) | 6 | 6 | PASS |
| declared_mode column present | >= 1 | 1 | PASS |
| (select auth.uid()) in USING clauses | >= 8 | 10 | PASS |
| All 8 tables created | 8 | 8 | PASS |
| All 6 RPC stubs created | 6 | 6 | PASS |
| GRANT EXECUTE to authenticated | 6 | 6 | PASS |
| not_implemented in all stubs | 6 | 6 | PASS |
| No game table mutation policies | 0 | 0 | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The single `FOR UPDATE` policy on `profiles` is intentional and specified in the plan: "RLS: policy 'profiles: users update own row' — FOR UPDATE USING `(select auth.uid()) = user_id`". The plan explicitly restricts only game table mutations to RPCs.

## Self-Check: PASSED

- supabase/migrations/20260518000001_initial_schema.sql: EXISTS
- supabase/migrations/20260518000002_rpc_stubs.sql: EXISTS
- Commit b6063b1: EXISTS (verified via git log)
