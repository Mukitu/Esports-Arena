import { DepositRequest } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface SubmitDepositParams {
  paymentMethodId?: string;
  paymentMethodName: string;
  paymentProvider: string;
  amount: number;
  senderNumber: string;
  trxId: string;
  screenshotUrl?: string;
}

/**
 * Submit a new deposit request (Authenticated User)
 */
export async function submitDepositRequest(
  params: SubmitDepositParams
): Promise<{ success: boolean; errorBn?: string; data?: DepositRequest }> {
  if (!isSupabaseConfigured) {
    // Offline simulation response
    const mockRequest: DepositRequest = {
      id: 'dep-' + Date.now().toString().slice(-6),
      userId: 'usr-simulated',
      paymentMethodId: params.paymentMethodId,
      paymentMethodName: params.paymentMethodName,
      paymentProvider: params.paymentProvider,
      amount: params.amount,
      senderNumber: params.senderNumber,
      trxId: params.trxId.toUpperCase(),
      screenshotUrl: params.screenshotUrl,
      status: 'pending',
      statusBn: 'অপেক্ষমাণ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: mockRequest,
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, errorBn: 'ডিপোজিট জমা দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।' };
  }

  const { data, error } = await supabase
    .from('deposit_requests')
    .insert([
      {
        user_id: userData.user.id,
        payment_method_id: params.paymentMethodId || null,
        payment_method_name: params.paymentMethodName,
        payment_provider: params.paymentProvider,
        amount: params.amount,
        sender_number: params.senderNumber,
        trx_id: params.trxId.trim().toUpperCase(),
        screenshot_url: params.screenshotUrl || null,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error submitting deposit request:', error);
    // Duplicate Transaction ID constraint error check
    if (error.code === '23505' || error.message.includes('unique_provider_trx_id')) {
      return {
        success: false,
        errorBn: 'এই Transaction ID আগে জমা দেওয়া হয়েছে। দয়া করে সঠিক TrxID বসান।',
      };
    }
    return {
      success: false,
      errorBn: 'ডিপোজিট রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      userId: data.user_id,
      paymentMethodId: data.payment_method_id,
      paymentMethodName: data.payment_method_name,
      paymentProvider: data.payment_provider,
      amount: Number(data.amount),
      senderNumber: data.sender_number,
      trxId: data.trx_id,
      screenshotUrl: data.screenshot_url,
      status: data.status,
      statusBn: data.status === 'approved' ? 'অনুমোদিত' : data.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ',
      rejectionReason: data.rejection_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Fetch Deposit Requests for Authenticated User
 */
export async function fetchUserDepositRequests(): Promise<DepositRequest[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('deposit_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user deposit requests:', error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    paymentMethodId: item.payment_method_id,
    paymentMethodName: item.payment_method_name,
    paymentProvider: item.payment_provider,
    amount: Number(item.amount),
    senderNumber: item.sender_number,
    trxId: item.trx_id,
    screenshotUrl: item.screenshot_url,
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
 * Fetch Deposit Requests for Payment Admin Dashboard
 */
export async function fetchAdminDepositRequests(
  statusFilter?: 'all' | 'pending' | 'approved' | 'rejected'
): Promise<DepositRequest[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('deposit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching admin deposit requests:', error);
      return [];
    }

    if (!requests || requests.length === 0) {
      return [];
    }

    // Extract unique user IDs and fetch profiles separately to avoid PGRST200 relationship error
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
      paymentMethodId: item.payment_method_id,
      paymentMethodName: item.payment_method_name,
      paymentProvider: item.payment_provider,
      amount: Number(item.amount),
      senderNumber: item.sender_number,
      trxId: item.trx_id,
      screenshotUrl: item.screenshot_url,
      status: item.status,
      statusBn: item.status === 'approved' ? 'অনুমোদিত' : item.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমাণ',
      rejectionReason: item.rejection_reason,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      userDisplayName: profilesMap[item.user_id]?.displayName || 'গেমার ' + (item.user_id ? item.user_id.slice(-4) : '****'),
    }));
  } catch (err) {
    console.error('Unexpected error in fetchAdminDepositRequests:', err);
    return [];
  }
}

/**
 * Approve Deposit Request via Atomic Server-Side RPC
 */
export async function approveDepositRequestRpc(
  requestId: string,
  adminNote?: string
): Promise<{ success: boolean; messageBn: string; newBalance?: number }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'ডিপোজিট সফলভাবে অনুমোদিত হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('approve_deposit_request', {
    _request_id: requestId,
    _admin_note: adminNote || null,
  });

  if (error) {
    console.error('Error in approve_deposit_request RPC:', error);
    return {
      success: false,
      messageBn: 'ডিপোজিট অনুমোদন ব্যর্থ হয়েছে: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ডিপোজিট সফলভাবে অনুমোদিত হয়েছে এবং ওয়ালেটে যোগ করা হয়েছে।',
    newBalance: data?.new_balance ? Number(data.new_balance) : undefined,
  };
}

/**
 * Reject Deposit Request via Server-Side RPC
 */
export async function rejectDepositRequestRpc(
  requestId: string,
  reason: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'ডিপোজিট রিকোয়েস্টটি বাতিল করা হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('reject_deposit_request', {
    _request_id: requestId,
    _reason: reason,
  });

  if (error) {
    console.error('Error in reject_deposit_request RPC:', error);
    return {
      success: false,
      messageBn: 'ডিপোজিট বাতিল করা সম্ভব হয়নি: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ডিপোজিট রিকোয়েস্টটি বাতিল করা হয়েছে।',
  };
}
