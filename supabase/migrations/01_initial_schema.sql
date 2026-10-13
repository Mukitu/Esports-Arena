-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — INITIAL DATABASE SCHEMA MIGRATION
-- Migration 01: Core Entities, Relationships, and Financial Ledger
-- ====================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. User Roles Table (RBAC Authorization)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin',
    'tournament_manager',
    'payment_manager',
    'results_manager',
    'integrity_reviewer',
    'support_manager',
    'user'
  )),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- 3. Games Catalog Table
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  tagline TEXT,
  icon_name TEXT,
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES public.games(id),
  title_bn TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'duo', 'squad')),
  mode_bn TEXT NOT NULL,
  map_bn TEXT NOT NULL,
  entry_fee NUMERIC(12, 2) NOT NULL CHECK (entry_fee >= 0),
  prize_pool NUMERIC(12, 2) NOT NULL CHECK (prize_pool >= 0),
  per_kill_prize NUMERIC(12, 2) CHECK (per_kill_prize >= 0),
  max_slots INTEGER NOT NULL CHECK (max_slots > 0),
  joined_slots INTEGER DEFAULT 0 NOT NULL CHECK (joined_slots >= 0 AND joined_slots <= max_slots),
  start_time TEXT NOT NULL,
  date_formatted TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming' NOT NULL CHECK (status IN ('upcoming', 'live', 'completed')),
  status_bn TEXT NOT NULL,
  featured BOOLEAN DEFAULT false NOT NULL,
  match_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
  prize_distribution JSONB DEFAULT '{}'::jsonb NOT NULL,
  room_id_available_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Admin Payment Methods Configuration Table
CREATE TABLE IF NOT EXISTS public.admin_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('bKash', 'Nagad', 'Rocket', 'Upay')),
  name_bn TEXT NOT NULL,
  account_number TEXT NOT NULL,
  instructions_bn TEXT,
  min_deposit NUMERIC(12, 2) DEFAULT 50.00 NOT NULL CHECK (min_deposit >= 0),
  min_withdraw NUMERIC(12, 2) DEFAULT 100.00 NOT NULL CHECK (min_withdraw >= 0),
  enabled BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Wallet Account Foundation
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'BDT' NOT NULL,
  balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  total_won NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (total_won >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Wallet Transaction Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'entry_fee', 'prize_payout', 'refund', 'adjustment')),
  type_bn TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method TEXT,
  account_number TEXT,
  ref_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  status_bn TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 8. Tournament Registrations Table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_game_id TEXT NOT NULL,
  status TEXT DEFAULT 'registered' NOT NULL CHECK (status IN ('registered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tournament_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game_id ON public.tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
