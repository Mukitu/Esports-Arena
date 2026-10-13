import React, { useState, useEffect } from 'react';
import { Tournament } from '../../types';
import { fetchTournaments, fetchTournamentPlayers, deleteTournament, cancelTournamentWithRefund } from '../../services/tournamentService';
import { TournamentFormModal } from './TournamentFormModal';
import { MatchRoomModal } from './MatchRoomModal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Trophy, Plus, Edit, Lock, Users, RefreshCw, Clock, Trash2, AlertCircle, CheckCircle2, RotateCcw, DollarSign, XCircle } from 'lucide-react';

export const AdminTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [roomControlTournament, setRoomControlTournament] = useState<Tournament | null>(null);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; tournament: Tournament | null }>({
    open: false,
    tournament: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [cancelRefundModal, setCancelRefundModal] = useState<{ open: boolean; tournament: Tournament | null }>({
    open: false,
    tournament: null,
  });
  const [cancellingRefund, setCancellingRefund] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('পর্যাপ্ত স্লট বুকিং না হওয়ায় ম্যাচ বাতিল ও ওয়ালেটে ১০০% ফি রিফান্ড করা হলো।');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [viewPlayersTournament, setViewPlayersTournament] = useState<Tournament | null>(null);
  const [playersList, setPlayersList] = useState<Array<{ id: string; displayName: string; inGameId: string; registeredAt: string; hasSubmittedResult: boolean }>>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Error loading admin tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDeleteExecute = async () => {
    if (!deleteConfirmModal.tournament) return;

    setDeleting(true);
    try {
      const res = await deleteTournament(deleteConfirmModal.tournament.id);
      if (res.success) {
        showToast(res.messageBn);
        setDeleteConfirmModal({ open: false, tournament: null });
        await loadData();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('টুর্নামেন্ট মোছা সম্ভব হয়নি।');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelRefundExecute = async () => {
    if (!cancelRefundModal.tournament) return;

    setCancellingRefund(true);
    try {
      const res = await cancelTournamentWithRefund(
        cancelRefundModal.tournament.id,
        cancellationReason
      );
      if (res.success) {
        showToast(res.messageBn);
        setCancelRefundModal({ open: false, tournament: null });
        await loadData();
      } else {
        alert(res.messageBn);
      }
    } catch (err) {
      alert('টুর্নামেন্ট বাতিল ও রিফান্ড প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    } finally {
      setCancellingRefund(false);
    }
  };

  const handleOpenPlayersModal = async (t: Tournament) => {
    setViewPlayersTournament(t);
    setLoadingPlayers(true);
    try {
      const players = await fetchTournamentPlayers(t.id);
      setPlayersList(players);
    } catch (err) {
      console.error('Error fetching players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const totalCount = tournaments.length;
  const upcomingCount = tournaments.filter((t) => t.status === 'upcoming' || t.status === 'registration_open').length;
  const liveCount = tournaments.filter((t) => t.status === 'live').length;
  const completedCount = tournaments.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>টুর্নামেন্ট কন্ট্রোল প্যানেল</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            ই-স্পোর্টস টুর্নামেন্ট ব্যবস্থাপনা
          </h2>
          <p className="text-xs text-slate-400">
            নতুন টুর্নামেন্ট তৈরি করুন, তথ্য সম্পাদনা/রিমুভ করুন, রুম আইডি প্রকাশ করুন।
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
            onClick={() => {
              setEditingTournament(null);
              setCreateModalOpen(true);
            }}
          >
            নতুন টুর্নামেন্ট তৈরি করুন
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">মোট টুর্নামেন্ট</span>
          <span className="text-2xl font-black text-white tabular-nums">{loading ? '...' : totalCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-emerald-500/30 p-4 space-y-1">
          <span className="text-xs text-emerald-400 font-semibold block">আসন্ন / রেজিস্ট্রেশন</span>
          <span className="text-2xl font-black text-emerald-400 tabular-nums">{loading ? '...' : upcomingCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-amber-500/30 p-4 space-y-1">
          <span className="text-xs text-amber-400 font-semibold block">লাইভ ম্যাচ</span>
          <span className="text-2xl font-black text-amber-400 tabular-nums">{loading ? '...' : liveCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">সম্পন্ন ম্যাচ</span>
          <span className="text-2xl font-black text-teal-300 tabular-nums">{loading ? '...' : completedCount}</span>
        </div>
      </div>

      {/* Tournaments List Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">গেম ও টুর্নামেন্ট</th>
                <th className="px-4 py-3">সময় ও তারিখ</th>
                <th className="px-4 py-3">ফি ও প্রাইজপুল</th>
                <th className="px-4 py-3">স্লট ক্যাপাসিটি</th>
                <th className="px-4 py-3">স্ট্যাটাস ও রুম</th>
                <th className="px-4 py-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>টুর্নামেন্ট ডেটা লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো টুর্নামেন্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                tournaments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="emerald">{t.gameNameBn}</Badge>
                          <Badge variant="slate">{t.modeBn}</Badge>
                          <Badge variant="cyan">{t.mapBn}</Badge>
                        </div>
                        <span className="font-bold text-white block text-sm">{t.titleBn}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      <div className="space-y-0.5">
                        <span className="text-white block font-medium">{t.dateFormatted}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{t.startTime}</span>
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-emerald-400 font-bold block">
                          এন্ট্রি: {t.entryFee === 0 ? 'ফ্রি' : `৳${t.entryFee}`}
                        </span>
                        <span className="text-teal-300 text-[11px]">প্রাইজ: ৳{t.prizePool}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">{t.joinedSlots} পূরন</span>
                          <span className="text-slate-500">{t.maxSlots} মোট</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (t.joinedSlots / t.maxSlots) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            t.status === 'live'
                              ? 'rose'
                              : t.status === 'registration_open' || t.status === 'upcoming'
                              ? 'emerald'
                              : 'slate'
                          }
                        >
                          {t.statusBn || 'আসন্ন'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          রুম: {t.roomStatus === 'released' ? 'প্রকাশিত' : t.roomStatus === 'closed' ? 'বন্ধ' : 'লুকানো'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTournament(t);
                            setCreateModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        <button
                          onClick={() => setRoomControlTournament(t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1 text-[11px]"
                          title="ম্যাচ রুম ক্রিডেনশিয়াল"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>রুম</span>
                        </button>

                        <button
                          onClick={() => handleOpenPlayersModal(t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px]"
                          title="নিবন্ধিত গেমারদের তালিকা"
                        >
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          <span>গেমারস</span>
                        </button>

                        {t.status !== 'cancelled' && t.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setCancellationReason('স্লট সংখ্যা পূর্ণ না হওয়ায় ম্যাচ বাতিল ও ওয়ালেটে ১০০% ফি রিফান্ড করা হলো।');
                              setCancelRefundModal({ open: true, tournament: t });
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 text-[11px] font-semibold"
                            title="টুর্নামেন্ট বাতিল ও ফি রিফান্ড করুন"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>বাতিল ও রিফান্ড</span>
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirmModal({ open: true, tournament: t })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40"
                          title="মুছে ফেলুন (Delete)"
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

      {/* Tournament Edit / Create Form Modal */}
      {createModalOpen && (
        <TournamentFormModal
          tournament={editingTournament}
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => loadData()}
        />
      )}

      {/* Match Room Credential Modal */}
      {roomControlTournament && (
        <MatchRoomModal
          tournament={roomControlTournament}
          isOpen={Boolean(roomControlTournament)}
          onClose={() => setRoomControlTournament(null)}
          onSuccess={() => loadData()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && deleteConfirmModal.tournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
              <AlertCircle className="w-6 h-6" />
              <span>টুর্নামেন্ট মুছে ফেলার সতর্কতা</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনি <strong className="text-white">{deleteConfirmModal.tournament.titleBn}</strong> টুর্নামেন্টটি স্থায়ীভাবে মুছে ফেলতে চান? এটি মুছে ফেললে এর সকল রেজিস্ট্রেশন ডেটা মুছে যাবে।
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteConfirmModal({ open: false, tournament: null })}
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

      {/* Registered Players List Modal */}
      {viewPlayersTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">নিবন্ধিত গেমারদের তালিকা</h3>
                <span className="text-xs text-emerald-400">{viewPlayersTournament.titleBn}</span>
              </div>
              <button
                onClick={() => setViewPlayersTournament(null)}
                className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                ✕
              </button>
            </div>

            {loadingPlayers ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>প্লেয়ার তালিকা লোড হচ্ছে...</span>
              </div>
            ) : playersList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">এখনো কেউ এই টুর্নামেন্টে যোগদান করেনি।</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {playersList.map((p, idx) => (
                  <div key={p.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{idx + 1}. {p.displayName}</span>
                      <span className="text-[11px] text-amber-400 font-mono">In-Game UID: {p.inGameId}</span>
                    </div>
                    {p.hasSubmittedResult ? (
                      <Badge variant="emerald">রেজাল্ট জমা দিয়েছে</Badge>
                    ) : (
                      <Badge variant="slate">রেজাল্ট জমা দেয়নি</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel & Refund Modal */}
      {cancelRefundModal.open && cancelRefundModal.tournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg border-b border-slate-800 pb-3">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>টুর্নামেন্ট বাতিল ও ফি রিফান্ড নিশ্চিতকরণ</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">টুর্নামেন্টের নাম:</span>
                <p className="font-bold text-white text-sm">{cancelRefundModal.tournament.titleBn}</p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <span className="text-emerald-400">
                    এন্ট্রি ফি: <strong>৳{cancelRefundModal.tournament.entryFee}</strong>
                  </span>
                  <span className="text-teal-300">
                    অংশগ্রহণকারী: <strong>{cancelRefundModal.tournament.joinedSlots} জন</strong>
                  </span>
                  <span className="text-amber-400 font-bold font-mono">
                    মোট রিফান্ড হবে: ৳{cancelRefundModal.tournament.joinedSlots * cancelRefundModal.tournament.entryFee}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>সতর্কতা:</strong> এই অ্যাকশন কার্যকর করলে টুর্নামেন্টটি <strong>বাতিল (রিফান্ডকৃত)</strong> হয়ে যাবে এবং নিবন্ধিত সকল খেলোয়াড়ের অ্যাকাউন্টে তাদের এন্ট্রি ফি <strong>১০০% স্বয়ংক্রিয়ভাবে ফেরত/রিফান্ড</strong> চলে যাবে।
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">বাতিলের কারণ (খেলোয়াড়দের প্রদর্শনের জন্য):</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="যেমন: পর্যাপ্ত স্লট বুকিং না হওয়ায় টুর্নামেন্ট বাতিল ও রিফান্ড..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                disabled={cancellingRefund}
                onClick={() => setCancelRefundModal({ open: false, tournament: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                বাতিল করুন
              </button>
              <button
                disabled={cancellingRefund}
                onClick={handleCancelRefundExecute}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-950/40 flex items-center gap-1.5"
              >
                {cancellingRefund ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>রিফান্ড প্রক্রিয়াকরণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, বাতিল ও রিফান্ড কার্যকর করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
