-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — FIX TOURNAMENT ID UUID TYPE CONSTRAINTS
-- Migration 12: Accept TEXT for _tournament_id in RPCs to prevent 22P02 invalid UUID syntax error
-- ====================================================================

-- 1. DROP EXISTING RPCs TAKING UUID
DROP FUNCTION IF EXISTS public.update_match_room_credentials(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.join_tournament(UUID, TEXT);
DROP FUNCTION IF EXISTS public.submit_match_result_screenshot(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_tournament_room_credentials(UUID);

-- 2. RE-CREATE update_match_room_credentials TAKING TEXT
CREATE OR REPLACE FUNCTION public.update_match_room_credentials(
  _tournament_id TEXT,
  _room_id TEXT,
  _room_password TEXT,
  _room_status TEXT DEFAULT 'released'
)
RETURNS JSONB AS $$
DECLARE
  v_tournament_uuid UUID;
BEGIN
  IF NOT public.can_manage_tournaments() THEN
    RAISE EXCEPTION 'আপনার টুর্নামেন্ট রুম ব্যবস্থাপনা করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  IF _tournament_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_tournament_uuid := _tournament_id::uuid;
    UPDATE public.tournaments
    SET room_id = TRIM(_room_id),
        room_password = TRIM(_room_password),
        room_status = COALESCE(_room_status, 'released'),
        updated_at = now()
    WHERE id = v_tournament_uuid;
  ELSE
    UPDATE public.tournaments
    SET room_id = TRIM(_room_id),
        room_password = TRIM(_room_password),
        room_status = COALESCE(_room_status, 'released'),
        updated_at = now()
    WHERE id::text = _tournament_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RE-CREATE join_tournament TAKING TEXT
CREATE OR REPLACE FUNCTION public.join_tournament(
  _tournament_id TEXT,
  _in_game_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_tourney RECORD;
  v_wallet_id UUID;
  v_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_new_slots INTEGER;
  v_tx_id UUID;
  v_ref_id TEXT;
  v_tournament_uuid UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'টুর্নামেন্টে যোগ দিতে প্রথমে লগইন করতে হবে।' USING ERRCODE = '42501';
  END IF;

  IF _in_game_id IS NULL OR TRIM(_in_game_id) = '' THEN
    RAISE EXCEPTION 'ইন-গেম ইউজার আইডি প্রদান করা বাধ্যতামূলক।' USING ERRCODE = '22000';
  END IF;

  IF _tournament_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_tournament_uuid := _tournament_id::uuid;
    SELECT * INTO v_tourney
    FROM public.tournaments
    WHERE id = v_tournament_uuid
    FOR UPDATE;
  ELSE
    SELECT * INTO v_tourney
    FROM public.tournaments
    WHERE id::text = _tournament_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'টুর্নামেন্টটি পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_tourney.joined_slots >= v_tourney.max_slots THEN
    RAISE EXCEPTION 'টুর্নামেন্টের সব স্লট ইতিমধ্যেই পূর্ণ হয়ে গেছে।' USING ERRCODE = '22000';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = v_tourney.id
      AND user_id = v_user_id
      AND status = 'registered'
  ) THEN
    RAISE EXCEPTION 'আপনি ইতিমধ্যে এই টুর্নামেন্টে অংশগ্রহণ করেছেন।' USING ERRCODE = '23505';
  END IF;

  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, currency, balance, total_won)
    VALUES (v_user_id, 'BDT', 0.00, 0.00)
    RETURNING id, balance INTO v_wallet_id, v_balance;
  END IF;

  IF v_tourney.entry_fee > 0 AND v_balance < v_tourney.entry_fee THEN
    RAISE EXCEPTION 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। টুর্নামেন্টে যোগ দিতে প্রথমে ওয়ালেটে টাকা জমা দিন।' USING ERRCODE = '22000';
  END IF;

  IF v_tourney.entry_fee > 0 THEN
    v_ref_id := 'ENT-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));

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
    )
    VALUES (
      v_wallet_id,
      v_user_id,
      'entry_fee',
      'টুর্নামেন্ট ফি',
      v_tourney.entry_fee,
      'ওয়ালেট ব্যালেন্স',
      v_ref_id,
      'completed',
      'সম্পন্ন',
      now(),
      now()
    )
    RETURNING id INTO v_tx_id;

    UPDATE public.wallets
    SET balance = balance - v_tourney.entry_fee,
        updated_at = now()
    WHERE id = v_wallet_id
    RETURNING balance INTO v_new_balance;
  ELSE
    v_new_balance := v_balance;
  END IF;

  INSERT INTO public.tournament_registrations (
    tournament_id,
    user_id,
    in_game_id,
    status,
    created_at
  )
  VALUES (
    v_tourney.id,
    v_user_id,
    TRIM(_in_game_id),
    'registered',
    now()
  );

  UPDATE public.tournaments
  SET joined_slots = joined_slots + 1,
      updated_at = now()
  WHERE id = v_tourney.id
  RETURNING joined_slots INTO v_new_slots;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন!',
    'new_balance', v_new_balance,
    'joined_slots', v_new_slots
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. RE-CREATE submit_match_result_screenshot TAKING TEXT
CREATE OR REPLACE FUNCTION public.submit_match_result_screenshot(
  _tournament_id TEXT,
  _screenshot_url TEXT,
  _explanation TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_in_game_id TEXT;
  v_deadline TIMESTAMPTZ;
  v_tournament_uuid UUID;
  v_found_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'রেজাল্ট জমা দিতে প্রথমে লগইন করতে হবে।' USING ERRCODE = '42501';
  END IF;

  IF _tournament_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_tournament_uuid := _tournament_id::uuid;
    SELECT id, result_submission_deadline INTO v_found_id, v_deadline
    FROM public.tournaments
    WHERE id = v_tournament_uuid;
  ELSE
    SELECT id, result_submission_deadline INTO v_found_id, v_deadline
    FROM public.tournaments
    WHERE id::text = _tournament_id;
  END IF;

  IF v_found_id IS NULL THEN
    RAISE EXCEPTION 'টুর্নামেন্টটি পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  SELECT in_game_id INTO v_in_game_id
  FROM public.tournament_registrations
  WHERE tournament_id = v_found_id
    AND user_id = v_user_id
    AND status = 'registered';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'আপনি এই টুর্নামেন্টে নিবন্ধিত গেমার নন।' USING ERRCODE = '42501';
  END IF;

  IF v_deadline IS NOT NULL AND now() > v_deadline THEN
    RAISE EXCEPTION 'রেজাল্ট স্ক্রিনশট জমা দেওয়ার নির্ধারিত সময় শেষ হয়ে গেছে।' USING ERRCODE = '22000';
  END IF;

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
    v_found_id,
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

-- 5. RE-CREATE get_tournament_room_credentials TAKING TEXT
CREATE OR REPLACE FUNCTION public.get_tournament_room_credentials(
  _tournament_id TEXT
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

  v_is_admin := public.can_manage_tournaments();

  IF _tournament_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id, room_id, room_password, room_status, room_id_available_at
    INTO v_tourney
    FROM public.tournaments
    WHERE id = _tournament_id::uuid;
  ELSE
    SELECT id, room_id, room_password, room_status, room_id_available_at
    INTO v_tourney
    FROM public.tournaments
    WHERE id::text = _tournament_id;
  END IF;

  IF v_tourney.id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.tournament_registrations
      WHERE tournament_id = v_tourney.id
        AND user_id = v_user_id
        AND status = 'registered'
    ) INTO v_is_registered;
  ELSE
    v_is_registered := false;
  END IF;

  IF NOT v_is_registered AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'রুম আইডি এবং পাসওয়ার্ড দেখতে প্রথমে টুর্নামেন্টে যোগদান করতে হবে।'
    );
  END IF;

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
