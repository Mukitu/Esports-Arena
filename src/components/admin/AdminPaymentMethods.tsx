import React, { useState, useEffect } from 'react';
import { PaymentMethodConfig } from '../../types';
import { fetchAdminPaymentMethods, createPaymentMethod, updatePaymentMethod, togglePaymentMethodStatus, deletePaymentMethod } from '../../services/paymentService';
import { PaymentMethodModal } from './PaymentMethodModal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Plus, Edit2, Power, Trash2, RefreshCw, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const AdminPaymentMethods: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);

  // Confirmation Modal State for Toggle / Delete
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: '',
    action: async () => {},
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'পেমেন্ট পদ্ধতি লোড করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAddModal = () => {
    if (!isSuperAdmin) {
      setErrorMsg('শুধুমাত্র Super Admin পেমেন্ট মেথড কনফিগারেশন পরিবর্তন করতে পারবেন।');
      return;
    }
    setEditingMethod(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (method: PaymentMethodConfig) => {
    if (!isSuperAdmin) {
      setErrorMsg('শুধুমাত্র Super Admin পেমেন্ট মেথড কনফিগারেশন পরিবর্তন করতে পারবেন।');
      return;
    }
    setEditingMethod(method);
    setModalOpen(true);
  };

  const handleSaveMethod = async (
    methodData: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      await updatePaymentMethod(editId, methodData);
      showToast('পেমেন্ট পদ্ধতিটি সফলভাবে আপডেট করা হয়েছে।');
    } else {
      await createPaymentMethod(methodData);
      showToast('নতুন পেমেন্ট পদ্ধতিটি সফলভাবে যুক্ত করা হয়েছে।');
    }
    await loadMethods();
  };

  const handleToggleClick = (method: PaymentMethodConfig) => {
    if (!isSuperAdmin) {
      setErrorMsg('শুধুমাত্র Super Admin পেমেন্ট মেথড কনফিগারেশন পরিবর্তন করতে পারবেন।');
      return;
    }
    const nextState = !method.enabled;
    const title = nextState
      ? `আপনি কি "${method.nameBn}" পেমেন্ট পদ্ধতিটি চালু করতে চান?`
      : `আপনি কি "${method.nameBn}" পেমেন্ট পদ্ধতিটি বন্ধ করতে চান?`;

    setConfirmModal({
      open: true,
      title,
      action: async () => {
        await togglePaymentMethodStatus(method.id, nextState);
        showToast(nextState ? 'পেমেন্ট পদ্ধতিটি চালু করা হয়েছে।' : 'পেমেন্ট পদ্ধতিটি বন্ধ করা হয়েছে।');
        await loadMethods();
      },
    });
  };

  const handleDeleteClick = (method: PaymentMethodConfig) => {
    if (!isSuperAdmin) {
      setErrorMsg('শুধুমাত্র Super Admin পেমেন্ট মেথড কনফিগারেশন পরিবর্তন করতে পারবেন।');
      return;
    }
    setConfirmModal({
      open: true,
      title: `আপনি কি নিশ্চিত যে "${method.nameBn}" পদ্ধতিটি মুছে ফেলতে চান?`,
      action: async () => {
        await deletePaymentMethod(method.id);
        showToast('পেমেন্ট পদ্ধতিটি মুছে ফেলা হয়েছে।');
        await loadMethods();
      },
    });
  };

  const executeConfirmAction = async () => {
    try {
      await confirmModal.action();
    } catch (err: any) {
      setErrorMsg(err.message || 'কার্যক্রম সম্পন্ন করা সম্ভব হয়নি।');
    } finally {
      setConfirmModal({ open: false, title: '', action: async () => {} });
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

      {/* Non-Super-Admin Restriction Notice */}
      {!isSuperAdmin && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            শুধুমাত্র Super Admin পেমেন্ট মেথড কনফিগারেশন (মার্চেন্ট অ্যাকাউন্ট ও ট্রানজেকশন সেটিংস) পরিবর্তন করতে পারবেন।
          </span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>পেমেন্ট পদ্ধতি <span className="text-emerald-400">ব্যবস্থাপনা (Payment Methods)</span></span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            প্লাটফর্মে ডিপোজিট ও উইথড্র এর জন্য অফিশিয়াল মার্চেন্ট ও সেন্ড মানি অ্যাকাউন্ট কনফিগার করুন
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAddModal}
        >
          নতুন পেমেন্ট পদ্ধতি যোগ করুন
        </Button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadMethods}>
            পুনরায় চেষ্টা করুন
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-[#0f172a] rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">পেমেন্ট মেথড তালিকা লোড হচ্ছে...</p>
        </div>
      ) : methods.length === 0 ? (
        /* Empty State when no payment methods exist */
        <div className="p-12 bg-[#0f172a] rounded-2xl border border-slate-800 text-center space-y-4">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">
              এখনো কোনো পেমেন্ট পদ্ধতি যোগ করা হয়নি।
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ব্যবহারকারীদের জন্য ডিপোজিট ও উইথড্র সচল করতে উপরে "+ নতুন পেমেন্ট পদ্ধতি যোগ করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAddModal}>
            প্রথম পেমেন্ট পদ্ধতি যোগ করুন
          </Button>
        </div>
      ) : (
        /* Payment Methods Table View */
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">পেমেন্ট পদ্ধতি</th>
                  <th className="py-3.5 px-4 font-semibold">গ্রহণকারী নম্বর</th>
                  <th className="py-3.5 px-4 font-semibold">সর্বনিম্ন জমা</th>
                  <th className="py-3.5 px-4 font-semibold">সর্বনিম্ন উত্তোলন</th>
                  <th className="py-3.5 px-4 font-semibold text-center">অবস্থা</th>
                  <th className="py-3.5 px-4 font-semibold text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-900 border border-slate-700 text-emerald-400">
                          {method.provider}
                        </span>
                        <span>{method.nameBn}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-300">
                      {method.accountNumber}
                    </td>
                    <td className="py-4 px-4 font-semibold tabular-nums">
                      ৳{method.minDeposit}
                    </td>
                    <td className="py-4 px-4 font-semibold tabular-nums">
                      ৳{method.minWithdraw}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {method.enabled ? (
                        <Badge variant="emerald">চালু</Badge>
                      ) : (
                        <Badge variant="rose">বন্ধ</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleClick(method)}
                          title={method.enabled ? 'পদ্ধতিটি বন্ধ করুন' : 'পদ্ধতিটি চালু করুন'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            method.enabled
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/40'
                              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/40'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(method)}
                          title="সম্পাদনা করুন"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(method)}
                          title="মুছে ফেলুন"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog for Add/Edit */}
      <PaymentMethodModal
        isOpen={modalOpen}
        editingMethod={editingMethod}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveMethod}
      />

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal({ open: false, title: '', action: async () => {} })}
              >
                বাতিল করুন
              </Button>
              <Button variant="primary" size="sm" onClick={executeConfirmAction}>
                হ্যাঁ, নিশ্চিত করুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
