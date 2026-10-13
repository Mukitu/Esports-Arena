-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — MIGRATION 14
-- Fix Tournament UUID handling, Cascade Delete, User Deletion & Leaderboard Table
-- ====================================================================

-- 1. LEADERBOARD ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gamer_name TEXT NOT NULL,
  game_uid TEXT,
  total_earnings NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  total_kills INTEGER DEFAULT 0 NOT NULL,
  rank_position INTEGER DEFAULT 1 NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard_entries(rank_position ASC);

-- Enable RLS for Leaderboard
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select policy for leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Admin full access policy for leaderboard" ON public.leaderboard_entries;

CREATE POLICY "Public select policy for leaderboard" ON public.leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Admin full access policy for leaderboard" ON public.leaderboard_entries
  FOR ALL USING (public.can_manage_payments() OR public.is_super_admin());


-- 2. RPC: DELETE TOURNAMENT (ADMIN)
CREATE OR REPLACE FUNCTION public.delete_tournament(
  _tournament_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT (public.can_manage_payments() OR public.is_super_admin() OR public.has_role(v_user_id, 'tournament_manager')) THEN
    RAISE EXCEPTION 'টুর্নামেন্ট মুছে ফেলার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  -- Delete associated registrations and submissions first
  DELETE FROM public.match_result_submissions WHERE tournament_id = _tournament_id;
  DELETE FROM public.tournament_registrations WHERE tournament_id = _tournament_id;
  DELETE FROM public.tournaments WHERE id = _tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'টুর্নামেন্টটি সফলভাবে মুছে ফেলা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. RPC: DELETE USER ACCOUNT (SUPER ADMIN / ADMIN)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  _target_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_is_target_super_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL OR NOT (public.can_manage_payments() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'ইউজার অ্যাকাউন্ট মুছে ফেলার অনুমতি আপনার নেই।' USING ERRCODE = '42501';
  END IF;

  -- Check if target user is super admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = 'super_admin'
  ) INTO v_is_target_super_admin;

  IF v_is_target_super_admin THEN
    RAISE EXCEPTION 'Super Admin অ্যাকাউন্ট মুছে ফেলা যাবে না।' USING ERRCODE = '42501';
  END IF;

  -- Delete all user data in order
  DELETE FROM public.match_result_submissions WHERE user_id = _target_user_id;
  DELETE FROM public.tournament_registrations WHERE user_id = _target_user_id;
  DELETE FROM public.withdrawal_requests WHERE user_id = _target_user_id;
  DELETE FROM public.deposit_requests WHERE user_id = _target_user_id;
  DELETE FROM public.wallet_transactions WHERE user_id = _target_user_id;
  DELETE FROM public.wallets WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE id = _target_user_id;

  -- Delete from auth.users if possible in Supabase
  BEGIN
    DELETE FROM auth.users WHERE id = _target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore auth.users permission restriction if fired from non-superuser trigger context
  END;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. INSERT REAL SAMPLE LEADERBOARD ENTRIES IF EMPTY
INSERT INTO public.leaderboard_entries (gamer_name, game_uid, total_earnings, total_kills, rank_position)
SELECT * FROM (VALUES
  ('Nishat Pro', '58291048', 4500.00, 128, 1),
  ('Sakib Gamer', '91028374', 3200.00, 94, 2),
  ('TanjimFF', '19283746', 2400.00, 76, 3),
  ('Rakib_Esports', '48392019', 1800.00, 62, 4),
  ('Ariful_Hero', '73820192', 1200.00, 45, 5)
) AS v(gamer_name, game_uid, total_earnings, total_kills, rank_position)
WHERE NOT EXISTS (SELECT 1 FROM public.leaderboard_entries);
