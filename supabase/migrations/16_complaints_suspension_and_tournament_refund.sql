-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — COMPLAINTS, USER SUSPENSION & TOURNAMENT REFUND
-- Migration 16: User Complaints Dispute Box, Account Suspension/Unsuspend & Auto Tournament Cancellation Refund
-- ====================================================================

-- 1. ADD SUSPENSION COLUMNS TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);


-- 2. CREATE USER_COMPLAINTS TABLE (অভিযোগ বক্স)
CREATE TABLE IF NOT EXISTS public.user_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tournament' CHECK (category IN ('tournament', 'room_issue', 'cheating_report', 'wallet', 'other')),
  reported_user_id TEXT,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  status_bn TEXT DEFAULT 'অপেক্ষমাণ',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_complaints_user_id ON public.user_complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_user_complaints_status ON public.user_complaints(status);
CREATE INDEX IF NOT EXISTS idx_user_complaints_category ON public.user_complaints(category);
CREATE INDEX IF NOT EXISTS idx_user_complaints_created_at ON public.user_complaints(created_at DESC);


-- 3. ROW LEVEL SECURITY (RLS) FOR USER_COMPLAINTS
ALTER TABLE public.user_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Complaints user select policy" ON public.user_complaints;
DROP POLICY IF EXISTS "Complaints user insert policy" ON public.user_complaints;
DROP POLICY IF EXISTS "Complaints admin update policy" ON public.user_complaints;
DROP POLICY IF EXISTS "Complaints admin delete policy" ON public.user_complaints;

-- Users can view their own complaints, Admins can view all
CREATE POLICY "Complaints user select policy" ON public.user_complaints
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.can_access_admin_panel()
  );

-- Users can submit their own complaints
CREATE POLICY "Complaints user insert policy" ON public.user_complaints
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Admins can update complaints status & notes
CREATE POLICY "Complaints admin update policy" ON public.user_complaints
  FOR UPDATE USING (
    public.can_access_admin_panel()
  );

-- Admins can delete complaints if necessary
CREATE POLICY "Complaints admin delete policy" ON public.user_complaints
  FOR DELETE USING (
    public.can_access_admin_panel()
  );


-- 4. RPC: SUSPEND / BAN USER (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.suspend_user(
  _target_user_id UUID,
  _reason TEXT DEFAULT 'নীতিমালা লঙ্ঘনের কারণে স্থগিত'
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_target_is_super BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.can_access_admin_panel() THEN
    RAISE EXCEPTION 'কেবলমাত্র অ্যাডমিন এই কাজটি সম্পাদন করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  -- Protection: Cannot suspend a Super Admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = 'super_admin'
  ) INTO v_target_is_super;

  IF v_target_is_super THEN
    RAISE EXCEPTION 'Super Admin অ্যাকাউন্টকে সাসপেন্ড করা যাবে না।' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET
    is_suspended = TRUE,
    suspension_reason = COALESCE(_reason, 'নীতিমালা লঙ্ঘনের কারণে স্থগিত'),
    suspended_at = now(),
    suspended_by = v_caller_id,
    updated_at = now()
  WHERE id = _target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ইউজারকে সফলভাবে প্ল্যাটফর্ম থেকে সাময়িকভাবে সাসপেন্ড / ব্যান করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 5. RPC: UNSUSPEND / UNBAN / RESTORE USER (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.unsuspend_user(
  _target_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.can_access_admin_panel() THEN
    RAISE EXCEPTION 'কেবলমাত্র অ্যাডমিন এই কাজটি সম্পাদন করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET
    is_suspended = FALSE,
    suspension_reason = NULL,
    suspended_at = NULL,
    suspended_by = NULL,
    updated_at = now()
  WHERE id = _target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ইউজারের সাসপেনশন সফলভাবে প্রত্যাহার করা হয়েছে এবং অ্যাকাউন্ট সক্রিয় করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 6. RPC: CANCEL TOURNAMENT AND 100% REFUND ENTRY FEES (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.cancel_tournament_and_refund(
  _tournament_id UUID,
  _cancellation_reason TEXT DEFAULT 'পর্যাপ্ত স্লট পূরণ না হওয়ায় টুর্নামেন্ট বাতিল ও ১০০% ফি রিফান্ড করা হয়েছে।'
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_tourney RECORD;
  v_reg RECORD;
  v_wallet_id UUID;
  v_refunded_count INTEGER := 0;
  v_total_refunded NUMERIC(12, 2) := 0.00;
  v_ref_id TEXT;
  v_reason TEXT;
BEGIN
  -- 1. Check Admin Permission
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.can_access_admin_panel() THEN
    RAISE EXCEPTION 'কেবলমাত্র অ্যাডমিন টুর্নামেন্ট বাতিল ও রিফান্ড করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  v_reason := COALESCE(_cancellation_reason, 'স্লট অপূর্ণতার কারণে টুর্নামেন্ট বাতিল ও রিফান্ড সম্পন্ন');

  -- 2. Fetch Tournament
  SELECT * INTO v_tourney
  FROM public.tournaments
  WHERE id = _tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'টুর্নামেন্টটি খুঁজে পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_tourney.status = 'completed' THEN
    RAISE EXCEPTION 'সম্পন্ন হওয়া টুর্নামেন্ট বাতিল করা সম্ভব নয়।' USING ERRCODE = '22000';
  END IF;

  -- 3. Loop through all registered participants
  FOR v_reg IN
    SELECT id, user_id
    FROM public.tournament_registrations
    WHERE tournament_id = _tournament_id
      AND status = 'registered'
    FOR UPDATE
  LOOP
    -- If there was an entry fee > 0, refund to wallet
    IF v_tourney.entry_fee > 0 THEN
      -- Find user wallet
      SELECT id INTO v_wallet_id
      FROM public.wallets
      WHERE user_id = v_reg.user_id
      FOR UPDATE;

      -- If wallet exists, credit balance and create transaction
      IF v_wallet_id IS NOT NULL THEN
        UPDATE public.wallets
        SET
          balance = balance + v_tourney.entry_fee,
          updated_at = now()
        WHERE id = v_wallet_id;

        -- Generate unique refund reference ID
        v_ref_id := 'REF-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

        INSERT INTO public.wallet_transactions (
          wallet_id,
          user_id,
          type,
          type_bn,
          amount,
          method,
          ref_id,
          status,
          status_bn,
          created_at,
          completed_at
        ) VALUES (
          v_wallet_id,
          v_reg.user_id,
          'refund',
          'টুর্নামেন্ট ফি রিফান্ড',
          v_tourney.entry_fee,
          'ওয়ালেট রিফান্ড',
          v_ref_id,
          'completed',
          'সম্পন্ন',
          now(),
          now()
        );

        v_refunded_count := v_refunded_count + 1;
        v_total_refunded := v_total_refunded + v_tourney.entry_fee;
      END IF;
    END IF;

    -- Update registration status to refunded
    UPDATE public.tournament_registrations
    SET
      status = 'refunded',
      updated_at = now()
    WHERE id = v_reg.id;
  END LOOP;

  -- 4. Mark Tournament as Cancelled & Close Room
  UPDATE public.tournaments
  SET
    status = 'cancelled',
    status_bn = 'বাতিল (রিফান্ডকৃত)',
    room_status = 'closed',
    description_bn = COALESCE(description_bn, '') || E'\n\n[অ্যাডমিন নোট: ' || v_reason || ']',
    updated_at = now()
  WHERE id = _tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'refunded_count', v_refunded_count,
    'total_refunded_amount', v_total_refunded,
    'message', 'টুর্নামেন্ট সফলভাবে বাতিল করা হয়েছে এবং ' || v_refunded_count || ' জন খেলোয়াড়কে মোট ৳' || v_total_refunded || ' রিফান্ড করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 7. RPC: SUBMIT USER COMPLAINT (USER DISPUTE BOX)
CREATE OR REPLACE FUNCTION public.submit_user_complaint(
  _title TEXT,
  _description TEXT,
  _screenshot_url TEXT,
  _category TEXT DEFAULT 'tournament',
  _reported_user_id TEXT DEFAULT NULL,
  _tournament_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_complaint_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'অভিযোগ দাখিল করতে প্রথমে লগইন করুন।' USING ERRCODE = '42501';
  END IF;

  IF trim(COALESCE(_title, '')) = '' THEN
    RAISE EXCEPTION 'অভিযোগের শিরোনাম বা টাইটেল বাধ্যতামূলক।' USING ERRCODE = '22000';
  END IF;

  IF trim(COALESCE(_description, '')) = '' THEN
    RAISE EXCEPTION 'সমস্যার বিস্তারিত বিবরণ বাধ্যতামূলক।' USING ERRCODE = '22000';
  END IF;

  IF trim(COALESCE(_screenshot_url, '')) = '' THEN
    RAISE EXCEPTION 'প্রমাণ হিসেবে স্ক্রিনশট ছবি আপলোড করা বাধ্যতামূলক।' USING ERRCODE = '22000';
  END IF;

  INSERT INTO public.user_complaints (
    user_id,
    title,
    description,
    screenshot_url,
    category,
    reported_user_id,
    tournament_id,
    status,
    status_bn,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    trim(_title),
    trim(_description),
    trim(_screenshot_url),
    COALESCE(_category, 'tournament'),
    nullif(trim(_reported_user_id), ''),
    _tournament_id,
    'pending',
    'অপেক্ষমাণ',
    now(),
    now()
  ) RETURNING id INTO v_complaint_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_complaint_id,
    'message', 'আপনার অভিযোগটি সফলভাবে জমা নেওয়া হয়েছে! অ্যাডমিন প্যানেল শীঘ্রই এটি পর্যালোচনা করবে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 8. RPC: UPDATE COMPLAINT STATUS (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.update_complaint_status(
  _complaint_id UUID,
  _status TEXT,
  _admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_status_bn TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.can_access_admin_panel() THEN
    RAISE EXCEPTION 'কেবলমাত্র অ্যাডমিন অভিযোগের অবস্থা হালনাগাদ করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  v_status_bn := CASE _status
    WHEN 'pending' THEN 'অপেক্ষমাণ'
    WHEN 'in_progress' THEN 'তদন্ত/প্রক্রিয়াধীন'
    WHEN 'resolved' THEN 'সমাধানকৃত'
    WHEN 'rejected' THEN 'বাতিলকৃত'
    ELSE 'অপেক্ষমাণ'
  END;

  UPDATE public.user_complaints
  SET
    status = _status,
    status_bn = v_status_bn,
    admin_notes = COALESCE(_admin_notes, admin_notes),
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = _complaint_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'অভিযোগের স্ট্যাটাস সফলভাবে হালনাগাদ করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
