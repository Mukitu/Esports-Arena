import React, { useState, useEffect } from 'react';
import { fetchLeaderboardEntries, LeaderboardEntry } from '../services/leaderboardService';
import { Trophy, Flame, Crosshair, Zap, RefreshCw } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboardEntries();
      setEntries(data);
    } catch (err) {
      console.error('Error loading leaderboard page:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-[#090d16] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span>চ্যাম্পিয়ন <span className="text-emerald-400">লিডারবোর্ড</span></span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              বাংলাদেশের সেরা ই-স্পোর্টস গেমারদের র্যাঙ্কিং এবং অর্জিত প্রাইজ মানি
            </p>
          </div>

          <button
            onClick={loadData}
            className="self-start sm:self-auto p-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 font-semibold text-center">র‍্যাংক</th>
                  <th className="py-4 px-4 font-semibold">গেমার নাম & In-Game UID</th>
                  <th className="py-4 px-4 font-semibold text-center">মোট কিল (Kills)</th>
                  <th className="py-4 px-4 font-semibold text-right">মোট অর্জিত প্রাইজমানি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <span>লিডারবোর্ড ডেটা লোড হচ্ছে...</span>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      কোনো লিডারবোর্ড রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  entries.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4 font-bold tabular-nums text-center">
                        <span
                          className={`w-8 h-8 rounded-lg inline-flex items-center justify-center text-xs font-extrabold ${
                            player.rankPosition === 1
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                              : player.rankPosition === 2
                              ? 'bg-slate-300 text-slate-950'
                              : player.rankPosition === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          #{player.rankPosition}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-white block text-sm">{player.gamerName}</span>
                        {player.gameUid && (
                          <span className="text-xs text-amber-400 font-mono">UID: {player.gameUid}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center tabular-nums font-semibold text-slate-200">
                        <span className="flex items-center justify-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                          <span>{player.totalKills} Kills</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-extrabold text-emerald-400 text-base tabular-nums">
                        ৳{player.totalEarnings}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
