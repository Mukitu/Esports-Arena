import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DepositForm } from '../components/deposit/DepositForm';
import { DepositHistory } from '../components/deposit/DepositHistory';
import { WithdrawalSection } from '../components/deposit/WithdrawalSection';

export const WalletPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');

  // If Unauthenticated, Render Security Guard Screen
  if (!isAuthenticated || !user) {
    return (
      <div className="py-16 sm:py-24 bg-[#090d16] min-h-screen flex items-center justify-center p-4">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">আমার ওয়ালেট সুরক্ষা</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।
            </p>
          </div>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => openAuthModal('এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।')}
          >
            লগইন করুন
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 bg-[#090d16] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <span>মাই <span className="text-emerald-400">ওয়ালেট & ক্যাশআউট</span></span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            আপনার অ্যাকাউন্ট ব্যালেন্স, ডিপোজিট রিকোয়েস্ট ও লেনদেনের ইতিহাস
          </p>
        </div>

        {/* Verified User Balance Overview Card */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#0f172a] to-emerald-950/40 rounded-2xl p-6 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              বর্তমান ওয়ালেট ব্যালেন্স
            </span>
            <div className="text-3xl sm:text-5xl font-black text-emerald-400 tabular-nums">
              ৳{user.walletBalance}
            </div>
            <p className="text-xs text-slate-400 pt-1">
              ইউজার আইডি: <strong className="text-slate-200">{user.phone}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowDownLeft className="w-4 h-4" />}
              onClick={() => setActiveTab('deposit')}
              className="flex-1 md:flex-none"
            >
              টাকা জমা (ডিপোজিট)
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<ArrowUpRight className="w-4 h-4" />}
              onClick={() => setActiveTab('withdraw')}
              className="flex-1 md:flex-none"
            >
              টাকা উত্তোলন (উইথড্র)
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'deposit'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>টাকা জমা করুন</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ডিপোজিট ইতিহাস</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'withdraw'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>উইথড্র রিকোয়েস্ট</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'deposit' && (
          <DepositForm onSuccess={() => setActiveTab('history')} />
        )}

        {activeTab === 'history' && <DepositHistory />}

        {activeTab === 'withdraw' && <WithdrawalSection />}
      </div>
    </div>
  );
};
