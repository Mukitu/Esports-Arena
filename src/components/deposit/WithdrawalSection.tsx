import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle, AlertCircle, Save, Smartphone, User, CreditCard, RefreshCw, History, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { updateUserWithdrawalProfile } from '../../services/profileService';
import { submitWithdrawalRequest, fetchUserWithdrawalRequests } from '../../services/withdrawalService';
import { WithdrawalRequest } from '../../types';

export const WithdrawalSection: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.withdrawalProfile) {
      setMethod((user.withdrawalProfile.method as any) || 'bKash');
      setAccountNumber(user.withdrawalProfile.accountNumber || '');
      setAccountName(user.withdrawalProfile.accountName || '');
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchUserWithdrawalRequests();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load withdrawal history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      setFeedback({ type: 'error', msg: 'অনুগ্রহ করে অ্যাকাউন্ট/মোবাইল নম্বর প্রদান করুন।' });
      return;
    }

    setSavingProfile(true);
    setFeedback(null);

    const res = await updateUserWithdrawalProfile({
      method,
      accountNumber,
      accountName,
    });

    if (res.success) {
      await refreshUserData();
      setFeedback({ type: 'success', msg: res.messageBn });
    } else {
      setFeedback({ type: 'error', msg: res.messageBn });
    }
    setSavingProfile(false);
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!accountNumber.trim()) {
      setFeedback({ type: 'error', msg: 'অনুগ্রহ করে প্রথমে আপনার উইথড্রয়াল প্রোফাইল নম্বর সেভ করুন।' });
      return;
    }

    const amt = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt < 50) {
      setFeedback({ type: 'error', msg: 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।' });
      return;
    }

    if (user && amt > user.walletBalance) {
      setFeedback({ type: 'error', msg: `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${user.walletBalance}` });
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const res = await submitWithdrawalRequest({
        paymentMethod: method,
        accountNumber,
        accountName,
        amount: amt,
      });

      if (res.success) {
        setFeedback({ type: 'success', msg: res.messageBn });
        setWithdrawAmount('');
        await refreshUserData();
        await loadHistory();
      } else {
        setFeedback({ type: 'error', msg: res.messageBn });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'উইথড্রয়াল রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।' });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Withdrawal Profile Card */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>ডিফল্ট উইথড্রয়াল প্রোফাইল সেটিং</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রাইজমানি উইথড্র করার জন্য আপনার পেমেন্ট অ্যাকাউন্ট তথ্য সংরক্ষণ করুন
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              উইথড্রয়াল পেমেন্ট মাধ্যম নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['bKash', 'Nagad', 'Rocket', 'Upay'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    method === m
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Number Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {method} ওয়ালেট / মোবাইল নম্বর:
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="যেমন: 01700000000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Account Holder Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              অ্যাকাউন্ট হোল্ডারের নাম (ঐচ্ছিক):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="যেমন: মোঃ সাকিব হোসেন"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={savingProfile}
            icon={savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            size="md"
          >
            {savingProfile ? 'সংরক্ষণ করা হচ্ছে...' : 'উইথড্রয়াল প্রোফাইল সেভ করুন'}
          </Button>
        </form>
      </div>

      {/* Cashout Request Form */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          <span>টাকা উত্তোলন (উইথড্রয়াল রিকোয়েস্ট)</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          আপনার সংরক্ষিত উইথড্রয়াল প্রোফাইল (<strong className="text-emerald-400">{method} {accountNumber || '(অনির্ধারিত)'}</strong>)-এ প্রাইজমানি প্রেরণের অনুরোধ জানানো হবে। রিকোয়েস্ট সাবমিট করার সাথে সাথেই অ্যাকাউন্ট থেকে টাকা কেটে নেওয়া হবে।
        </p>

        <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 block">
                উইথড্র পরিমাণ (BDT):
              </label>
              <span className="text-xs text-emerald-400 font-bold">
                অবশিষ্ট ব্যালেন্স: ৳{user?.walletBalance || 0}
              </span>
            </div>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="সর্বনিম্ন ৫০ টাকা"
              min={50}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={submittingWithdrawal}
            icon={submittingWithdrawal ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
          >
            {submittingWithdrawal ? 'রিকোয়েস্ট প্রসেস হচ্ছে...' : 'ক্যাশআউট রিকোয়েস্ট পাঠান (তাত্ক্ষণিক ব্যালেন্স কর্তন)'}
          </Button>
        </form>
      </div>

      {/* Withdrawal Request History List */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>আমার উইথড্রয়াল রিকোয়েস্ট ইতিহাস</span>
          </h3>
          <button
            onClick={loadHistory}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {loadingHistory ? (
          <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>ইতিহাস লোড হচ্ছে...</span>
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            আপনার কোনো পূর্ববর্তী উইথড্রয়াল রিকোয়েস্ট নেই।
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-400 text-sm font-mono">৳{item.amount}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold">
                      {item.paymentMethod} - {item.accountNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {item.rejectionReason && (
                    <p className="text-[10px] text-rose-400">কারণ: {item.rejectionReason}</p>
                  )}
                </div>

                <div>
                  {item.status === 'approved' ? (
                    <Badge variant="emerald">অনুমোদিত</Badge>
                  ) : item.status === 'pending' ? (
                    <Badge variant="amber">পর্যালোচনাধীন (টাকা কাটা হয়েছে)</Badge>
                  ) : (
                    <Badge variant="rose">বাতিল (রিফান্ডড)</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
