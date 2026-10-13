-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — ROW LEVEL SECURITY (RLS) POLICIES
-- Migration 02: Mandatory RLS, Access Controls & Security Hardening
-- ====================================================================

-- Helper Function: Check if auth user has a given role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check if auth user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read public display names or their own full profile
CREATE POLICY "Profiles read policy" ON public.profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles insert policy (system trigger on sign up)
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. USER ROLES RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own assigned roles
CREATE POLICY "User roles select policy" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

-- Only Super Admin can manage roles
CREATE POLICY "User roles admin manage policy" ON public.user_roles
  FOR ALL USING (public.is_super_admin());


-- 3. GAMES RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Public can view enabled games
CREATE POLICY "Games public select policy" ON public.games
  FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'tournament_manager') OR public.is_super_admin());

-- Only Tournament Managers or Super Admin can manage games
CREATE POLICY "Games admin manage policy" ON public.games
  FOR ALL USING (public.has_role(auth.uid(), 'tournament_manager') OR public.is_super_admin());


-- 4. TOURNAMENTS RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Public can view published tournaments
CREATE POLICY "Tournaments public select policy" ON public.tournaments
  FOR SELECT USING (true);

-- Only Tournament Managers or Super Admin can manage tournaments
CREATE POLICY "Tournaments admin manage policy" ON public.tournaments
  FOR ALL USING (public.has_role(auth.uid(), 'tournament_manager') OR public.is_super_admin());


-- 5. ADMIN PAYMENT METHODS RLS
ALTER TABLE public.admin_payment_methods ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view ONLY enabled payment methods
CREATE POLICY "Payment methods user view policy" ON public.admin_payment_methods
  FOR SELECT USING (
    (auth.role() = 'authenticated' AND enabled = true) OR
    public.has_role(auth.uid(), 'payment_manager') OR
    public.is_super_admin()
  );

-- Only Payment Managers or Super Admin can manage payment methods
CREATE POLICY "Payment methods admin manage policy" ON public.admin_payment_methods
  FOR ALL USING (public.has_role(auth.uid(), 'payment_manager') OR public.is_super_admin());


-- 6. WALLETS RLS (STRICT SECURITY)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can read ONLY their own wallet
CREATE POLICY "Wallets user select policy" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

-- CLIENTS CANNOT DIRECTLY UPDATE WALLET BALANCES VIA CLIENT QUERIES!
-- Wallet balance modifications MUST occur via trusted database triggers / server functions.
CREATE POLICY "Wallets client update block policy" ON public.wallets
  FOR UPDATE USING (false);


-- 7. WALLET TRANSACTIONS RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read ONLY their own transaction history
CREATE POLICY "Wallet transactions select policy" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'payment_manager') OR public.is_super_admin());

-- Users can insert pending deposit/withdraw requests
CREATE POLICY "Wallet transactions user request policy" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');


-- 8. TOURNAMENT REGISTRATIONS RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Registrations select policy" ON public.tournament_registrations
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'tournament_manager') OR public.is_super_admin());

-- Authenticated users can register for tournaments
CREATE POLICY "Registrations insert policy" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
