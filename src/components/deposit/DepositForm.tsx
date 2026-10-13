import React, { useState, useEffect } from 'react';
import { PaymentMethodConfig } from '../../types';
import { fetchPaymentMethods } from '../../services/paymentService';
import { submitDepositRequest } from '../../services/depositService';
import { Button } from '../common/Button';
import { Copy, AlertCircle, CheckCircle2, RefreshCw, ArrowDownLeft, ShieldCheck } from 'lucide-react';

interface DepositFormProps {
  onSuccess: () => void;
}

export const DepositForm: React.FC<DepositFormProps> = ({ onSuccess }) => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form Inputs
  const [amount, setAmount] = useState('100');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    setLoadingConfig(true);
    setConfigError(null);
    try {
      const data = await fetchPaymentMethods();
      setMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0]);
        setAmount(data[0].minDeposit.toString());
      }
    } catch (err: any) {
      setConfigError('পেমেন্টের তথ্য লোড করা যায়নি।');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleCopyNumber = () => {
    if (!selectedMethod) return;
    navigator.clipboard.writeText(selectedMethod.accountNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    if (!senderNumber.trim() || !trxId.trim()) {
      setSubmitError('প্রেরক নম্বর এবং Transaction ID ফাঁকা রাখা যাবে না।');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < selectedMethod.minDeposit) {
      setSubmitError(`সর্বনিম্ন ডিপোজিট সীমা ৳${selectedMethod.minDeposit}`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitDepositRequest({
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.nameBn,
        paymentProvider: selectedMethod.provider,
        amount: numAmount,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim(),
      });

      if (!res.success) {
        setSubmitError(res.errorBn || 'ডিপোজিট রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি।');
      } else {
        setSubmitSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      setSubmitError('একটি অপ্রত্যাশিত সমস্যা ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="p-8 text-center space-y-3 bg-[#0f172a] rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">সক্রিয় পেমেন্ট পদ্ধতি লোড হচ্ছে...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="p-6 bg-rose-950/30 border border-rose-500/30 rounded-xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-xs font-semibold text-rose-300">{configError}</p>
        <Button variant="outline" size="sm" onClick={loadMethods}>
          আবার চেষ্টা করুন
        </Button>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-200">
            বর্তমানে কোনো পেমেন্ট পদ্ধতি চালু নেই।
          </h4>
          <p className="text-xs text-slate-400">
            অ্যাডমিন পেমেন্ট পদ্ধতি চালু করলে এখানে দেখতে পাবেন।
          </p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
        <h4 className="text-lg font-bold text-emerald-400">
          ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে।
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
          আপনার পেমেন্ট বর্তমানে যাচাইয়ের অপেক্ষায় রয়েছে। অ্যাডমিন তথ্য মিলিয়ে অনুমোদন (Approve) করলে অবিলম্বে আপনার ওয়ালেটে টাকা যোগ হয়ে যাবে।
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitSuccess(false);
            setTrxId('');
            setSenderNumber('');
          }}
        >
          নতুন রিকোয়েস্ট জমা দিন
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-5 max-w-xl mx-auto shadow-xl">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          <span>টাকা জমা করুন (ডিপোজিট রিকোয়েস্ট)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          অফিসিয়াল মার্চেন্ট নম্বর বা অ্যাকাউন্টে সেন্ড মানি করে TrxID সাবমিট করুন
        </p>
      </div>

      {submitError && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Payment Provider Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
          পেমেন্ট মাধ্যম নির্বাচন করুন:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          {methods.map((method) => {
            const isSelected = selectedMethod?.id === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setSelectedMethod(method);
                  setAmount(method.minDeposit.toString());
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="block text-sm font-extrabold">{method.provider}</span>
                <span className="text-[10px] font-normal block text-slate-400 mt-0.5 truncate">
                  {method.nameBn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Receiving Account Box */}
      {selectedMethod && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">
              অফিশিয়াল গ্রহণকারী নম্বর ({selectedMethod.provider}):
            </span>
            <span className="text-[11px] text-emerald-400">
              সর্বনিম্ন ডিপোজিট: ৳{selectedMethod.minDeposit}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-base font-bold text-white">
            <span>{selectedMethod.accountNumber}</span>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedNumber ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
            </button>
          </div>

          {selectedMethod.instructionsBn && (
            <div className="p-2.5 bg-slate-950/60 rounded-lg text-xs text-slate-300 border border-slate-800/80 leading-relaxed">
              <span className="text-emerald-400 font-semibold block mb-0.5">• নির্দেশাবলী:</span>
              <span>{selectedMethod.instructionsBn}</span>
            </div>
          )}
        </div>
      )}

      {/* Form Submission Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            ডিপোজিটের পরিমাণ (BDT ৳):
          </label>
          <input
            type="number"
            min={selectedMethod?.minDeposit || 50}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number):
          </label>
          <input
            type="tel"
            required
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="01712345678"
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            ট্রানজেকশন আইডি (Transaction ID / TrxID):
          </label>
          <input
            type="text"
            required
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            placeholder="যেমন: TRX8839210"
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none"
          />
        </div>

        {/* Verification Rules Notice */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>সিকিউরিটি ও ট্রাস্ট নোটিশ:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            TrxID জমা দেওয়ার পর অ্যাডমিন পেমেন্ট সঠিকতা পাওয়ার সাথে সাথে ওয়ালেটে টাকা যোগ হয়ে যাবে।
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>প্রসেসিং হচ্ছে...</span>
            </span>
          ) : (
            `ডিপোজিট রিকোয়েস্ট জমা দিন (৳${amount})`
          )}
        </Button>
      </form>
    </div>
  );
};
