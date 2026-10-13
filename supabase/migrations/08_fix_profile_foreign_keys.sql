-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — PROFILE FOREIGN KEY CONSTRAINTS
-- Migration 08: Ensure public.profiles Foreign Keys exist for PostgREST schema joins
-- ====================================================================

-- 1. Ensure Foreign Key from deposit_requests(user_id) to profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_deposit_requests_profiles'
  ) THEN
    ALTER TABLE public.deposit_requests
      ADD CONSTRAINT fk_deposit_requests_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Ensure Foreign Key from match_result_submissions(user_id) to profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_match_result_submissions_profiles'
  ) THEN
    ALTER TABLE public.match_result_submissions
      ADD CONSTRAINT fk_match_result_submissions_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Ensure Foreign Key from tournament_registrations(user_id) to profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_tournament_registrations_profiles'
  ) THEN
    ALTER TABLE public.tournament_registrations
      ADD CONSTRAINT fk_tournament_registrations_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
