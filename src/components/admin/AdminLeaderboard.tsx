import React, { useState, useEffect } from 'react';
import {
  LeaderboardEntry,
  fetchLeaderboardEntries,
  createLeaderboardEntry,
  updateLeaderboardEntry,
  deleteLeaderboardEntry,
} from '../../services/leaderboardService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Trophy, Plus, Edit, Trash2, RefreshCw, AlertCircle, CheckCircle2, User, Flame } from 'lucide-react';

export const AdminLeaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [gamerName, setGamerName] = useState('');
  const [gameUid, setGameUid] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(1000);
  const [totalKills, setTotalKills] = useState(50);
  const [rankPosition, setRankPosition] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; entry: LeaderboardEntry | null }>({
    open: false,
    entry: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboardEntries();
      setEntries(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setGamerName('');
    setGameUid('');
    setTotalEarnings(1000);
    setTotalKills(50);
    setRankPosition(entries.length + 1);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (entry: LeaderboardEntry) => {
    setEditingEntry(entry);
    setGamerName(entry.gamerName);
    setGameUid(entry.gameUid || '');
    setTotalEarnings(entry.totalEarnings);
    setTotalKills(entry.totalKills);
    setRankPosition(entry.rankPosition);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!gamerName.trim()) {
      setErrorMsg('গেমারের নাম প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEntry) {
        const res = await updateLeaderboardEntry(editingEntry.id, {
          gamerName: gamerName.trim(),
          gameUid: gameUid.trim() || undefined,
          totalEarnings: Number(totalEarnings),
          totalKills: Number(totalKills),
          rankPosition: Number(rankPosition),
        });
        if (res.success) {
          showToast(res.messageBn);
          setModalOpen(false);
          await loadData();
        } else {
          setErrorMsg(res.messageBn);
        }
      } else {
        const res = await createLeaderboardEntry({
          gamerName: gamerName.trim(),
          gameUid: gameUid.trim() || undefined,
          totalEarnings: Number(totalEarnings),
          totalKills: Number(totalKills),
          rankPosition: Number(rankPosition),
        });
        if (res.success) {
          showToast(res.messageBn);
          setModalOpen(false);
          await loadData();
        } else {
          setErrorMsg(res.messageBn);
        }
      }
    } catch (err) {
      setErrorMsg('একটি সমস্যা ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExecute = async () => {
    if (!deleteModal.entry) return;

    setDeleting(true);
    try {
      const res = await deleteLeaderboardEntry(deleteModal.entry.id);
      if (res.success) {
        showToast(res.messageBn);
        setDeleteModal({ open: false, entry: null });
        await loadData();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('লিডারবোর্ড এন্ট্রি ডিলিট করা সম্ভব হয়নি।');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>শীর্ষ গেমার লিডারবোর্ড</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            শীর্ষ গেমারস লিডারবোর্ড ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-400">
            ডেইলি বা উইকলি সেরা গেমারদের তথ্য ম্যানুয়ালি অ্যাড, এডিট বা ডিলিট করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>

          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            নতুন শীর্ষ গেমার যোগ করুন
          </Button>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-center">র‍্যাংক (Rank)</th>
                <th className="px-4 py-3">গেমারের নাম & In-Game UID</th>
                <th className="px-4 py-3">মোট কিল (Kills)</th>
                <th className="px-4 py-3 text-right">মোট আর্নিং (Earnings)</th>
                <th className="px-4 py-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>লিডারবোর্ড লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    কোনো লিডারবোর্ড এন্ট্রি পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-xs font-extrabold ${
                          item.rankPosition === 1
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : item.rankPosition === 2
                            ? 'bg-slate-300 text-slate-950'
                            : item.rankPosition === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        #{item.rankPosition}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-white block text-sm">{item.gamerName}</span>
                        {item.gameUid && (
                          <span className="text-[11px] text-amber-400 font-mono">UID: {item.gameUid}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-200">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.totalKills} Kills</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-extrabold text-emerald-400 text-base tabular-nums">
                      ৳{item.totalEarnings}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        <button
                          onClick={() => setDeleteModal({ open: true, entry: item })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>{editingEntry ? 'লিডারবোর্ড তথ্য সম্পাদনা' : 'নতুন শীর্ষ গেমার যোগ করুন'}</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              {errorMsg && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">গেমারের নাম:</label>
                <input
                  type="text"
                  required
                  value={gamerName}
                  onChange={(e) => setGamerName(e.target.value)}
                  placeholder="যেমন: Nishat Pro Gamer"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">In-Game UID / ID (ঐচ্ছিক):</label>
                <input
                  type="text"
                  value={gameUid}
                  onChange={(e) => setGameUid(e.target.value)}
                  placeholder="যেমন: 58291048"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">র‍্যাংক পজিশন:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rankPosition}
                    onChange={(e) => setRankPosition(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">মোট কিল:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalKills}
                    onChange={(e) => setTotalKills(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">মোট আর্নিং (৳):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalEarnings}
                    onChange={(e) => setTotalEarnings(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  বাতিল
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : editingEntry ? 'হালনাগাদ করুন' : 'যোগ করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.entry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400">লিডারবোর্ড মুছে ফেলুন</h3>
            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিত যে <strong className="text-white">{deleteModal.entry.gamerName}</strong> গেমারকে লিডারবোর্ড থেকে সরিয়ে দিতে চান?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteModal({ open: false, entry: null })}
              >
                বাতিল
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteExecute}
              >
                {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
