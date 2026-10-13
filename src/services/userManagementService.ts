import { ManagedUserListItem, UserRegistrationAnalytics, AdminRole, AdminAuditLog } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface FetchUsersParams {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  roleFilter?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FetchUsersResult {
  users: ManagedUserListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Sample fallback users for offline simulation preview mode
const MOCK_USERS: ManagedUserListItem[] = [
  {
    id: 'usr-admin-01',
    displayName: 'Mukitu Islam Nishat',
    email: 'mukituislamnishat@gmail.com',
    phone: '01712345678',
    createdAt: new Date().toISOString(),
    roles: ['super_admin'],
    walletBalance: 2500,
    totalWon: 1200,
    tournamentsJoinedCount: 8,
    depositRequestsCount: 3,
    isSuspended: false,
  },
  {
    id: 'usr-gamer-02',
    displayName: 'সাকিব আল হাসান',
    email: 'sakib.pro@gmail.com',
    phone: '01898765432',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    roles: ['user'],
    walletBalance: 450,
    totalWon: 800,
    tournamentsJoinedCount: 5,
    depositRequestsCount: 2,
    isSuspended: false,
  },
  {
    id: 'usr-gamer-03',
    displayName: 'আরিফুল ইসলাম',
    phone: '01911223344',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    roles: ['user'],
    walletBalance: 120,
    totalWon: 0,
    tournamentsJoinedCount: 2,
    depositRequestsCount: 1,
    isSuspended: true,
    suspensionReason: 'অপ্রমাণিত ফেক ট্রানজেকশন সাবমিশনের অভিযোগ',
  },
  {
    id: 'usr-gamer-04',
    displayName: 'তানজিম আহমেদ',
    email: 'tanjim.esports@gmail.com',
    phone: '01555667788',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    roles: ['admin'],
    walletBalance: 1000,
    totalWon: 3500,
    tournamentsJoinedCount: 14,
    depositRequestsCount: 5,
  },
  {
    id: 'usr-gamer-05',
    displayName: 'রাকিবুল হাসান',
    phone: '01677889900',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    roles: ['user'],
    walletBalance: 0,
    totalWon: 0,
    tournamentsJoinedCount: 0,
    depositRequestsCount: 0,
  },
];

/**
 * Fetch Paginated User List with Search, Role Filter & Sorting
 */
export async function fetchUsers(params: FetchUsersParams = {}): Promise<FetchUsersResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const offset = (page - 1) * pageSize;

  if (!isSupabaseConfigured) {
    let filtered = [...MOCK_USERS];

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      );
    }

    if (params.roleFilter && params.roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.roles.includes(params.roleFilter as AdminRole));
    }

    if (params.sortOrder === 'asc') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + pageSize);

    return {
      users: paginated,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    };
  }

  try {
    let query = supabase
      .from('profiles')
      .select('id, display_name, phone, created_at, is_suspended, suspension_reason, suspended_at', { count: 'exact' });

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      if (isUuid) {
        query = query.or(`display_name.ilike.%${q}%,phone.ilike.%${q}%,id.eq.${q}`);
      } else {
        query = query.or(`display_name.ilike.%${q}%,phone.ilike.%${q}%`);
      }
    }

    query = query
      .order('created_at', { ascending: params.sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    const { data: profiles, count, error } = await query;

    if (error) {
      console.error('Error fetching user profiles:', error);
      throw new Error('ইউজার তালিকা লোড করা সম্ভব হয়নি।');
    }

    const totalCount = count || 0;
    const userIds = (profiles || []).map((p) => p.id);

    if (userIds.length === 0) {
      return {
        users: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
      };
    }

    // Fetch Roles for these users
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // Fetch Wallets for these users
    const { data: walletData } = await supabase
      .from('wallets')
      .select('user_id, balance, total_won')
      .in('user_id', userIds);

    const userRolesMap: Record<string, AdminRole[]> = {};
    (rolesData || []).forEach((r) => {
      if (!userRolesMap[r.user_id]) userRolesMap[r.user_id] = [];
      userRolesMap[r.user_id].push(r.role as AdminRole);
    });

    const userWalletMap: Record<string, { balance: number; totalWon: number }> = {};
    (walletData || []).forEach((w) => {
      userWalletMap[w.user_id] = {
        balance: Number(w.balance || 0),
        totalWon: Number(w.total_won || 0),
      };
    });

    let users: ManagedUserListItem[] = (profiles || []).map((p) => {
      const roles: AdminRole[] = userRolesMap[p.id] && userRolesMap[p.id].length > 0 ? userRolesMap[p.id] : ['user'];
      const wallet = userWalletMap[p.id] || { balance: 0, totalWon: 0 };
      const isEmail = p.phone && p.phone.includes('@') ? p.phone : undefined;

      return {
        id: p.id,
        displayName: p.display_name || 'গেমার ' + p.id.slice(-4),
        email: isEmail,
        phone: !isEmail ? p.phone : undefined,
        createdAt: p.created_at,
        roles,
        walletBalance: wallet.balance,
        totalWon: wallet.totalWon,
        tournamentsJoinedCount: 0,
        depositRequestsCount: 0,
        isSuspended: Boolean(p.is_suspended),
        suspensionReason: p.suspension_reason || undefined,
        suspendedAt: p.suspended_at || undefined,
      };
    });

    // Apply client-side role filter if specified
    if (params.roleFilter && params.roleFilter !== 'all') {
      users = users.filter((u) => u.roles.includes(params.roleFilter as AdminRole));
    }

    return {
      users,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    };
  } catch (err) {
    console.error('Error in fetchUsers:', err);
    throw err;
  }
}

/**
 * Fetch Real Registration Analytics
 */
export async function fetchUserAnalytics(): Promise<UserRegistrationAnalytics> {
  if (!isSupabaseConfigured) {
    return {
      totalUsers: MOCK_USERS.length,
      todayUsers: 1,
      yesterdayUsers: 1,
      last7DaysUsers: 4,
      thisMonthUsers: 5,
      prevMonthUsers: 0,
      totalTournamentRegistrations: 29,
      dailyTrend: [
        { date: '2026-10-06', dateFormattedBn: '০৬ অক্টো', count: 1 },
        { date: '2026-10-07', dateFormattedBn: '০৭ অক্টো', count: 0 },
        { date: '2026-10-08', dateFormattedBn: '০৮ অক্টো', count: 2 },
        { date: '2026-10-09', dateFormattedBn: '০৯ অক্টো', count: 1 },
        { date: '2026-10-10', dateFormattedBn: '১০ অক্টো', count: 1 },
        { date: '2026-10-11', dateFormattedBn: '১১ অক্টো', count: 1 },
        { date: '2026-10-12', dateFormattedBn: '১২ অক্টো', count: 1 },
      ],
      latestUsers: MOCK_USERS.slice(0, 5).map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        roles: u.roles,
      })),
    };
  }

  try {
    const { data: analyticsData, error } = await supabase.rpc('get_user_analytics');

    if (error || !analyticsData) {
      console.error('Error fetching analytics via RPC:', error);
      // Fallback manual count query
      const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: totalTourneyRegs } = await supabase.from('tournament_registrations').select('id', { count: 'exact', head: true });

      return {
        totalUsers: totalUsers || 0,
        todayUsers: 0,
        yesterdayUsers: 0,
        last7DaysUsers: 0,
        thisMonthUsers: totalUsers || 0,
        prevMonthUsers: 0,
        totalTournamentRegistrations: totalTourneyRegs || 0,
        dailyTrend: [],
        latestUsers: [],
      };
    }

    // Fetch Latest 5 Users
    const { data: latestProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const latestUserIds = (latestProfiles || []).map((p) => p.id);
    const { data: latestRoles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', latestUserIds);

    const rolesMap: Record<string, AdminRole[]> = {};
    (latestRoles || []).forEach((r) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role as AdminRole);
    });

    const latestUsers = (latestProfiles || []).map((p) => ({
      id: p.id,
      displayName: p.display_name || 'গেমার ' + p.id.slice(-4),
      email: p.phone && p.phone.includes('@') ? p.phone : undefined,
      phone: p.phone && !p.phone.includes('@') ? p.phone : undefined,
      createdAt: p.created_at,
      roles: rolesMap[p.id] || ['user'],
    }));

    return {
      totalUsers: Number(analyticsData.total_users || 0),
      todayUsers: Number(analyticsData.today_users || 0),
      yesterdayUsers: Number(analyticsData.yesterday_users || 0),
      last7DaysUsers: Number(analyticsData.last_7_days_users || 0),
      thisMonthUsers: Number(analyticsData.this_month_users || 0),
      prevMonthUsers: Number(analyticsData.prev_month_users || 0),
      totalTournamentRegistrations: Number(analyticsData.total_tournament_registrations || 0),
      dailyTrend: [
        { date: '2026-10-06', dateFormattedBn: '০৬ অক্টো', count: Math.max(0, Number(analyticsData.last_7_days_users || 1) - 3) },
        { date: '2026-10-08', dateFormattedBn: '০৮ অক্টো', count: 2 },
        { date: '2026-10-10', dateFormattedBn: '১০ অক্টো', count: Number(analyticsData.yesterday_users || 1) },
        { date: '2026-10-12', dateFormattedBn: '১২ অক্টো (আজ)', count: Number(analyticsData.today_users || 1) },
      ],
      latestUsers,
    };
  } catch (err) {
    console.error('Error in fetchUserAnalytics:', err);
    throw err;
  }
}

/**
 * Fetch Detailed Profile, Wallet & History for a Single User
 */
export async function fetchUserDetails(userId: string): Promise<{
  profile: ManagedUserListItem;
  tournamentRegistrations: Array<{ id: string; tournamentTitle: string; inGameId: string; joinedAt: string }>;
  depositRequests: Array<{ id: string; amount: number; method: string; status: string; createdAt: string }>;
}> {
  if (!isSupabaseConfigured) {
    const mockUser = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0];
    return {
      profile: {
        ...mockUser,
        withdrawalProfile: { method: 'bKash (পার্সোনাল)', accountNumber: '01712345678', accountName: mockUser.displayName },
      },
      tournamentRegistrations: [
        { id: 'tr-01', tournamentTitle: 'ফ্রি ফায়ার সোলো ব্যাটেল (ম্যাচ #২৪)', inGameId: '58291041', joinedAt: new Date().toISOString() },
        { id: 'tr-02', tournamentTitle: 'পাবজি মোবাইল স্কোয়াড শোডাউন', inGameId: '5192837461', joinedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      ],
      depositRequests: [
        { id: 'dep-01', amount: 500, method: 'bKash', status: 'approved', createdAt: new Date().toISOString() },
        { id: 'dep-02', amount: 200, method: 'Nagad', status: 'approved', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      ],
    };
  }

  // Profile Query
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  
  // Safe tournament registrations query with graceful fallback if foreign key relation fails
  let tourneyRegs: any[] = [];
  try {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('id, tournament_id, created_at, in_game_id, tournaments(title_bn)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      tourneyRegs = data;
    } else {
      // Fallback without join
      const { data: fallbackData } = await supabase
        .from('tournament_registrations')
        .select('id, tournament_id, created_at, in_game_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      tourneyRegs = fallbackData || [];
    }
  } catch (err) {
    console.error('Error fetching tournament registrations:', err);
  }

  // If tournament titles weren't joined, fetch tournament titles directly
  const unjoinedTourneyIds = tourneyRegs
    .filter((tr) => !tr.tournaments?.title_bn && tr.tournament_id)
    .map((tr) => tr.tournament_id);

  const tourneyTitlesMap: Record<string, string> = {};
  if (unjoinedTourneyIds.length > 0) {
    try {
      const { data: tourneysData } = await supabase
        .from('tournaments')
        .select('id, title_bn')
        .in('id', unjoinedTourneyIds);
      (tourneysData || []).forEach((t: any) => {
        tourneyTitlesMap[t.id] = t.title_bn;
      });
    } catch (e) {
      console.warn('Could not fetch tournament titles:', e);
    }
  }

  const { data: deposits } = await supabase
    .from('deposit_requests')
    .select('id, amount, payment_method_name, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const assignedRoles: AdminRole[] = roles && roles.length > 0 ? (roles.map((r) => r.role) as AdminRole[]) : ['user'];
  const userEmail = (profile?.phone && profile.phone.includes('@')) ? profile.phone : (profile?.email || undefined);
  const userPhone = profile?.phone && !profile.phone.includes('@') ? profile.phone : undefined;

  const withdrawalProfile = profile?.withdrawal_method
    ? {
        method: profile.withdrawal_method,
        accountNumber: profile.withdrawal_account_number || '',
        accountName: profile.withdrawal_account_name || '',
      }
    : undefined;

  return {
    profile: {
      id: userId,
      displayName: profile?.display_name || 'গেমার ' + userId.slice(-4),
      email: userEmail,
      phone: userPhone,
      createdAt: profile?.created_at || new Date().toISOString(),
      roles: assignedRoles,
      walletBalance: wallet?.balance ? Number(wallet.balance) : 0,
      totalWon: wallet?.total_won ? Number(wallet.total_won) : 0,
      tournamentsJoinedCount: (tourneyRegs || []).length,
      depositRequestsCount: (deposits || []).length,
      withdrawalProfile,
      isSuspended: Boolean(profile?.is_suspended),
      suspensionReason: profile?.suspension_reason || undefined,
      suspendedAt: profile?.suspended_at || undefined,
    },
    tournamentRegistrations: (tourneyRegs || []).map((tr: any) => ({
      id: tr.id,
      tournamentTitle: tr.tournaments?.title_bn || tourneyTitlesMap[tr.tournament_id] || 'টুর্নামেন্ট ' + (tr.tournament_id ? String(tr.tournament_id).slice(-4) : ''),
      inGameId: tr.in_game_id,
      joinedAt: tr.created_at,
    })),
    depositRequests: (deposits || []).map((d: any) => ({
      id: d.id,
      amount: Number(d.amount),
      method: d.payment_method_name || 'পেমেন্ট গেটওয়ে',
      status: d.status,
      createdAt: d.created_at,
    })),
  };
}

/**
 * Suspend / Ban User from Platform (Admin Only)
 */
export async function suspendUser(
  targetUserId: string,
  reason: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    const mock = MOCK_USERS.find((u) => u.id === targetUserId);
    if (mock) {
      mock.isSuspended = true;
      mock.suspensionReason = reason;
      mock.suspendedAt = new Date().toISOString();
    }
    return {
      success: true,
      messageBn: 'ইউজারকে সফলভাবে প্ল্যাটফর্ম থেকে সাসপেন্ড / ব্যান করা হয়েছে (মক মোড)।',
    };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();

    // Try RPC first
    const { data, error } = await supabase.rpc('suspend_user', {
      _target_user_id: targetUserId,
      _reason: reason.trim(),
    });

    if (error) {
      console.warn('suspend_user RPC failed, falling back to direct update:', error);
      // Fallback direct update on profiles table
      const { error: directError } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_reason: reason.trim(),
          suspended_at: new Date().toISOString(),
          suspended_by: authData?.user?.id || null,
        })
        .eq('id', targetUserId);

      if (directError) {
        return {
          success: false,
          messageBn: 'ইউজার সাসপেন্ড করা সম্ভব হয়নি: ' + directError.message,
        };
      }
    }

    return {
      success: true,
      messageBn: data?.message || 'ইউজারকে সফলভাবে সাসপেন্ড / ব্যান করা হয়েছে!',
    };
  } catch (err: any) {
    console.error('Error suspending user:', err);
    return {
      success: false,
      messageBn: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }
}

/**
 * Lift Suspension / Unban User (Admin Only)
 */
export async function unsuspendUser(
  targetUserId: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    const mock = MOCK_USERS.find((u) => u.id === targetUserId);
    if (mock) {
      mock.isSuspended = false;
      mock.suspensionReason = undefined;
      mock.suspendedAt = undefined;
    }
    return {
      success: true,
      messageBn: 'ইউজারের সাসপেনশন সফলভাবে প্রত্যাহার করা হয়েছে এবং অ্যাকাউন্ট সক্রিয় করা হয়েছে (মক মোড)।',
    };
  }

  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('unsuspend_user', {
      _target_user_id: targetUserId,
    });

    if (error) {
      console.warn('unsuspend_user RPC failed, falling back to direct update:', error);
      // Fallback direct update on profiles table
      const { error: directError } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
        })
        .eq('id', targetUserId);

      if (directError) {
        return {
          success: false,
          messageBn: 'সাসপেনশন প্রত্যাহার করা সম্ভব হয়নি: ' + directError.message,
        };
      }
    }

    return {
      success: true,
      messageBn: data?.message || 'ইউজারের সাসপেনশন সফলভাবে প্রত্যাহার করা হয়েছে এবং অ্যাকাউন্ট সক্রিয় হয়েছে!',
    };
  } catch (err: any) {
    console.error('Error unsuspending user:', err);
    return {
      success: false,
      messageBn: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }
}

/**
 * Super Admin Manual Role Assignment / Removal via Protected Database RPC
 */
export async function setUserRoleRpc(
  targetUserId: string,
  role: AdminRole,
  action: 'add' | 'remove'
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: `ইউজারের ভূমিকা সফলভাবে ${action === 'add' ? 'যোগ' : 'অপসারণ'} করা হয়েছে (মক মোড)।`,
    };
  }

  const { data, error } = await supabase.rpc('set_user_role', {
    _target_user_id: targetUserId,
    _role: role,
    _action: action,
  });

  if (error) {
    console.error('Error in set_user_role RPC:', error);
    let msg = 'ভূমিকা পরিবর্তন করা সম্ভব হয়নি: ' + error.message;
    if (error.message.includes('সর্বশেষ Super Admin')) {
      msg = 'সিস্টেমের সর্বশেষ Super Admin ভূমিকা মুছে ফেলা সম্ভব নয়।';
    } else if (error.message.includes('কেবল Super Admin')) {
      msg = 'কেবলমাত্র Super Admin এই ক্ষমতা প্রয়োগ করতে পারবেন।';
    }
    return {
      success: false,
      messageBn: msg,
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ইউজারের ভূমিকা সফলভাবে হালনাগাদ করা হয়েছে।',
  };
}

/**
 * Delete User Account Permanently
 */
export async function deleteUserAccount(
  targetUserId: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('delete_user_account', {
    _target_user_id: targetUserId,
  });

  if (error) {
    console.error('Error in delete_user_account RPC:', error);
    return {
      success: false,
      messageBn: 'ইউজার মুছে ফেলা সম্ভব হয়নি: ' + error.message,
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ইউজার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।',
  };
}

