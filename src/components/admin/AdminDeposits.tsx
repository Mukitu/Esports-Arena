import React, { useState, useEffect } from 'react';
import { DepositRequest } from '../../types';
import { fetchAdminDepositRequests, approveDepositRequestRpc, rejectDepositRequestRpc } from '../../services/depositService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowDownLeft, CheckCircle2, XCircle, RefreshCw, AlertCircle, ShieldCheck, Search, Filter } from 'lucide-react';

export const AdminDeposits: React.FC = () => {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Confirmation Modals State
  const [approveModal, setApproveModal] = useState<{ open: boolean; request: DepositRequest | null }>({
    open: false,
    request: null,
  });

  const [rejectModal, setRejectModal] = useState<{ open: boolean; request: DepositRequest | null; reason: string }>({
    open: false,
    request: null,
    reason: '',
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminDepositRequests(statusFilter);
      setRequests(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'ডিপোজিট তালিকা লোড করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExecuteApprove = async () => {
    if (!approveModal.request) return;

    setProcessing(true);
    try {
      const res = await approveDepositRequestRpc(approveModal.request.id);
      if (res.success) {
        showToast(res.messageBn);
        setApproveModal({ open: false, request: null });
        await loadRequests();
      } else {
        setErrorMsg(res.messageBn);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'অনুমোদন প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!rejectModal.request || !rejectModal.reason.trim()) return;

    setProcessing(true);
    try {
      const res = await rejectDepositRequestRpc(rejectModal.request.id, rejectModal.reason.trim());
      if (res.success) {
        showToast(res.messageBn);
        setRejectModal({ open: false, request: null, reason: '' });
        await loadRequests();
      } else {
        setErrorMsg(res.messageBn);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'বাতিল প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setProcessing(false);
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

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
            <span>ডিপোজিট রিকোয়েস্ট <span className="text-emerald-400">ব্যবস্থাপনা (Deposit Requests)</span></span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ইউজারদের জমা দেওয়া পেমেন্ট ও Transaction ID (TrxID) যাচাই করে ওয়ালেটে অ্যাটমিক ক্রেডিট করুন
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          রিফ্রেশ করুন
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'pending', label: 'অপেক্ষমাণ (Pending)' },
          { id: 'approved', label: 'অনুমোদিত (Approved)' },
          { id: 'rejected', label: 'প্রত্যাখ্যাত (Rejected)' },
          { id: 'all', label: 'সকল রিকোয়েস্ট' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shrink-0 ${
              statusFilter === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 font-bold'
                : 'bg-[#0f172a] text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests}>
            আবার চেষ্টা করুন
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-[#0f172a] rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">ডিপোজিট রিকোয়েস্ট লোড হচ্ছে...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 bg-[#0f172a] rounded-2xl border border-slate-800 text-center space-y-3">
          <ArrowDownLeft className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">
            কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।
          </h3>
          <p className="text-xs text-slate-400">
            বর্তমান ফিল্টারে কোনো রিকোয়েস্ট নেই।
          </p>
        </div>
      ) : (
        /* Requests Table View */
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">ইউজার & সময়</th>
                  <th className="py-3.5 px-4 font-semibold">পেমেন্ট মাধ্যম</th>
                  <th className="py-3.5 px-4 font-semibold">প্রেরক নম্বর & TrxID</th>
                  <th className="py-3.5 px-4 font-semibold">পরিমাণ</th>
                  <th className="py-3.5 px-4 font-semibold text-center">অবস্থা</th>
                  <th className="py-3.5 px-4 font-semibold text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      <div>
                        <span className="block text-sm">{req.userDisplayName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {new Date(req.createdAt).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-900 border border-slate-700 text-emerald-400 mr-2">
                        {req.paymentProvider}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{req.paymentMethodName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-200 block">{req.senderNumber}</span>
                      <span className="font-mono text-xs text-emerald-400 font-bold">{req.trxId}</span>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-emerald-400 text-base tabular-nums">
                      ৳{req.amount}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {req.status === 'approved' ? (
                        <Badge variant="emerald">অনুমোদিত</Badge>
                      ) : req.status === 'pending' ? (
                        <Badge variant="amber">যাচাইয়ের অপেক্ষায়</Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="rose">বাতিল করা হয়েছে</Badge>
                          {req.rejectionReason && (
                            <span className="text-[10px] text-rose-400 block max-w-xs truncate">
                              {req.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => setApproveModal({ open: true, request: req })}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => setRejectModal({ open: true, request: req, reason: '' })}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModal.open && approveModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <ShieldCheck className="w-6 h-6" />
              <span>ডিপোজিট অনুমোদন কনফার্মেশন</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনি কি এই ডিপোজিটটি যাচাই করে অনুমোদন করতে চান? অনুমোদনের পর নির্ধারিত পরিমাণ (<strong className="text-emerald-400">৳{approveModal.request.amount}</strong>) ইউজারের ওয়ালেটে যোগ হবে।
            </p>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1 font-mono text-slate-300">
              <p>ইউজার: <strong className="text-white">{approveModal.request.userDisplayName}</strong></p>
              <p>প্রোভাইডার: <strong className="text-emerald-400">{approveModal.request.paymentProvider}</strong></p>
              <p>TrxID: <strong className="text-emerald-400">{approveModal.request.trxId}</strong></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={processing}
                onClick={() => setApproveModal({ open: false, request: null })}
              >
                বাতিল করুন
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processing}
                onClick={handleExecuteApprove}
              >
                {processing ? 'অনুমোদন হচ্ছে...' : 'হ্যাঁ, অনুমোদন করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400">ডিপোজিট রিকোয়েস্ট বাতিল করুন</h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                বাতিল করার কারণ উল্লেখ করুন:
              </label>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="যেমন: ভুল Transaction ID প্রদান করা হয়েছে অথবা পেমেন্ট স্টেটমেন্টে পাওয়া যায়নি।"
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={processing}
                onClick={() => setRejectModal({ open: false, request: null, reason: '' })}
              >
                ফিরে যান
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={processing || !rejectModal.reason.trim()}
                onClick={handleExecuteReject}
              >
                {processing ? 'বাতিল হচ্ছে...' : 'বাতিল নিশ্চিত করুন'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
