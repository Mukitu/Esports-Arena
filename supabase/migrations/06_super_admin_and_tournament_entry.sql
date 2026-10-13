-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — SUPER ADMIN ASSIGNMENT & SECURE TOURNAMENT ENTRY
-- Migration 06: Super Admin Provisioning, Atomic Tournament Join RPC & Room Credentials
-- ====================================================================

-- 1. ADD ROOM CREDENTIALS COLUMNS TO TOURNAMENTS
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS room_id TEXT,
  ADD COLUMN IF NOT EXISTS room_password TEXT;


-- 2. UPDATE SIGNUP TRIGGER TO AUTO-ASSIGN SUPER ADMIN TO mukituislamnishat@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, display_name, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'গেমার ' || RIGHT(NEW.id::text, 4)),
    NEW.phone,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Provision Wallet (0.00 BDT)
  INSERT INTO public.wallets (user_id, currency, balance, total_won, created_at)
  VALUES (NEW.id, 'BDT', 0.00, 0.00, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign Roles
  IF LOWER(COALESCE(NEW.email, '')) = 'mukituislamnishat@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES
      (NEW.id, 'super_admin', now()),
      (NEW.id, 'payment_manager', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (NEW.id, 'user', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Retroactively assign super_admin role to mukituislamnishat@gmail.com if account exists in auth.users
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = 'mukituislamnishat@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (v_user_id, 'super_admin'),
      (v_user_id, 'payment_manager')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;


-- 3. ATOMIC TOURNAMENT JOIN POSTGRESQL RPC FUNCTION
CREATE OR REPLACE FUNCTION public.join_tournament(
  _tournament_id UUID,
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
BEGIN
  -- 1. Check Authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'টুর্নামেন্টে যোগ দিতে প্রথমে লগইন করতে হবে।' USING ERRCODE = '42501';
  END IF;

  IF _in_game_id IS NULL OR TRIM(_in_game_id) = '' THEN
    RAISE EXCEPTION 'ইন-গেম ইউজার আইডি প্রদান করা বাধ্যতামূলক।' USING ERRCODE = '22000';
  END IF;

  -- 2. Lock Tournament Row FOR UPDATE
  SELECT * INTO v_tourney
  FROM public.tournaments
  WHERE id = _tournament_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'টুর্নামেন্টটি পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_tourney.joined_slots >= v_tourney.max_slots THEN
    RAISE EXCEPTION 'টুর্নামেন্টের সব স্লট ইতিমধ্যেই পূর্ণ হয়ে গেছে।' USING ERRCODE = '22000';
  END IF;

  -- 3. Check for Existing Registration
  IF EXISTS (
    SELECT 1 FROM public.tournament_registrations
    WHERE tournament_id = _tournament_id
      AND user_id = v_user_id
      AND status = 'registered'
  ) THEN
    RAISE EXCEPTION 'আপনি ইতিমধ্যে এই টুর্নামেন্টে অংশগ্রহণ করেছেন।' USING ERRCODE = '23505';
  END IF;

  -- 4. Lock User Wallet FOR UPDATE
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Auto-provision wallet if missing
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, currency, balance, total_won)
    VALUES (v_user_id, 'BDT', 0.00, 0.00)
    RETURNING id, balance INTO v_wallet_id, v_balance;
  END IF;

  -- 5. Verify Balance if Entry Fee > 0
  IF v_tourney.entry_fee > 0 AND v_balance < v_tourney.entry_fee THEN
    RAISE EXCEPTION 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। টুর্নামেন্টে যোগ দিতে প্রথমে ওয়ালেটে টাকা জমা দিন।' USING ERRCODE = '22000';
  END IF;

  -- 6. Perform Wallet Deduction & Record Transaction
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

  -- 7. Insert Tournament Registration
  INSERT INTO public.tournament_registrations (
    tournament_id,
    user_id,
    in_game_id,
    status,
    created_at
  )
  VALUES (
    _tournament_id,
    v_user_id,
    TRIM(_in_game_id),
    'registered',
    now()
  );

  -- 8. Increment Tournament Joined Slots
  UPDATE public.tournaments
  SET joined_slots = joined_slots + 1,
      updated_at = now()
  WHERE id = _tournament_id
  RETURNING joined_slots INTO v_new_slots;

  -- Return Success Result
  RETURN jsonb_build_object(
    'success', true,
    'message', 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন!',
    'new_balance', v_new_balance,
    'joined_slots', v_new_slots
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. SECURE ROOM CREDENTIALS RPC FUNCTION
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

  -- Check Admin status
  v_is_admin := public.can_manage_payments() OR public.has_role(v_user_id, 'tournament_manager') OR public.is_super_admin();

  -- Check if user is registered
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

  SELECT room_id, room_password, room_id_available_at
  INTO v_tourney
  FROM public.tournaments
  WHERE id = _tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', COALESCE(v_tourney.room_id, 'ROOM-883921'),
    'room_password', COALESCE(v_tourney.room_password, '1234'),
    'available_at', COALESCE(v_tourney.room_id_available_at, '১৫ মিনিট আগে')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
