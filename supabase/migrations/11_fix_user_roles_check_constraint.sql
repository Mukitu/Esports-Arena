-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — FIX USER ROLES CHECK CONSTRAINT
-- Migration 11: Drop obsolete constraint user_roles_role_check and enforce ('super_admin', 'admin', 'user')
-- ====================================================================

-- 1. DROP OBSOLETE CHECK CONSTRAINT ON USER_ROLES IF PRESENT
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 2. MIGRATE ANY REMAINING OBSOLETE SUB-ADMIN ROLES TO STANDARD 'admin'
UPDATE public.user_roles
SET role = 'admin'
WHERE role IN ('payment_manager', 'tournament_manager', 'project_manager', 'player_manager', 'results_manager', 'support_manager', 'integrity_reviewer');

-- 3. APPLY UPDATED CHECK CONSTRAINT SUPPORTING THREE ROLES ONLY
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('super_admin', 'admin', 'user'));

-- 4. RE-DECLARE SECURE SET_USER_ROLE RPC FUNCTION
CREATE OR REPLACE FUNCTION public.set_user_role(
  _target_user_id UUID,
  _role TEXT,
  _action TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID;
  v_actor_is_super_admin BOOLEAN := FALSE;
  v_actor_is_admin BOOLEAN := FALSE;
  v_target_is_super_admin BOOLEAN := FALSE;
  v_super_admin_count INTEGER;
  v_target_email TEXT;
  v_allowed_roles TEXT[] := ARRAY['super_admin', 'admin', 'user'];
BEGIN
  -- 1. Identify Caller
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'অনুমতি নেই: প্রথমে লগইন করুন।' USING ERRCODE = '42501';
  END IF;

  -- Check Caller Roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_actor_id AND role = 'super_admin'
  ) INTO v_actor_is_super_admin;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_actor_id AND role = 'admin'
  ) INTO v_actor_is_admin;

  -- Operator must be at least Admin or Super Admin
  IF NOT (v_actor_is_super_admin OR v_actor_is_admin) THEN
    RAISE EXCEPTION 'ইউজার রোল পরিবর্তন করার অনুমতি আপনার নেই।' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify Target User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _target_user_id) THEN
    RAISE EXCEPTION 'টার্গেট ইউজার পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = _target_user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = 'super_admin'
  ) INTO v_target_is_super_admin;

  -- 3. Input Validation
  IF NOT (_role = ANY(v_allowed_roles)) THEN
    RAISE EXCEPTION 'অমান্য ভূমিকা প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  IF _action NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'অমান্য একশন প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 4. Safeguard: Admin cannot assign 'super_admin' role
  IF _role = 'super_admin' AND NOT v_actor_is_super_admin THEN
    RAISE EXCEPTION 'কেবলমাত্র Super Admin নতুন Super Admin নিয়োগ করতে পারবেন।' USING ERRCODE = '42501';
  END IF;

  -- 5. Safeguard: Admin cannot demote, modify, or delete a Super Admin
  IF v_target_is_super_admin AND NOT v_actor_is_super_admin THEN
    RAISE EXCEPTION 'Super Admin অ্যাকাউন্টের ভূমিকা পরিবর্তন বা ডিমোট করার অধিকার সাধারণ Admin এর নেই।' USING ERRCODE = '42501';
  END IF;

  -- 6. Safeguard: Protect primary Super Admin and last remaining Super Admin
  IF _action = 'remove' AND _role = 'super_admin' THEN
    IF LOWER(COALESCE(v_target_email, '')) = 'mukituislamnishat@gmail.com' THEN
      RAISE EXCEPTION 'প্রধান Super Admin (mukituislamnishat@gmail.com) এর Super Admin ভূমিকা অপসারণ করা সম্ভব নয়।' USING ERRCODE = '22000';
    END IF;

    SELECT COUNT(*) INTO v_super_admin_count
    FROM public.user_roles
    WHERE role = 'super_admin';

    IF v_super_admin_count <= 1 THEN
      RAISE EXCEPTION 'সিস্টেমের সর্বশেষ Super Admin ভূমিকা মুছে ফেলা সম্ভব নয়।' USING ERRCODE = '22000';
    END IF;
  END IF;

  -- 7. Execute Role Assignment / Removal
  IF _action = 'add' THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (_target_user_id, _role, now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF _action = 'remove' THEN
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id
      AND role = _role;
  END IF;

  -- 8. Audit Logging
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
    'message', 'ইউজারের ভূমিকা সফলভাবে পরিবর্তন করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
