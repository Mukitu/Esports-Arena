import { WithdrawalRequest } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface SubmitWithdrawalParams {
  paymentMethod: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
}

/**
 * Submit a new withdrawal request with immediate atomic balance deduction
 */
export async function submitWithdrawalRequest(
  params: SubmitWithdrawalParams
): Promise<{ success: boolean; messageBn: string; newBalance?: number; requestId?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: `আপনার ৳${params.amount} উইথড্রয়াল রিকোয়েস্ট সফলভাবে সাবমিট করা হয়েছে এবং আপনার অ্যাকাউন্ট থেকে টাকা কেটে নেওয়া হয়েছে (মক মোড)।`,
    };
  }

  const { data, error } = await supabase.rpc('submit_withdrawal_request', {
    _payment_method: params.paymentMethod,
    _account_number: params.accountNumber,
    _account_name: params.accountName || null,
    _amount: params.amount,
  });

  if (error) {
    console.error('Error submitting withdrawal request:', error);
    let errorMsg = 'উইথড্র রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি: ' + (error.message || 'অজানা ত্রুটি');
    if (error.message.includes('পর্যাপ্ত ব্যালেন্স নেই')) {
      errorMsg = 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।';
    } else if (error.message.includes('সর্বনিম্ন উইথড্র')) {
      errorMsg = 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।';
    }
    return {
      success: false,
      messageBn: errorMsg,
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'আপনার উইথড্রয়াল রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে এবং ওয়ালেট থেকে টাকা কেটে নেওয়া হয়েছে।',
    newBalance: data?.new_balance !== undefined ? Number(data.new_balance) : undefined,
    requestId: data?.request_id,
  };
}

/**
 * Fetch Withdrawal Requests for Authenticated User
 */
export async function fetchUserWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user withdrawal requests:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    paymentMethod: item.payment_method,
    accountNumber: item.account_number,
    accountName: item.account_name,
    amount: Number(item.amount),
    status: item.status,
    statusBn: item.status === 'approved' ? 'অনুমোদিত' : item.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ',
    rejectionReason: item.rejection_reason,
    reviewedBy: item.reviewed_by,
    reviewedAt: item.reviewed_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Fetch Withdrawal Requests for Admin Dashboard
 */
export async function fetchAdminWithdrawalRequests(
  statusFilter?: 'all' | 'pending' | 'approved' | 'rejected'
): Promise<WithdrawalRequest[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching admin withdrawal requests:', error);
      return [];
    }

    if (!requests || requests.length === 0) {
      return [];
    }

    // Extract user IDs and fetch profiles separately to avoid PGRST200
    const userIds = Array.from(new Set(requests.map((r: any) => r.user_id).filter(Boolean)));
    const profilesMap: Record<string, { displayName?: string; phone?: string }> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, phone')
        .in('id', userIds);

      (profilesData || []).forEach((p: any) => {
        profilesMap[p.id] = {
          displayName: p.display_name,
          phone: p.phone,
        };
      });
    }

    return requests.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      paymentMethod: item.payment_method,
      accountNumber: item.account_number,
      accountName: item.account_name,
      amount: Number(item.amount),
      status: item.status,
      statusBn: item.status === 'approved' ? 'অনুমোদিত' : item.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ',
      rejectionReason: item.rejection_reason,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userDisplayName: profilesMap[item.user_id]?.displayName || 'গেমার ' + (item.user_id ? item.user_id.slice(-4) : '****'),
      userPhone: profilesMap[item.user_id]?.phone || '',
    }));
  } catch (err) {
    console.error('Unexpected error in fetchAdminWithdrawalRequests:', err);
    return [];
  }
}

/**
 * Approve Withdrawal Request via Server-Side RPC
 */
export async function approveWithdrawalRequestRpc(
  requestId: string,
  adminNote?: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'উইথড্রয়াল সফলভাবে অনুমোদিত হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('approve_withdrawal_request', {
    _request_id: requestId,
    _admin_note: adminNote || null,
  });

  if (error) {
    console.error('Error in approve_withdrawal_request RPC:', error);
    return {
      success: false,
      messageBn: 'উইথড্রয়াল অনুমোদন ব্যর্থ হয়েছে: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'উইথড্রয়াল রিকোয়েস্ট সফলভাবে অনুমোদিত করা হয়েছে।',
  };
}

/**
 * Reject Withdrawal Request via Server-Side RPC (Refunds Balance)
 */
export async function rejectWithdrawalRequestRpc(
  requestId: string,
  reason: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'উইথড্রয়াল রিকোয়েস্টটি বাতিল করে ব্যালেন্স রিফান্ড করা হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('reject_withdrawal_request', {
    _request_id: requestId,
    _reason: reason,
  });

  if (error) {
    console.error('Error in reject_withdrawal_request RPC:', error);
    return {
      success: false,
      messageBn: 'উইথড্রয়াল বাতিল করা সম্ভব হয়নি: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'উইথড্রয়াল বাতিল করে ইউজারের ওয়ালেটে টাকা ফেরত দেয়া হয়েছে।',
  };
}
