-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — EMAIL AUTH, UNIFIED ADMIN ROLES & WITHDRAWAL PROFILE
-- Migration 09: Withdrawal Settings, Unified Admin Roles & Payment Configuration Security
-- ====================================================================

-- 1. ADD WITHDRAWAL PROFILE COLUMNS TO PUBLIC.PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_account_number TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_account_name TEXT;

-- 2. HELPER FUNCTIONS FOR UNIFIED PERMISSIONS
CREATE OR REPLACE FUNCTION public.can_access_admin_panel()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'payment_manager', 'tournament_manager', 'results_manager', 'support_manager', 'integrity_reviewer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function strictly for Payment Method Configurations (bKash/Nagad/Rocket settings)
CREATE OR REPLACE FUNCTION public.can_configure_payment_methods()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function for Tournament Operations (Super Admin, Admin, Tournament Manager)
CREATE OR REPLACE FUNCTION public.can_manage_tournaments()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'tournament_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function for General Payment Verifications & Deposits (Super Admin, Admin, Payment Manager)
CREATE OR REPLACE FUNCTION public.can_manage_payments()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'payment_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. UPDATE RLS ON ADMIN_PAYMENT_METHODS
ALTER TABLE public.admin_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins select payment methods policy" ON public.admin_payment_methods;
DROP POLICY IF EXISTS "Super admin write payment methods policy" ON public.admin_payment_methods;
DROP POLICY IF EXISTS "Public select active payment methods policy" ON public.admin_payment_methods;

-- Public can view enabled payment methods
CREATE POLICY "Public select active payment methods policy" ON public.admin_payment_methods
  FOR SELECT USING (enabled = true OR public.can_access_admin_panel());

-- ONLY Super Admin can Insert, Update, Delete Payment Method Configurations
CREATE POLICY "Super admin insert payment methods policy" ON public.admin_payment_methods
  FOR INSERT WITH CHECK (public.can_configure_payment_methods());

CREATE POLICY "Super admin update payment methods policy" ON public.admin_payment_methods
  FOR UPDATE USING (public.can_configure_payment_methods())
  WITH CHECK (public.can_configure_payment_methods());

CREATE POLICY "Super admin delete payment methods policy" ON public.admin_payment_methods
  FOR DELETE USING (public.can_configure_payment_methods());

-- 4. UPDATE SET_USER_ROLE RPC TO SUPPORT 'admin' AND PROTECT SUPER ADMINS
CREATE OR REPLACE FUNCTION public.set_user_role(
  _target_user_id UUID,
  _role TEXT,
  _action TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID;
  v_super_admin_count INTEGER;
  v_target_email TEXT;
  v_allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'payment_manager', 'tournament_manager', 'results_manager', 'integrity_reviewer', 'support_manager', 'user'];
BEGIN
  -- 1. Verify Caller Authentication & Super Admin Role
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'কেবল Super Admin এই ভূমিকা পরিবর্তন করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify Target User Existence
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'টার্গেট ইউজার পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  -- Get target user email
  SELECT email INTO v_target_email FROM auth.users WHERE id = _target_user_id;

  -- 3. Validate Role Input
  IF NOT (_role = ANY(v_allowed_roles)) THEN
    RAISE EXCEPTION 'অমান্য ভূমিকা (Invalid Role) প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 4. Validate Action Input ('add' or 'remove')
  IF _action NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'অমান্য একশন প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 5. Safeguard: Prevent removing super_admin from primary Super Admin email
  IF _action = 'remove' AND _role = 'super_admin' THEN
    IF LOWER(COALESCE(v_target_email, '')) = 'mukituislamnishat@gmail.com' THEN
      RAISE EXCEPTION 'প্রধান Super Admin (mukituislamnishat@gmail.com) এর Super Admin ভূমিকা অপসারণ করা সম্ভব নয়।' USING ERRCODE = '22000';
    END IF;

    SELECT COUNT(*) INTO v_super_admin_count
    FROM public.user_roles
    WHERE role = 'super_admin';

    IF v_super_admin_count <= 1 THEN
      RAISE EXCEPTION 'সিস্টেমের সর্বশেষ Super Admin ভূমিকা মুছে ফেলা সম্ভব নয়।' USING ERRCODE = '22000';
    END IF;
  END IF;

  -- 6. Perform Role Assignment or Removal
  IF _action = 'add' THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (_target_user_id, _role, now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF _action = 'remove' THEN
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id
      AND role = _role;
  END IF;

  -- 7. Record Audit Log Transaction
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    INSERT INTO public.admin_audit_logs (
      actor_id,
      target_user_id,
      action,
      new_role,
      created_at
    )
    VALUES (
      v_actor_id,
      _target_user_id,
      'ROLE_' || UPPER(_action),
      _role,
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ইউজারের ভূমিকা সফলভাবে হালনাগad করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC: SAVE / UPDATE USER WITHDRAWAL PROFILE
CREATE OR REPLACE FUNCTION public.update_user_withdrawal_profile(
  _method TEXT,
  _account_number TEXT,
  _account_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'প্রোফাইল আপডেট করতে প্রথমে লগইন করুন।' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET withdrawal_method = TRIM(_method),
      withdrawal_account_number = TRIM(_account_number),
      withdrawal_account_name = TRIM(_account_name),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'উইথড্রয়াল প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
