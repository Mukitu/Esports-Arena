-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — ADMIN AUTHORIZATION HELPERS
-- Migration 04: Role Inspection Functions & Admin Authorization
-- ====================================================================

-- Function to check if the current user has payment_manager or super_admin permissions
CREATE OR REPLACE FUNCTION public.can_manage_payments()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'payment_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to return current user's roles
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE (role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role FROM public.user_roles ur
  WHERE ur.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- BOOTSTRAP INSTRUCTIONS FOR INITIAL SUPER ADMIN PROVISIONING:
-- To assign an existing authenticated user as Super Admin, run the following SQL
-- in your Supabase SQL Editor replacing 'TARGET_USER_ID' with the user's UUID:
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('TARGET_USER_ID', 'super_admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
-- ====================================================================
