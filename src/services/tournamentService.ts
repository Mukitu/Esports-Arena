import { Tournament, MatchResultSubmission, GameId, GameMode, TournamentStatus } from '../types';
import { TOURNAMENTS_DATA } from '../data/sampleData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export async function fetchTournaments(): Promise<Tournament[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item) => mapTournamentFromDb(item));
  } catch (err) {
    console.error('Error fetching tournaments from Supabase:', err);
    return [];
  }
}

export function mapTournamentFromDb(item: any): Tournament {
  return {
    id: item.id,
    titleBn: item.title_bn,
    gameId: (item.game_id as GameId) || 'free_fire',
    gameNameBn:
      item.game_name_bn ||
      (item.game_id === 'free_fire'
        ? 'ফ্রি ফায়ার'
        : item.game_id === 'pubg_mobile'
        ? 'পাবজি মোবাইল'
        : item.game_id === 'blood_strike'
        ? 'ব্লাড স্ট্রাইক'
        : item.game_id === 'efootball'
        ? 'ই-ফুটবল'
        : item.game_id || 'গেম'),
    mode: (item.mode as GameMode) || 'squad',
    modeBn: item.mode_bn || item.mode || 'স্কোয়াড',
    mapBn: item.map_bn || 'বারমুডা',
    entryFee: Number(item.entry_fee || 0),
    prizePool: Number(item.prize_pool || 0),
    perKillPrize: item.per_kill_prize ? Number(item.per_kill_prize) : undefined,
    maxSlots: Number(item.max_slots || 48),
    joinedSlots: Number(item.joined_slots || 0),
    startTime: item.start_time || '08:30 PM',
    dateFormatted: item.date_formatted || 'আজ',
    status: (item.status as TournamentStatus) || 'upcoming',
    statusBn: item.status_bn || getStatusBn(item.status),
    matchRules: Array.isArray(item.match_rules) ? item.match_rules : [],
    prizeDistribution: item.prize_distribution || {},
    roomIdAvailableAt: item.room_id_available_at || '১৫ মিনিট আগে',
    featured: Boolean(item.featured),
    descriptionBn: item.description_bn,
    roomStatus: item.room_status || 'hidden',
    roomId: item.room_id,
    roomPassword: item.room_password,
    registrationOpensAt: item.registration_opens_at,
    registrationClosesAt: item.registration_closes_at,
    resultSubmissionDeadline: item.result_submission_deadline,
    bannerUrl: item.banner_url,
  };
}

function getStatusBn(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'আসন্ন';
    case 'registration_open':
      return 'রেজিস্ট্রেশন চলছে';
    case 'registration_closed':
      return 'রেজিস্ট্রেশন বন্ধ';
    case 'live':
      return 'লাইভচলছে';
    case 'completed':
      return 'সম্পন্ন';
    case 'cancelled':
      return 'বাতিল';
    case 'draft':
      return 'ড্রাফট';
    default:
      return 'আসন্ন';
  }
}

/**
 * Helper to check if string is a valid UUID
 */

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Create a New Tournament (Admin Only)
 */
export async function createTournament(
  tournament: Omit<Tournament, 'id' | 'joinedSlots'>
): Promise<{ success: boolean; messageBn: string; id?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'নতুন টুর্নামেন্ট সফলভাবে তৈরি করা হয়েছে (মক মোড)!',
      id: 'tourney-' + Date.now(),
    };
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert([
      {
        title_bn: tournament.titleBn,
        game_id: tournament.gameId,
        game_name_bn: tournament.gameNameBn,
        mode: tournament.mode,
        mode_bn: tournament.modeBn,
        map_bn: tournament.mapBn,
        entry_fee: tournament.entryFee,
        prize_pool: tournament.prizePool,
        per_kill_prize: tournament.perKillPrize || null,
        max_slots: tournament.maxSlots,
        joined_slots: 0,
        start_time: tournament.startTime,
        date_formatted: tournament.dateFormatted,
        status: tournament.status || 'upcoming',
        status_bn: tournament.statusBn || 'আসন্ন',
        featured: Boolean(tournament.featured),
        match_rules: tournament.matchRules,
        prize_distribution: tournament.prizeDistribution,
        room_id_available_at: tournament.roomIdAvailableAt || '১৫ মিনিট আগে',
        description_bn: tournament.descriptionBn || null,
        room_status: tournament.roomStatus || 'hidden',
        banner_url: tournament.bannerUrl || null,
      },
    ])
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating tournament:', error);
    return {
      success: false,
      messageBn: 'টুর্নামেন্ট তৈরি সম্ভব হয়নি: ' + (error?.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: 'নতুন টুর্নামেন্ট সফলভাবে তৈরি করা হয়েছে!',
    id: data.id,
  };
}

/**
 * Update Existing Tournament Details (Admin Only)
 */
export async function updateTournament(
  id: string,
  updates: Partial<Tournament>
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টের তথ্য হালনাগাদ করা হয়েছে (মক মোড)।',
    };
  }

  // Handle sample mock tournaments (e.g. trn-ff-01) safely without 22P02 UUID error
  if (!isValidUuid(id)) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টের তথ্য সফলভাবে হালনাগাদ করা হয়েছে (স্যাম্পল টুর্নামেন্ট)!',
    };
  }

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.titleBn !== undefined) payload.title_bn = updates.titleBn;
  if (updates.gameId !== undefined) payload.game_id = updates.gameId;
  if (updates.gameNameBn !== undefined) payload.game_name_bn = updates.gameNameBn;
  if (updates.mode !== undefined) payload.mode = updates.mode;
  if (updates.modeBn !== undefined) payload.mode_bn = updates.modeBn;
  if (updates.mapBn !== undefined) payload.map_bn = updates.mapBn;
  if (updates.entryFee !== undefined) payload.entry_fee = updates.entryFee;
  if (updates.prizePool !== undefined) payload.prize_pool = updates.prizePool;
  if (updates.perKillPrize !== undefined) payload.per_kill_prize = updates.perKillPrize;
  if (updates.maxSlots !== undefined) payload.max_slots = updates.maxSlots;
  if (updates.startTime !== undefined) payload.start_time = updates.startTime;
  if (updates.dateFormatted !== undefined) payload.date_formatted = updates.dateFormatted;
  if (updates.status !== undefined) {
    payload.status = updates.status;
    payload.status_bn = updates.statusBn || getStatusBn(updates.status);
  }
  if (updates.matchRules !== undefined) payload.match_rules = updates.matchRules;
  if (updates.prizeDistribution !== undefined) payload.prize_distribution = updates.prizeDistribution;
  if (updates.descriptionBn !== undefined) payload.description_bn = updates.descriptionBn;
  if (updates.bannerUrl !== undefined) payload.banner_url = updates.bannerUrl;

  const { error } = await supabase.from('tournaments').update(payload).eq('id', id);

  if (error) {
    console.error('Error updating tournament:', error);
    if (error.code === '22P02' || error.message.includes('uuid')) {
      return {
        success: true,
        messageBn: 'টুর্নামেন্টের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!',
      };
    }
    return {
      success: false,
      messageBn: 'টুর্নামেন্ট হালনাগাদ ব্যর্থ হয়েছে: ' + error.message,
    };
  }

  return {
    success: true,
    messageBn: 'টুর্নামেন্টের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!',
  };
}

/**
 * Delete Tournament (Admin Only)
 */
export async function deleteTournament(
  id: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টটি সফলভাবে মুছে ফেলা হয়েছে (মক মোড)।',
    };
  }

  if (!isValidUuid(id)) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টটি সফলভাবে মুছে ফেলা হয়েছে (স্যাম্পল টুর্নামেন্ট)!',
    };
  }

  const { data, error } = await supabase.rpc('delete_tournament', {
    _tournament_id: id,
  });

  if (error) {
    console.error('Error deleting tournament via RPC:', error);
    // Fallback direct delete
    const { error: directError } = await supabase.from('tournaments').delete().eq('id', id);
    if (directError) {
      return {
        success: false,
        messageBn: 'টুর্নামেন্ট মোছা সম্ভব হয়নি: ' + directError.message,
      };
    }
  }

  return {
    success: true,
    messageBn: data?.message || 'টুর্নামেন্টটি সফলভাবে মুছে ফেলা হয়েছে!',
  };
}

/**
 * Update Match Room Credentials and Status (Admin Only)
 */
export async function updateMatchRoomCredentials(
  tournamentId: string,
  roomId: string,
  roomPassword: string,
  roomStatus: 'hidden' | 'released' | 'closed'
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে (মক মোড)।',
    };
  }

  if (!isValidUuid(tournamentId)) {
    return {
      success: true,
      messageBn: 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে (স্যাম্পল টুর্নামেন্ট)!',
    };
  }

  const { data, error } = await supabase.rpc('update_match_room_credentials', {
    _tournament_id: tournamentId,
    _room_id: roomId,
    _room_password: roomPassword,
    _room_status: roomStatus,
  });

  if (error) {
    console.error('Error in update_match_room_credentials RPC:', error);
    if (error.code === '22P02' || error.message.includes('uuid')) {
      return {
        success: true,
        messageBn: 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে!',
      };
    }
    return {
      success: false,
      messageBn: 'রুম পরিবর্তন ব্যর্থ হয়েছে: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ম্যাচ রুম ক্রিডেনশিয়াল সফলভাবে হালনাগাদ করা হয়েছে!',
  };
}

/**
 * Join tournament securely via atomic database RPC function
 */
export async function joinTournamentRpc(
  tournamentId: string,
  inGameId: string
): Promise<{ success: boolean; messageBn: string; newBalance?: number; joinedSlots?: number }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন (মক মোড)!',
    };
  }

  if (!isValidUuid(tournamentId)) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন (স্যাম্পল টুর্নামেন্ট)!',
    };
  }

  const { data, error } = await supabase.rpc('join_tournament', {
    _tournament_id: tournamentId,
    _in_game_id: inGameId,
  });

  if (error) {
    console.error('Error joining tournament via RPC:', error);
    if (error.code === '22P02') {
      return {
        success: true,
        messageBn: 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন (স্যাম্পল টুর্নামেন্ট)!',
      };
    }
    let errorMsg = 'টুর্নামেন্টে যোগ দেওয়া সম্ভব হয়নি: ' + error.message;

    if (error.message.includes('পর্যাপ্ত ব্যালেন্স নেই')) {
      errorMsg = 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। টুর্নামেন্টে যোগ দিতে প্রথমে ওয়ালেটে টাকা জমা দিন।';
    } else if (error.message.includes('ইতিমধ্যে এই টুর্নামেন্টে অংশগ্রহণ করেছেন')) {
      errorMsg = 'আপনি ইতিমধ্যে এই টুর্নামেন্টে অংশগ্রহণ করেছেন।';
    } else if (error.message.includes('সব স্লট ইতিমধ্যেই পূর্ণ')) {
      errorMsg = 'টুর্নামেন্টের সব স্লট ইতিমধ্যেই পূর্ণ হয়ে গেছে।';
    }

    return {
      success: false,
      messageBn: errorMsg,
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'টুর্নামেন্টে সফলভাবে যোগদান করেছেন!',
    newBalance: data?.new_balance !== undefined ? Number(data.new_balance) : undefined,
    joinedSlots: data?.joined_slots !== undefined ? Number(data.joined_slots) : undefined,
  };
}

/**
 * Fetch Room Credentials for a Tournament
 */
export async function fetchTournamentRoomCredentials(
  tournamentId: string
): Promise<{ success: boolean; roomId?: string; roomPassword?: string; messageBn?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      roomId: 'ROOM-883921',
      roomPassword: '1234',
    };
  }

  if (!isValidUuid(tournamentId)) {
    return {
      success: true,
      roomId: 'ROOM-883921',
      roomPassword: '1234',
    };
  }

  const { data, error } = await supabase.rpc('get_tournament_room_credentials', {
    _tournament_id: tournamentId,
  });

  if (error || !data?.success) {
    if (error?.code === '22P02') {
      return {
        success: true,
        roomId: 'ROOM-883921',
        roomPassword: '1234',
      };
    }
    return {
      success: false,
      messageBn: data?.message || 'রুম আইডি দেখতে প্রথমে টুর্নামেন্টে যোগদান করতে হবে।',
    };
  }

  return {
    success: true,
    roomId: data.room_id,
    roomPassword: data.room_password,
  };
}

/**
 * Check if current user has joined a tournament
 */
export async function checkUserJoinedTournament(tournamentId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  if (!isValidUuid(tournamentId)) {
    return false;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;

  const { data, error } = await supabase
    .from('tournament_registrations')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userData.user.id)
    .eq('status', 'registered')
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Submit Match Result Screenshot (Player)
 */
export async function submitMatchResultScreenshot(
  tournamentId: string,
  screenshotUrl: string,
  explanation?: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'ম্যাচ রেজাল্ট স্ক্রিনশট সফলভাবে জমা দেওয়া হয়েছে (মক মোড)!',
    };
  }

  if (!isValidUuid(tournamentId)) {
    return {
      success: true,
      messageBn: 'ম্যাচ রেজাল্ট স্ক্রিনশট সফলভাবে জমা দেওয়া হয়েছে (স্যাম্পল টুর্নামেন্ট)!',
    };
  }

  const { data, error } = await supabase.rpc('submit_match_result_screenshot', {
    _tournament_id: tournamentId,
    _screenshot_url: screenshotUrl,
    _explanation: explanation || null,
  });

  if (error) {
    console.error('Error in submit_match_result_screenshot RPC:', error);
    if (error.code === '22P02') {
      return {
        success: true,
        messageBn: 'ম্যাচ রেজাল্ট স্ক্রিনশট সফলভাবে জমা দেওয়া হয়েছে (স্যাম্পল টুর্নামেন্ট)!',
      };
    }
    return {
      success: false,
      messageBn: 'স্ক্রিনশট জমা দেওয়া সম্ভব হয়নি: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'ম্যাচ রেজাল্ট স্ক্রিনশট সফলভাবে জমা দেওয়া হয়েছে!',
  };
}

/**
 * Fetch User's Result Submission for a Tournament
 */
export async function fetchUserResultSubmission(
  tournamentId: string
): Promise<MatchResultSubmission | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase
    .from('match_result_submissions')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    tournamentId: data.tournament_id,
    userId: data.user_id,
    inGameId: data.in_game_id,
    screenshotUrl: data.screenshot_url,
    explanation: data.explanation,
    status: data.status,
    statusBn:
      data.status === 'approved'
        ? 'অনুমোদিত'
        : data.status === 'rejected'
        ? 'প্রত্যাখ্যাত'
        : data.status === 'evidence_requested'
        ? 'অতিরিক্ত প্রমান প্রয়োজন'
        : 'অপেক্ষমাণ',
    rejectionReason: data.rejection_reason,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Fetch Admin Match Result Submissions List
 */
export async function fetchAdminResultSubmissions(
  tournamentId?: string,
  statusFilter?: string
): Promise<MatchResultSubmission[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('match_result_submissions')
      .select(`
        *,
        tournaments(title_bn)
      `)
      .order('created_at', { ascending: false });

    if (tournamentId && tournamentId !== 'all') {
      query = query.eq('tournament_id', tournamentId);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error fetching admin result submissions:', error);
      return [];
    }

    const userIds = Array.from(new Set(data.map((item: any) => item.user_id).filter(Boolean)));
    const profilesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      (profilesData || []).forEach((p: any) => {
        if (p.id) profilesMap[p.id] = p.display_name;
      });
    }

    return data.map((item: any) => ({
      id: item.id,
      tournamentId: item.tournament_id,
      tournamentTitleBn: item.tournaments?.title_bn || 'টুর্নামেন্ট',
      userId: item.user_id,
      userDisplayName: profilesMap[item.user_id] || 'গেমার ' + (item.user_id ? item.user_id.slice(-4) : '****'),
      inGameId: item.in_game_id,
      screenshotUrl: item.screenshot_url,
      explanation: item.explanation,
      status: item.status,
      statusBn:
        item.status === 'approved'
          ? 'অনুমোদিত'
          : item.status === 'rejected'
          ? 'প্রত্যাখ্যাত'
          : item.status === 'evidence_requested'
          ? 'অতিরিক্ত প্রমান প্রয়োজন'
          : 'অপেক্ষমাণ',
      rejectionReason: item.rejection_reason,
      reviewedBy: item.reviewed_by,
      reviewedAt: item.reviewed_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    console.error('Unexpected error in fetchAdminResultSubmissions:', err);
    return [];
  }
}

/**
 * Review Match Result Submission (Admin)
 */
export async function reviewMatchResultSubmission(
  submissionId: string,
  status: 'approved' | 'rejected' | 'evidence_requested',
  notes?: string
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'রেজাল্ট রিভিউ সফলভাবে সংরক্ষণ করা হয়েছে (মক মোড)।',
    };
  }

  const { data, error } = await supabase.rpc('review_match_result_submission', {
    _submission_id: submissionId,
    _status: status,
    _notes: notes || null,
  });

  if (error) {
    console.error('Error in review_match_result_submission RPC:', error);
    return {
      success: false,
      messageBn: 'রিভিউ সংরক্ষণ ব্যর্থ হয়েছে: ' + (error.message || 'অজানা ত্রুটি'),
    };
  }

  return {
    success: true,
    messageBn: data?.message || 'রেজাল্ট রিভিউ সফলভাবে হালনাগাদ করা হয়েছে!',
  };
}

/**
 * Fetch Registered Players List for Admin
 */
export async function fetchTournamentPlayers(tournamentId: string): Promise<Array<{
  id: string;
  userId: string;
  displayName: string;
  inGameId: string;
  registeredAt: string;
  hasSubmittedResult: boolean;
}>> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: regs, error } = await supabase
      .from('tournament_registrations')
      .select('id, user_id, in_game_id, created_at')
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered')
      .order('created_at', { ascending: true });

    if (error || !regs || regs.length === 0) return [];

    const userIds = Array.from(new Set(regs.map((r) => r.user_id).filter(Boolean)));
    const profilesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      (profilesData || []).forEach((p: any) => {
        if (p.id) profilesMap[p.id] = p.display_name;
      });
    }

    const { data: subs } = await supabase
      .from('match_result_submissions')
      .select('user_id')
      .eq('tournament_id', tournamentId)
      .in('user_id', userIds);

    const subSet = new Set((subs || []).map((s) => s.user_id));

    return regs.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      displayName: profilesMap[r.user_id] || 'গেমার ' + (r.user_id ? r.user_id.slice(-4) : '****'),
      inGameId: r.in_game_id,
      registeredAt: r.created_at,
      hasSubmittedResult: subSet.has(r.user_id),
    }));
  } catch (err) {
    console.error('Unexpected error in fetchTournamentPlayers:', err);
    return [];
  }
}

/**
 * Cancel Tournament and Automatically Refund Entry Fee to All Registered Players (Admin Only)
 */
export async function cancelTournamentWithRefund(
  tournamentId: string,
  reason?: string
): Promise<{
  success: boolean;
  messageBn: string;
  refundedCount?: number;
  totalRefundedAmount?: number;
}> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'টুর্নামেন্টটি বাতিল করা হয়েছে এবং অংশগ্রহণকারীদের ফি সম্পূর্ণ রিফান্ড করা হয়েছে (মক মোড)!',
      refundedCount: 3,
      totalRefundedAmount: 150,
    };
  }

  const cancelReason = reason?.trim() || 'পর্যাপ্ত স্লট পূরণ না হওয়ায় টুর্নামেন্ট বাতিল ও ১০০% ফি রিফান্ড করা হয়েছে।';

  try {
    // 1. Try atomic PostgreSQL RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('cancel_tournament_and_refund', {
      _tournament_id: tournamentId,
      _cancellation_reason: cancelReason,
    });

    if (!rpcError && rpcData?.success) {
      return {
        success: true,
        messageBn: rpcData.message || 'টুর্নামেন্ট সফলভাবে বাতিল ও খেলোয়াড়দের ওয়ালেটে রিফান্ড করা হয়েছে!',
        refundedCount: Number(rpcData.refunded_count || 0),
        totalRefundedAmount: Number(rpcData.total_refunded_amount || 0),
      };
    }

    if (rpcError) {
      console.warn('cancel_tournament_and_refund RPC failed, using direct fallback loop:', rpcError);
    }

    // 2. Direct Fallback Loop
    // Fetch Tournament Details
    const { data: tourney, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tourney) {
      return { success: false, messageBn: 'টুর্নামেন্টটি খুঁজে পাওয়া যায়নি।' };
    }

    const entryFee = Number(tourney.entry_fee || 0);

    // Fetch registered players
    const { data: registrations, error: regErr } = await supabase
      .from('tournament_registrations')
      .select('id, user_id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'registered');

    if (regErr) {
      return { success: false, messageBn: 'অংশগ্রহণকারীদের তালিকা পাওয়া যায়নি: ' + regErr.message };
    }

    const regs = registrations || [];
    let refundedCount = 0;
    let totalRefundedAmount = 0;

    for (const reg of regs) {
      if (entryFee > 0) {
        // Fetch or create wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('user_id', reg.user_id)
          .maybeSingle();

        if (wallet) {
          // Increment wallet balance
          await supabase
            .from('wallets')
            .update({
              balance: Number(wallet.balance) + entryFee,
              updated_at: new Date().toISOString(),
            })
            .eq('id', wallet.id);

          // Record refund transaction
          const refId = 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
          await supabase.from('wallet_transactions').insert([
            {
              wallet_id: wallet.id,
              user_id: reg.user_id,
              type: 'refund',
              type_bn: 'টুর্নামেন্ট ফি রিফান্ড',
              amount: entryFee,
              method: 'ওয়ালেট রিফান্ড',
              ref_id: refId,
              status: 'completed',
              status_bn: 'সম্পন্ন',
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            },
          ]);

          refundedCount++;
          totalRefundedAmount += entryFee;
        }
      }

      // Mark registration as refunded
      await supabase
        .from('tournament_registrations')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reg.id);
    }

    // Update tournament status to cancelled
    await supabase
      .from('tournaments')
      .update({
        status: 'cancelled',
        status_bn: 'বাতিল (রিফান্ডকৃত)',
        room_status: 'closed',
        description_bn: (tourney.description_bn || '') + `\n[বাতিলের কারণ: ${cancelReason}]`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId);

    return {
      success: true,
      messageBn: `টুর্নামেন্টটি সফলভাবে বাতিল করা হয়েছে! মোট ${refundedCount} জন খেলোয়াড়কে ৳${totalRefundedAmount} রিফান্ড করা হয়েছে।`,
      refundedCount,
      totalRefundedAmount,
    };
  } catch (err: any) {
    console.error('Error in cancelTournamentWithRefund:', err);
    return {
      success: false,
      messageBn: 'টুর্নামেন্ট বাতিল ও রিফান্ড প্রক্রিয়ায় ত্রুটি ঘটেছে: ' + (err.message || 'অজানা ত্রুটি'),
    };
  }
}

