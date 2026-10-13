import React, { useState, useEffect } from 'react';
import { UserComplaint, ComplaintStatus } from '../../types';
import { fetchAdminComplaints, updateComplaintStatus } from '../../services/complaintService';
import { suspendUser } from '../../services/userManagementService';
import { Badge } from '../common/Badge';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  MessageSquare,
  Check,
  XCircle,
  Send,
  User
} from 'lucide-react';

export const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState<UserComplaint | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ComplaintStatus>('in_progress');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [updating, setUpdating] = useState(false);

  // Quick suspend modal for reported ID
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendTargetId, setSuspendTargetId] = useState('');
  const [suspendReason, setSuspendReason] = useState('অভিযোগ পর্যালোচনায় চিটিং ও ফেয়ার প্লে নিয়ম লঙ্ঘন প্রমাণিত');
  const [suspendingUser, setSuspendingUser] = useState(false);

  // Zoomed screenshot
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminComplaints({
        statusFilter,
        searchQuery,
      });
      setComplaints(data);
    } catch (e) {
      console.error('Error loading admin complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenReview = (c: UserComplaint) => {
    setSelectedComplaint(c);
    setReviewStatus(c.status);
    setAdminNotesInput(c.adminNotes || '');
  };

  const handleSaveReview = async () => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const finalNotes =
        adminNotesInput.trim() ||
        (reviewStatus === 'resolved'
          ? 'অভিযোগটি অ্যাডমিন টিম কর্তৃক পর্যালোচনা করে সমাধান করা হয়েছে।'
          : reviewStatus === 'rejected'
          ? 'যাচাই-বাছাই শেষে পর্যাপ্ত প্রমাণের অভাবে অভিযোগটি বাতিল করা হয়েছে।'
          : reviewStatus === 'in_progress'
          ? 'অভিযোগটি তদন্ত ও পর্যালোচনার অধীনে রয়েছে।'
          : '');

      const res = await updateComplaintStatus({
        complaintId: selectedComplaint.id,
        status: reviewStatus,
        adminNotes: finalNotes,
      });

      if (res.success) {
        showToast(res.messageBn);
        setSelectedComplaint(null);
        await loadComplaints();
      } else {
        alert(res.messageBn);
      }
    } catch (e) {
      alert('স্ট্যাটাস আপডেট সম্ভব হয়নি।');
    } finally {
      setUpdating(false);
    }
  };

  const handleExecuteSuspend = async () => {
    if (!suspendTargetId.trim()) return;

    setSuspendingUser(true);
    try {
      const res = await suspendUser(suspendTargetId.trim(), suspendReason.trim());
      if (res.success) {
        showToast(res.messageBn);
        setSuspendModalOpen(false);
        // Pre-fill resolution notes
        setAdminNotesInput(
          `অভিযোগের সত্যতা যাচাই করে অভিযুক্ত আইডি (${suspendTargetId}) প্ল্যাটফর্ম থেকে সাসপেন্ড/ব্যান করা হয়েছে।`
        );
        setReviewStatus('resolved');
      } else {
        alert(res.messageBn);
      }
    } catch (e) {
      alert('সাসপেন্ড কার্যকর করা সম্ভব হয়নি।');
    } finally {
      setSuspendingUser(false);
    }
  };

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>অভিযোগ ও ডিসপিউট সমাধান ({totalCount}টি)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            ইউজার অভিযোগসমূহ ও অ্যাকশন কন্ট্রোল
          </h2>
          <p className="text-xs text-slate-400">
            গেমারদের দাখিলকৃত স্ক্রিনশট ও অভিযোগ যাচাই করুন, স্ট্যাটাস আপডেট করুন এবং ব্যবস্থা গ্রহণ করুন।
          </p>
        </div>

        <button
          onClick={loadComplaints}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">মোট অভিযোগ</span>
          <span className="text-2xl font-black text-white tabular-nums">{loading ? '...' : totalCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-amber-500/30 p-4 space-y-1">
          <span className="text-xs text-amber-400 font-semibold block">অপেক্ষমাণ (Pending)</span>
          <span className="text-2xl font-black text-amber-400 tabular-nums">{loading ? '...' : pendingCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-sky-500/30 p-4 space-y-1">
          <span className="text-xs text-sky-400 font-semibold block">তদন্ত/প্রক্রিয়াধীন</span>
          <span className="text-2xl font-black text-sky-400 tabular-nums">{loading ? '...' : inProgressCount}</span>
        </div>
        <div className="bg-[#0f172a] rounded-2xl border border-emerald-500/30 p-4 space-y-1">
          <span className="text-xs text-emerald-400 font-semibold block">সমাধানকৃত (Resolved)</span>
          <span className="text-2xl font-black text-emerald-400 tabular-nums">{loading ? '...' : resolvedCount}</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadComplaints(); }}
            placeholder="টাইটেল, প্লেয়ার নাম বা UID..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>স্ট্যাটাস ফিল্টার:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">সব অভিযোগ</option>
            <option value="pending">অপেক্ষমাণ (Pending)</option>
            <option value="in_progress">তদন্ত/প্রক্রিয়াধীন (In Progress)</option>
            <option value="resolved">সমাধানকৃত (Resolved)</option>
            <option value="rejected">বাতিলকৃত (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">অভিযোগকারী</th>
                <th className="px-4 py-3">টাইটেল ও ক্যাটাগরি</th>
                <th className="px-4 py-3">স্ক্রিনশট প্রমাণ</th>
                <th className="px-4 py-3">অভিযুক্ত আইডি</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>অভিযোগ তালিকা লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    কোনো অভিযোগ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{c.userDisplayName || 'ইউজার'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.userContact || 'যোগাযোগ নেই'}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(c.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-100 block leading-snug">{c.title}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full inline-block">
                          {c.categoryBn}
                        </span>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {c.screenshotUrl ? (
                        <div
                          onClick={() => setZoomedImage(c.screenshotUrl)}
                          className="relative rounded-lg overflow-hidden border border-slate-700 w-16 h-12 cursor-pointer group bg-slate-950 shrink-0"
                          title="বড় করে দেখতে ক্লিক করুন"
                        >
                          <img
                            src={c.screenshotUrl}
                            alt="Screenshot"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                            <Eye className="w-3 h-3" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">ছবি নেই</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-amber-400 font-semibold">
                      {c.reportedUserId ? c.reportedUserId : <span className="text-slate-500 font-sans">প্রযোজ্য নয়</span>}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          c.status === 'resolved'
                            ? 'emerald'
                            : c.status === 'in_progress'
                            ? 'amber'
                            : c.status === 'rejected'
                            ? 'rose'
                            : 'slate'
                        }
                      >
                        {c.statusBn || c.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenReview(c)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>রিভিউ ও অ্যাকশন</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">অভিযোগ পর্যালোচনা ও ব্যবস্থা গ্রহণ</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">অভিযোগকারী:</span>
                <p className="font-bold text-white">
                  {selectedComplaint.userDisplayName} ({selectedComplaint.userContact})
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  আইডি: {selectedComplaint.id} • তারিখ: {new Date(selectedComplaint.createdAt).toLocaleDateString('bn-BD')}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">শিরোনাম:</span>
                <p className="font-bold text-slate-100 text-sm">{selectedComplaint.title}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">ইউজারের বিবরণ:</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Reported Player & Quick Suspend Button */}
              {selectedComplaint.reportedUserId && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-rose-400 block font-semibold">অভিযুক্ত প্লেয়ার UID / আইডি:</span>
                    <strong className="text-white font-mono text-sm">{selectedComplaint.reportedUserId}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setSuspendTargetId(selectedComplaint.reportedUserId || '');
                      setSuspendModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>এই আইডি ব্যান / সাসপেন্ড করুন</span>
                  </button>
                </div>
              )}

              {/* Screenshot Proof */}
              {selectedComplaint.screenshotUrl && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 block">সংযুক্ত স্ক্রিনশট প্রমাণ:</span>
                  <div
                    onClick={() => setZoomedImage(selectedComplaint.screenshotUrl)}
                    className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-60 flex items-center justify-center cursor-pointer group"
                  >
                    <img
                      src={selectedComplaint.screenshotUrl}
                      alt="Proof"
                      className="max-h-60 w-auto object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity">
                      <Eye className="w-4 h-4" />
                      <span>ফুল স্ক্রিনে দেখুন</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Dropdown */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-200 block">
                  অভিযোগের বর্তমান স্ট্যাটাস নির্ধারণ করুন:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('pending')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      reviewStatus === 'pending'
                        ? 'bg-slate-800 border-slate-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    অপেক্ষমাণ (Pending)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('in_progress')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      reviewStatus === 'in_progress'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    তদন্তাধীন (In Progress)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('resolved')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      reviewStatus === 'resolved'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    সমাধানকৃত (Resolved)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      reviewStatus === 'rejected'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    বাতিল (Rejected)
                  </button>
                </div>
              </div>

              {/* Admin Resolution Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">
                  অ্যাডমিনের মন্তব্য বা গৃহীত ব্যবস্থা (ইউজার এটি দেখতে পাবে):
                </label>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  rows={3}
                  placeholder="যেমন: অভিযোগটি খতিয়ে দেখা হয়েছে এবং উপযুক্ত ব্যবস্থা নেওয়া হয়েছে..."
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                disabled={updating}
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>আপডেট ও সেভ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Target User Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Ban className="w-5 h-5" />
              <span>অভিযুক্ত প্লেয়ারকে সাসপেন্ড / ব্যান করুন</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              আইডি: <strong className="text-white font-mono">{suspendTargetId}</strong>-কে প্ল্যাটফর্ম থেকে তাৎক্ষণিক সাসপেন্ড করতে নিচের বিবরণ দিন।
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-300">সাসপেন্ড করার কারণ:</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={suspendingUser}
                onClick={() => setSuspendModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                বাতিল
              </button>
              <button
                disabled={suspendingUser}
                onClick={handleExecuteSuspend}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {suspendingUser ? 'ব্যান হচ্ছে...' : 'হ্যাঁ, ব্যান করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Image Zoom */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-rose-400 text-sm font-bold"
            >
              ✕ বন্ধ করুন
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
