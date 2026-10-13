import React, { useState, useEffect } from 'react';
import { PaymentMethodConfig } from '../../types';
import { X, CheckCircle2, AlertCircle, RefreshCw, Phone, DollarSign, FileText } from 'lucide-react';
import { Button } from '../common/Button';

interface PaymentMethodModalProps {
  isOpen: boolean;
  editingMethod: PaymentMethodConfig | null;
  onClose: () => void;
  onSave: (methodData: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Promise<void>;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  editingMethod,
  onClose,
  onSave,
}) => {
  const [provider, setProvider] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [nameBn, setNameBn] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [instructionsBn, setInstructionsBn] = useState('');
  const [minDeposit, setMinDeposit] = useState('50');
  const [minWithdraw, setMinWithdraw] = useState('100');
  const [enabled, setEnabled] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingMethod) {
      setProvider(editingMethod.provider);
      setNameBn(editingMethod.nameBn);
      setAccountNumber(editingMethod.accountNumber);
      setInstructionsBn(editingMethod.instructionsBn);
      setMinDeposit(editingMethod.minDeposit.toString());
      setMinWithdraw(editingMethod.minWithdraw.toString());
      setEnabled(editingMethod.enabled);
    } else {
      setProvider('bKash');
      setNameBn('বিকাশ পার্সোনাল (সেন্ড মানি)');
      setAccountNumber('');
      setInstructionsBn('উক্ত নম্বরে সেন্ড মানি করে ট্রানজেকশন আইডি (TrxID) বসিয়ে কনফার্ম করুন।');
      setMinDeposit('50');
      setMinWithdraw('100');
      setEnabled(true);
    }
    setErrorMsg(null);
  }, [editingMethod, isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (p: 'bKash' | 'Nagad' | 'Rocket' | 'Upay') => {
    setProvider(p);
    if (!editingMethod) {
      setNameBn(`${p} পার্সোনাল (সেন্ড মানি)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim() || !accountNumber.trim() || !instructionsBn.trim()) {
      setErrorMsg('সকল প্রয়োজনীয় ঘর সঠিক তথ্য দিয়ে পূরণ করুন।');
      return;
    }

    const minDepNum = Number(minDeposit);
    const minWithNum = Number(minWithdraw);

    if (isNaN(minDepNum) || minDepNum < 0 || isNaN(minWithNum) || minWithNum < 0) {
      setErrorMsg('সর্বনিম্ন আমাউন্ট অবশ্যই ধনাত্মক সংখ্যা হতে হবে।');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave(
        {
          provider,
          nameBn,
          accountNumber,
          instructionsBn,
          minDeposit: minDepNum,
          minWithdraw: minWithNum,
          enabled,
        },
        editingMethod?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'পেমেন্ট পদ্ধতি সংরক্ষণ করা সম্ভব হয়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">
          {editingMethod ? 'পেমেন্ট পদ্ধতি সম্পাদনা করুন' : 'নতুন পেমেন্ট পদ্ধতি যোগ করুন'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          অ্যাডমিন হিসেবে ব্যবহারকারীদের জন্য টাকা জমা ও উত্তোলনের অফিশিয়াল চ্যানেল কনফিগার করুন
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">পেমেন্ট মেথড প্রোভাইডার:</label>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold">
              {(['bKash', 'Nagad', 'Rocket', 'Upay'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    provider === p
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-extrabold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Name in Bengali */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              প্রদর্শিত নাম (বাংলায়):
            </label>
            <input
              type="text"
              required
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: বিকাশ পার্সোনাল (সেন্ড মানি)"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Receiving Account Number */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              অফিশিয়াল গ্রহণকারী নম্বর / অ্যাকাউন্ট আইডি:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01700-000000"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Minimum Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                সর্বনিম্ন ডিপোজিট (৳):
              </label>
              <input
                type="number"
                min="0"
                required
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                সর্বনিম্ন উইথড্র (৳):
              </label>
              <input
                type="number"
                min="0"
                required
                value={minWithdraw}
                onChange={(e) => setMinWithdraw(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              ব্যবহারকারীর জন্য পেমেন্ট নির্দেশাবলী (বাংলায়):
            </label>
            <textarea
              rows={3}
              required
              value={instructionsBn}
              onChange={(e) => setInstructionsBn(e.target.value)}
              placeholder="যেমন: উক্ত নম্বরটিতে টাকা সেন্ড মানি করুন এবং ট্রানজেকশন আইডি (TrxID) বসিয়ে ডিপোজিট সাবমিট করুন।"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Enabled Status Toggle */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              পেমেন্ট পদ্ধতিটি অবিলম্বে চালু (Active) রাখতে চান?
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </span>
            ) : editingMethod ? (
              'হালনাগাদ সংরক্ষণ করুন'
            ) : (
              'পেমেন্ট পদ্ধতি যুক্ত করুন'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
