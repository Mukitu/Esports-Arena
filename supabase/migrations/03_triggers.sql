-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — AUTOMATED PROVISIONING TRIGGERS
-- Migration 03: New User Profile, Wallet & Default Role Creation
-- ====================================================================

-- Trigger Function: Auto-provision profile, wallet, and user role
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'গেমার ' || RIGHT(NEW.id::text, 4)),
    NEW.phone,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Provision Wallet (0.00 BDT)
  INSERT INTO public.wallets (user_id, currency, balance, total_won, created_at)
  VALUES (NEW.id, 'BDT', 0.00, 0.00, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Assign Default Role
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'user', now())
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
