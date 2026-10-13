import React, { useState, useEffect } from 'react';
import { fetchLeaderboardEntries, LeaderboardEntry } from '../../services/leaderboardService';
import { Trophy, ArrowRight, Flame, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface LeaderboardPreviewProps {
  onViewFullLeaderboard: () => void;
}

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  onViewFullLeaderboard,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboardEntries();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching leaderboard preview:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#060911] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>শীর্ষ গেমারদের <span className="text-emerald-400">লিডারবোর্ড</span></span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              চলতি মাসের সেরা পারফর্মারদের র্যাঙ্কিং এবং মোট অর্জিত পুরষ্কার
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewFullLeaderboard}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            সম্পূর্ণ লিডারবোর্ড দেখুন
          </Button>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-center">র‍্যাংক</th>
                  <th className="py-3.5 px-4 font-semibold">গেমার</th>
                  <th className="py-3.5 px-4 font-semibold text-center">মোট কিল</th>
                  <th className="py-3.5 px-4 font-semibold text-right">মোট অর্জিত টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>লিডারবোর্ড লোড হচ্ছে...</span>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      অ্যাডমিন কর্তৃক কোনো শীর্ষ গেমার যুক্ত করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  entries.slice(0, 5).map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold tabular-nums text-center">
                        {player.rankPosition === 1 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-extrabold text-xs">
                            #১
                          </span>
                        ) : player.rankPosition === 2 ? (
                          <span className="w-7 h-7 rounded-lg bg-slate-400/20 text-slate-300 border border-slate-400/40 inline-flex items-center justify-center font-extrabold text-xs">
                            #২
                          </span>
                        ) : player.rankPosition === 3 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/40 inline-flex items-center justify-center font-extrabold text-xs">
                            #৩
                          </span>
                        ) : (
                          <span className="text-slate-400">#{player.rankPosition}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>
                          <span className="block text-sm">{player.gamerName}</span>
                          {player.gameUid && (
                            <span className="text-[11px] text-amber-400 font-mono font-normal">
                              UID: {player.gameUid}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                          <span>{player.totalKills} Kills</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm sm:text-base tabular-nums">
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
    </section>
  );
};
