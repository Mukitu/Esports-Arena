import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface LeaderboardEntry {
  id: string;
  gamerName: string;
  gameUid?: string;
  totalEarnings: number;
  totalKills: number;
  rankPosition: number;
  avatarUrl?: string;
  createdAt?: string;
}

const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'ld-01',
    gamerName: 'Nishat Pro Gamer',
    gameUid: '58291048',
    totalEarnings: 4500,
    totalKills: 128,
    rankPosition: 1,
  },
  {
    id: 'ld-02',
    gamerName: 'Sakib Al Hasan',
    gameUid: '91028374',
    totalEarnings: 3200,
    totalKills: 94,
    rankPosition: 2,
  },
  {
    id: 'ld-03',
    gamerName: 'Tanjim Ahmed',
    gameUid: '19283746',
    totalEarnings: 2400,
    totalKills: 76,
    rankPosition: 3,
  },
];

/**
 * Fetch All Leaderboard Entries (Sorted by Rank)
 */
export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order('rank_position', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      gamerName: item.gamer_name,
      gameUid: item.game_uid,
      totalEarnings: Number(item.total_earnings || 0),
      totalKills: Number(item.total_kills || 0),
      rankPosition: Number(item.rank_position || 1),
      avatarUrl: item.avatar_url,
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Error fetching leaderboard entries:', err);
    return [];
  }
}

/**
 * Create New Leaderboard Entry (Admin)
 */
export async function createLeaderboardEntry(entry: {
  gamerName: string;
  gameUid?: string;
  totalEarnings: number;
  totalKills: number;
  rankPosition: number;
}): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'লিডারবোর্ড এন্ট্রি সফলভাবে যুক্ত করা হয়েছে (মক মোড)।',
    };
  }

  const { error } = await supabase.from('leaderboard_entries').insert([
    {
      gamer_name: entry.gamerName,
      game_uid: entry.gameUid || null,
      total_earnings: entry.totalEarnings,
      total_kills: entry.totalKills,
      rank_position: entry.rankPosition,
    },
  ]);

  if (error) {
    console.error('Error creating leaderboard entry:', error);
    return {
      success: false,
      messageBn: 'লিডারবোর্ড যুক্ত করা সম্ভব হয়নি: ' + error.message,
    };
  }

  return {
    success: true,
    messageBn: 'শীর্ষ গেমার সফলভাবে লিডারবোর্ডে যুক্ত করা হয়েছে!',
  };
}

/**
 * Update Leaderboard Entry (Admin)
 */
export async function updateLeaderboardEntry(
  id: string,
  updates: Partial<LeaderboardEntry>
): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'লিডারবোর্ড তথ্য আপডেট করা হয়েছে (মক মোড)।',
    };
  }

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.gamerName !== undefined) payload.gamer_name = updates.gamerName;
  if (updates.gameUid !== undefined) payload.game_uid = updates.gameUid;
  if (updates.totalEarnings !== undefined) payload.total_earnings = updates.totalEarnings;
  if (updates.totalKills !== undefined) payload.total_kills = updates.totalKills;
  if (updates.rankPosition !== undefined) payload.rank_position = updates.rankPosition;

  const { error } = await supabase.from('leaderboard_entries').update(payload).eq('id', id);

  if (error) {
    console.error('Error updating leaderboard entry:', error);
    return {
      success: false,
      messageBn: 'লিডারবোর্ড আপডেট ব্যর্থ হয়েছে: ' + error.message,
    };
  }

  return {
    success: true,
    messageBn: 'লিডারবোর্ড তথ্য সফলভাবে আপডেট করা হয়েছে!',
  };
}

/**
 * Delete Leaderboard Entry (Admin)
 */
export async function deleteLeaderboardEntry(id: string): Promise<{ success: boolean; messageBn: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      messageBn: 'লিডারবোর্ড এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে (মক মোড)।',
    };
  }

  const { error } = await supabase.from('leaderboard_entries').delete().eq('id', id);

  if (error) {
    console.error('Error deleting leaderboard entry:', error);
    return {
      success: false,
      messageBn: 'লিডারবোর্ড ডিলিট সম্ভব হয়নি: ' + error.message,
    };
  }

  return {
    success: true,
    messageBn: 'লিডারবোর্ড এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!',
  };
}
