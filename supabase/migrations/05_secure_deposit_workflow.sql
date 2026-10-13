-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — SECURE DEPOSIT WORKFLOW & ATOMIC CREDIT
-- Migration 05: Deposit Requests Table, RLS, & Atomic Wallet Credit RPC
-- ====================================================================

-- 1. Deposit Requests Table
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.admin_payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  sender_number TEXT NOT NULL,
  trx_id TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Database-level Unique Constraint preventing duplicate Transaction IDs per provider
  CONSTRAINT unique_provider_trx_id UNIQUE (payment_provider, trx_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests(status);


-- 2. ROW LEVEL SECURITY (RLS) FOR DEPOSIT REQUESTS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- Users can read ONLY their own deposit requests; Payment admins can read all
CREATE POLICY "Deposit requests select policy" ON public.deposit_requests
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.can_manage_payments()
  );

-- Authenticated users can insert ONLY pending deposit requests for themselves
CREATE POLICY "Deposit requests insert policy" ON public.deposit_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- ORDINARY USERS CANNOT DIRECTLY UPDATE DEPOSIT STATUS OR AMOUNTS!
-- All status updates MUST occur via trusted database RPC functions.
CREATE POLICY "Deposit requests client update block policy" ON public.deposit_requests
  FOR UPDATE USING (public.can_manage_payments());


-- 3. ATOMIC WALLET CREDIT POSTGRESQL RPC FUNCTION
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
  _request_id UUID,
  _admin_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
  v_wallet_id UUID;
  v_ref_id TEXT;
  v_tx_id UUID;
  v_new_balance NUMERIC(12, 2);
BEGIN
  -- 1. Server-side Authorization Check
  IF NOT public.can_manage_payments() THEN
    RAISE EXCEPTION 'আপনার এই কাজটি করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  -- 2. Lock Deposit Request Row FOR UPDATE to prevent race conditions
  SELECT * INTO v_req
  FROM public.deposit_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verify Status is strictly 'pending'
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'এই ডিপোজিট রিকোয়েস্টটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 4. Get and Lock User's Wallet
  SELECT id, balance INTO v_wallet_id, v_new_balance
  FROM public.wallets
  WHERE user_id = v_req.user_id
  FOR UPDATE;

  -- Auto-provision wallet if missing
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, currency, balance, total_won)
    VALUES (v_req.user_id, 'BDT', 0.00, 0.00)
    RETURNING id, balance INTO v_wallet_id, v_new_balance;
  END IF;

  -- 5. Generate Unique Ledger Reference ID
  v_ref_id := 'DEP-' || UPPER(SUBSTRING(REPLACE(_request_id::text, '-', ''), 1, 8));

  -- 6. Create Wallet Transaction Ledger Entry
  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    type_bn,
    amount,
    method,
    account_number,
    ref_id,
    status,
    status_bn,
    created_at,
    completed_at
  )
  VALUES (
    v_wallet_id,
    v_req.user_id,
    'deposit',
    'টাকা জমা (অনুমোদিত)',
    v_req.amount,
    v_req.payment_method_name,
    v_req.sender_number,
    v_ref_id,
    'completed',
    'সম্পন্ন',
    now(),
    now()
  )
  RETURNING id INTO v_tx_id;

  -- 7. Atomically Update Wallet Balance
  UPDATE public.wallets
  SET balance = balance + v_req.amount,
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  -- 8. Mark Deposit Request as Approved
  UPDATE public.deposit_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      wallet_transaction_id = v_tx_id,
      updated_at = now()
  WHERE id = _request_id;

  -- Return Success Result
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ডিপোজিট সফলভাবে অনুমোদিত এবং ওয়ালেটে যোগ করা হয়েছে।',
    'new_balance', v_new_balance,
    'transaction_id', v_tx_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. REJECT DEPOSIT REQUEST POSTGRESQL RPC FUNCTION
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
  _request_id UUID,
  _reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
BEGIN
  -- 1. Server-side Authorization Check
  IF NOT public.can_manage_payments() THEN
    RAISE EXCEPTION 'আপনার এই কাজটি করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  -- 2. Lock Row FOR UPDATE
  SELECT * INTO v_req
  FROM public.deposit_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'এই ডিপোজিট রিকোয়েস্টটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- 3. Mark Request as Rejected (Wallet Balance Unchanged)
  UPDATE public.deposit_requests
  SET status = 'rejected',
      rejection_reason = COALESCE(_reason, 'অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।'),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'ডিপোজিট রিকোয়েস্টটি বাতিল করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
