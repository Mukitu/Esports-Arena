-- ====================================================================
-- DIGANTA ARENA (দিগন্ত অ্যারেনা) — WITHDRAWAL WORKFLOW & TOURNAMENT DEDUCTION
-- Migration 13: Withdrawal Requests Table, Immediate Balance Deduction, Refund on Reject & Admin Approval
-- ====================================================================

-- 1. CREATE WITHDRAWAL_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 50.00),
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- ROW LEVEL SECURITY FOR WITHDRAWAL_REQUESTS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Withdrawal requests select policy" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Withdrawal requests client update block policy" ON public.withdrawal_requests;

CREATE POLICY "Withdrawal requests select policy" ON public.withdrawal_requests
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.can_manage_payments()
  );

CREATE POLICY "Withdrawal requests client update block policy" ON public.withdrawal_requests
  FOR UPDATE USING (public.can_manage_payments());


-- 2. RPC: SUBMIT WITHDRAWAL REQUEST (ATOMIC IMMEDIATE BALANCE DEDUCTION ON SUBMIT)
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  _payment_method TEXT,
  _account_number TEXT,
  _account_name TEXT DEFAULT NULL,
  _amount NUMERIC DEFAULT 50.00
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_wallet_id UUID;
  v_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_req_id UUID;
  v_tx_id UUID;
  v_ref_id TEXT;
BEGIN
  -- 1. Check Auth
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'উইথড্র রিকোয়েস্ট করতে প্রথমে অ্যাকাউন্টে লগইন করুন।' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate Inputs
  IF _amount IS NULL OR _amount < 50.00 THEN
    RAISE EXCEPTION 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।' USING ERRCODE = '22000';
  END IF;

  IF _account_number IS NULL OR TRIM(_account_number) = '' THEN
    RAISE EXCEPTION 'অনুগ্রহ করে অ্যাকাউন্ট/মোবাইল নম্বর প্রদান করুন।' USING ERRCODE = '22000';
  END IF;

  -- 3. Lock User Wallet FOR UPDATE
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ওয়ালেট পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  -- 4. Check Balance
  IF v_balance < _amount THEN
    RAISE EXCEPTION 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳%' , v_balance USING ERRCODE = '22000';
  END IF;

  -- 5. Deduct Balance Immediately
  v_new_balance := v_balance - _amount;
  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- 6. Generate Reference ID & Record Wallet Transaction
  v_ref_id := 'WTH-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));

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
    created_at
  )
  VALUES (
    v_wallet_id,
    v_user_id,
    'withdraw',
    'উইথড্র রিকোয়েস্ট',
    _amount,
    TRIM(_payment_method),
    TRIM(_account_number),
    v_ref_id,
    'pending',
    'অপেক্ষমাণ',
    now()
  )
  RETURNING id INTO v_tx_id;

  -- 7. Create Withdrawal Request
  INSERT INTO public.withdrawal_requests (
    user_id,
    payment_method,
    account_number,
    account_name,
    amount,
    status,
    wallet_transaction_id,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    TRIM(_payment_method),
    TRIM(_account_number),
    TRIM(_account_name),
    _amount,
    'pending',
    v_tx_id,
    now(),
    now()
  )
  RETURNING id INTO v_req_id;

  -- Save profile preference automatically
  UPDATE public.profiles
  SET withdrawal_method = TRIM(_payment_method),
      withdrawal_account_number = TRIM(_account_number),
      withdrawal_account_name = TRIM(_account_name),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'আপনার ৳' || _amount || ' উইথড্রয়াল রিকোয়েস্ট পর্যালোচনার জন্য জমা হয়েছে এবং ওয়ালেট থেকে টাকা কেটে নেওয়া হয়েছে।',
    'new_balance', v_new_balance,
    'request_id', v_req_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. RPC: APPROVE WITHDRAWAL REQUEST (ADMIN)
CREATE OR REPLACE FUNCTION public.approve_withdrawal_request(
  _request_id UUID,
  _admin_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
BEGIN
  IF NOT public.can_manage_payments() THEN
    RAISE EXCEPTION 'আপনার উইথড্রয়াল অনুমোদন করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_req
  FROM public.withdrawal_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'উইথড্রয়াল রিকোয়েস্ট পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'এই উইথড্রয়াল রিকোয়েস্টটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- Update request status
  UPDATE public.withdrawal_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;

  -- Update transaction status
  IF v_req.wallet_transaction_id IS NOT NULL THEN
    UPDATE public.wallet_transactions
    SET status = 'completed',
        status_bn = 'সম্পন্ন',
        completed_at = now()
    WHERE id = v_req.wallet_transaction_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'উইথড্রয়াল রিকোয়েস্ট সফলভাবে অনুমোদিত করা হয়েছে।'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 4. RPC: REJECT WITHDRAWAL REQUEST (REFUNDS BALANCE BACK TO USER WALLET)
CREATE OR REPLACE FUNCTION public.reject_withdrawal_request(
  _request_id UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
  v_wallet_id UUID;
  v_new_balance NUMERIC(12, 2);
  v_refund_tx_id UUID;
  v_ref_id TEXT;
BEGIN
  IF NOT public.can_manage_payments() THEN
    RAISE EXCEPTION 'আপনার উইথড্রয়াল বাতিল করার অনুমতি নেই।' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_req
  FROM public.withdrawal_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'উইথড্রয়াল রিকোয়েস্ট পাওয়া যায়নি।' USING ERRCODE = 'P0002';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'এই উইথড্রয়াল রিকোয়েস্টটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।' USING ERRCODE = '22000';
  END IF;

  -- Lock user wallet
  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE user_id = v_req.user_id
  FOR UPDATE;

  -- Refund Balance back
  UPDATE public.wallets
  SET balance = balance + v_req.amount,
      updated_at = now()
  WHERE id = v_wallet_id
  RETURNING balance INTO v_new_balance;

  -- Create Refund Transaction Ledger Entry
  v_ref_id := 'RFD-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));

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
    v_req.user_id,
    'deposit',
    'উইথড্র রিফান্ড (বাতিল)',
    v_req.amount,
    v_req.payment_method,
    v_ref_id,
    'completed',
    'সম্পন্ন',
    now(),
    now()
  );

  -- Mark Request as Rejected
  UPDATE public.withdrawal_requests
  SET status = 'rejected',
      rejection_reason = COALESCE(_reason, 'অ্যাডমিন কর্তৃক বাতিল ও রিফান্ড করা হয়েছে।'),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id;

  -- Update original pending transaction if exists
  IF v_req.wallet_transaction_id IS NOT NULL THEN
    UPDATE public.wallet_transactions
    SET status = 'rejected',
        status_bn = 'বাতিল (রিফান্ডড)'
    WHERE id = v_req.wallet_transaction_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'উইথড্রয়াল রিকোয়েস্ট বাতিল করা হয়েছে এবং ইউজারের ওয়ালেটে ৳' || v_req.amount || ' রিফান্ড করা হয়েছে।',
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
