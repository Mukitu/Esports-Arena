-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — USER MANAGEMENT & ADMIN AUDIT LOGS
-- Migration 07: Admin Audit Trail, Secure Role Assignment RPC & Analytics Helpers
-- ====================================================================

-- 1. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_role TEXT,
  new_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_user_id);

-- 2. ROW LEVEL SECURITY (RLS) FOR AUDIT LOGS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can view audit logs
CREATE POLICY "Audit logs super admin select policy" ON public.admin_audit_logs
  FOR SELECT USING (public.is_super_admin());

-- Direct client updates/inserts are blocked. Inserts must occur via trusted RPCs.
CREATE POLICY "Audit logs client write block policy" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (false);


-- 3. SECURE MANUAL ROLE ASSIGNMENT / REMOVAL RPC FUNCTION
CREATE OR REPLACE FUNCTION public.set_user_role(
  _target_user_id UUID,
  _role TEXT,
  _action TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID;
  v_super_admin_count INTEGER;
  v_allowed_roles TEXT[] := ARRAY['super_admin', 'payment_manager', 'tournament_manager', 'results_manager', 'integrity_reviewer', 'support_manager', 'user'];
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

  -- 3. Validate Role Input
  IF NOT (_role = ANY(v_allowed_roles)) THEN
    RAISE EXCEPTION 'অমান্য ভূমিকা (Invalid Role) প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 4. Validate Action Input ('add' or 'remove')
  IF _action NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'অমান্য একশন প্রদান করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 5. Protection Safeguard: Prevent removing the last Super Admin
  IF _action = 'remove' AND _role = 'super_admin' THEN
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

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ইউজারের ভূমিকা সফলভাবে হালনাগাদ করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. ANALYTICS METRICS POSTGRESQL RPC FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_analytics()
RETURNS JSONB AS $$
DECLARE
  v_total_users BIGINT;
  v_today_users BIGINT;
  v_yesterday_users BIGINT;
  v_last_7_days_users BIGINT;
  v_this_month_users BIGINT;
  v_prev_month_users BIGINT;
  v_total_tourney_regs BIGINT;
BEGIN
  -- Security Guard
  IF NOT (public.is_super_admin() OR public.can_manage_payments()) THEN
    RAISE EXCEPTION 'অ্যানালিটিক্স দেখার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  -- Total Users
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;

  -- Today (Asia/Dhaka)
  SELECT COUNT(*) INTO v_today_users
  FROM public.profiles
  WHERE (created_at AT TIME ZONE 'Asia/Dhaka')::date = (now() AT TIME ZONE 'Asia/Dhaka')::date;

  -- Yesterday (Asia/Dhaka)
  SELECT COUNT(*) INTO v_yesterday_users
  FROM public.profiles
  WHERE (created_at AT TIME ZONE 'Asia/Dhaka')::date = ((now() AT TIME ZONE 'Asia/Dhaka') - INTERVAL '1 day')::date;

  -- Last 7 Days
  SELECT COUNT(*) INTO v_last_7_days_users
  FROM public.profiles
  WHERE created_at >= (now() - INTERVAL '7 days');

  -- This Month (Asia/Dhaka)
  SELECT COUNT(*) INTO v_this_month_users
  FROM public.profiles
  WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Dhaka') = date_trunc('month', now() AT TIME ZONE 'Asia/Dhaka');

  -- Previous Month (Asia/Dhaka)
  SELECT COUNT(*) INTO v_prev_month_users
  FROM public.profiles
  WHERE date_trunc('month', created_at AT TIME ZONE 'Asia/Dhaka') = date_trunc('month', (now() AT TIME ZONE 'Asia/Dhaka') - INTERVAL '1 month');

  -- Total Tournament Registrations
  SELECT COUNT(*) INTO v_total_tourney_regs FROM public.tournament_registrations;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'today_users', v_today_users,
    'yesterday_users', v_yesterday_users,
    'last_7_days_users', v_last_7_days_users,
    'this_month_users', v_this_month_users,
    'prev_month_users', v_prev_month_users,
    'total_tournament_registrations', v_total_tourney_regs
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
