-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — TOURNAMENT MANAGEMENT, ROOM CONTROL & RESULT VERIFICATION
-- Migration 08: Extended Tournament Lifecycle, Result Submissions & Review Audit Logs
-- ====================================================================

-- 1. HELPER FUNCTION: CHECK TOURNAMENT MANAGER PERMISSION
CREATE OR REPLACE FUNCTION public.can_manage_tournaments()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'tournament_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. UPDATE TOURNAMENTS TABLE CONSTRAINTS & COLUMNS
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_status_check
  CHECK (status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed', 'cancelled'));

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS description_bn TEXT,
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS result_submission_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS room_status TEXT DEFAULT 'hidden' CHECK (room_status IN ('hidden', 'released', 'closed')),
  ADD COLUMN IF NOT EXISTS banner_url TEXT;


-- 3. MATCH RESULT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.match_result_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_game_id TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  explanation TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'evidence_requested')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_tournament_user_submission UNIQUE (tournament_id, user_id)
);

-- Indexes for Result Submissions
CREATE INDEX IF NOT EXISTS idx_match_result_subs_tourney ON public.match_result_submissions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_result_subs_user ON public.match_result_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_result_subs_status ON public.match_result_submissions(status);


-- 4. RESULT REVIEWS AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.result_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.match_result_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_result_review_logs_sub ON public.result_review_logs(submission_id);


-- 5. ROW LEVEL SECURITY (RLS) FOR RESULT SUBMISSIONS
ALTER TABLE public.match_result_submissions ENABLE ROW LEVEL SECURITY;

-- Players can view ONLY their own submissions; Tournament Admins can view all
CREATE POLICY "Result submissions select policy" ON public.match_result_submissions
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.can_manage_tournaments()
  );

-- Registered players can insert their result submissions
CREATE POLICY "Result submissions insert policy" ON public.match_result_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tournament_registrations
      WHERE tournament_id = match_result_submissions.tournament_id
        AND user_id = auth.uid()
        AND status = 'registered'
    )
  );

-- Direct client updates to status are blocked (must be updated via review RPC)
CREATE POLICY "Result submissions update block policy" ON public.match_result_submissions
  FOR UPDATE USING (public.can_manage_tournaments());


-- RLS FOR RESULT REVIEW LOGS
ALTER TABLE public.result_review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Result review logs select policy" ON public.result_review_logs
  FOR SELECT USING (public.can_manage_tournaments());

CREATE POLICY "Result review logs write block policy" ON public.result_review_logs
  FOR INSERT WITH CHECK (false);


-- 6. RPC: UPDATE MATCH ROOM CREDENTIALS AND STATUS
CREATE OR REPLACE FUNCTION public.update_match_room_credentials(
  _tournament_id UUID,
  _room_id TEXT,
  _room_password TEXT,
  _room_status TEXT DEFAULT 'released'
)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.can_manage_tournaments() THEN
    RAISE EXCEPTION 'আপনার টুর্নামেন্ট রুম ব্যবস্থাপনা করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  UPDATE public.tournaments
  SET room_id = TRIM(_room_id),
      room_password = TRIM(_room_password),
      room_status = COALESCE(_room_status, 'released'),
      updated_at = now()
  WHERE id = _tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 7. RPC: SUBMIT MATCH RESULT SCREENSHOT
CREATE OR REPLACE FUNCTION public.submit_match_result_screenshot(
  _tournament_id UUID,
  _screenshot_url TEXT,
  _explanation TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_in_game_id TEXT;
  v_deadline TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'রেজাল্ট জমা দিতে প্রথমে লগইন করতে হবে।' USING ERRCODE = '42501';
  END IF;

  -- Verify Registration
  SELECT in_game_id INTO v_in_game_id
  FROM public.tournament_registrations
  WHERE tournament_id = _tournament_id
    AND user_id = v_user_id
    AND status = 'registered';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'আপনি এই টুর্নামেন্টে নিবন্ধিত গেমার নন।' USING ERRCODE = '42501';
  END IF;

  -- Check Submission Deadline if set
  SELECT result_submission_deadline INTO v_deadline
  FROM public.tournaments
  WHERE id = _tournament_id;

  IF v_deadline IS NOT NULL AND now() > v_deadline THEN
    RAISE EXCEPTION 'রেজাল্ট স্ক্রিনশট জমা দেওয়ার নির্ধারিত সময় শেষ হয়ে গেছে।' USING ERRCODE = '22000';
  END IF;

  -- Insert or Update Result Submission
  INSERT INTO public.match_result_submissions (
    tournament_id,
    user_id,
    in_game_id,
    screenshot_url,
    explanation,
    status,
    updated_at
  )
  VALUES (
    _tournament_id,
    v_user_id,
    v_in_game_id,
    TRIM(_screenshot_url),
    TRIM(_explanation),
    'pending',
    now()
  )
  ON CONFLICT (tournament_id, user_id)
  DO UPDATE SET
    screenshot_url = EXCLUDED.screenshot_url,
    explanation = EXCLUDED.explanation,
    status = 'pending',
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ম্যাচ রেজাল্ট স্ক্রিনশট সফলভাবে জমা দেওয়া হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 8. RPC: REVIEW MATCH RESULT SUBMISSION
CREATE OR REPLACE FUNCTION public.review_match_result_submission(
  _submission_id UUID,
  _status TEXT,
  _notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_reviewer_id UUID;
BEGIN
  v_reviewer_id := auth.uid();
  IF v_reviewer_id IS NULL OR NOT public.can_manage_tournaments() THEN
    RAISE EXCEPTION 'রেজাল্ট যাচাই করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  IF _status NOT IN ('approved', 'rejected', 'evidence_requested') THEN
    RAISE EXCEPTION 'অমান্য স্ট্যাটাস প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- Update Submission Status
  UPDATE public.match_result_submissions
  SET status = _status,
      rejection_reason = CASE WHEN _status = 'rejected' THEN _notes ELSE rejection_reason END,
      reviewed_by = v_reviewer_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _submission_id;

  -- Log Review Decision
  INSERT INTO public.result_review_logs (
    submission_id,
    reviewer_id,
    action,
    notes,
    created_at
  )
  VALUES (
    _submission_id,
    v_reviewer_id,
    'RESULT_' || UPPER(_status),
    _notes,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'রেজাল্ট স্ট্যাটাস সফলভাবে হালনাগাদ করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 9. RPC: GET TOURNAMENT ROOM CREDENTIALS (REFINED SECURITY)
CREATE OR REPLACE FUNCTION public.get_tournament_room_credentials(
  _tournament_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_tourney RECORD;
  v_is_registered BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'রুম আইডি দেখতে প্রথমে অ্যাকাউন্টে লগইন করুন।'
    );
  END IF;

  -- Check Admin
  v_is_admin := public.can_manage_tournaments();

  -- Check Registration
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = _tournament_id
      AND user_id = v_user_id
      AND status = 'registered'
  ) INTO v_is_registered;

  IF NOT v_is_registered AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'রুম আইডি এবং পাসওয়ার্ড দেখতে প্রথমে টুর্নামেন্টে যোগদান করতে হবে।'
    );
  END IF;

  SELECT room_id, room_password, room_status, room_id_available_at
  INTO v_tourney
  FROM public.tournaments
  WHERE id = _tournament_id;

  IF NOT v_is_admin AND COALESCE(v_tourney.room_status, 'hidden') <> 'released' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'রুমের তথ্য এখনো আনুষ্ঠানিকভাবে প্রকাশ করা হয়নি।'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', COALESCE(v_tourney.room_id, 'ROOM-883921'),
    'room_password', COALESCE(v_tourney.room_password, '1234'),
    'available_at', COALESCE(v_tourney.room_id_available_at, '১৫ মিনিট আগে'),
    'room_status', v_tourney.room_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
