import React, { useState, useEffect } from 'react';
import { fetchAdminPaymentMethods } from '../../services/paymentService';
import { fetchAdminDepositRequests } from '../../services/depositService';
import { fetchUserAnalytics } from '../../services/userManagementService';
import { UserRegistrationAnalytics } from '../../types';
import { BRAND_CONFIG } from '../../config/brand';
import { CreditCard, ShieldCheck, ArrowDownLeft, ArrowRight, Users, UserPlus, Trophy, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [methodCount, setMethodCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [analytics, setAnalytics] = useState<UserRegistrationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [methodsResult, depositsResult, analyticsResult] = await Promise.allSettled([
        fetchAdminPaymentMethods(),
        fetchAdminDepositRequests('pending'),
        fetchUserAnalytics(),
      ]);

      if (methodsResult.status === 'fulfilled') {
        const methods = methodsResult.value;
        setMethodCount(methods.length);
        setActiveCount(methods.filter((m) => m.enabled).length);
      }

      if (depositsResult.status === 'fulfilled') {
        setPendingDeposits(depositsResult.value.length);
      }

      if (analyticsResult.status === 'fulfilled') {
        setAnalytics(analyticsResult.value);
      }
    } catch (err) {
      console.error('Error loading admin overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#0f172a] to-emerald-950/40 rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>অফিশিয়াল অ্যাডমিন কন্ট্রোল প্যানেল</span>
          </div>
          <button
            onClick={loadMetrics}
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>ডাটা রিফ্রেশ</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          স্বাগতম <span className="text-emerald-400">{BRAND_CONFIG.nameBn}</span> অ্যাডমিন ড্যাশবোর্ডে
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          এখান থেকে আপনি নিবন্ধিত ইউজারদের এনালিটিক্স দেখতে পারবেন, রোল পরিবর্তন করতে পারবেন এবং পেমেন্ট ও ডিপোজিট রিকোয়েস্ট পরিচালনা করতে পারবেন।
        </p>
      </div>

      {/* USER REGISTRATION ANALYTICS CARDS (PART C) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>ইউজার রেজিস্ট্রেশন অ্যানালিটিক্স (Asia/Dhaka)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">মোট ইউজার</span>
            <div className="text-2xl font-black text-white tabular-nums">
              {loading ? '...' : analytics?.totalUsers || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">সর্বমোট নিবন্ধিত</span>
          </div>

          <div className="bg-[#0f172a] rounded-2xl border border-emerald-500/30 p-4 space-y-1">
            <span className="text-[11px] text-emerald-400 block font-semibold flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>আজকের নতুন</span>
            </span>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {loading ? '...' : analytics?.todayUsers || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">আজকে যুক্ত হয়েছেন</span>
          </div>

          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">গতকাল</span>
            <div className="text-2xl font-black text-teal-300 tabular-nums">
              {loading ? '...' : analytics?.yesterdayUsers || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">গতকালের নিবন্ধন</span>
          </div>

          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">গত ৭ দিন</span>
            <div className="text-2xl font-black text-cyan-400 tabular-nums">
              {loading ? '...' : analytics?.last7DaysUsers || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">সাপ্তাহিক প্রবৃদ্ধি</span>
          </div>

          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">এই মাসে</span>
            <div className="text-2xl font-black text-indigo-400 tabular-nums">
              {loading ? '...' : analytics?.thisMonthUsers || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">চলতি মাসের নিবন্ধন</span>
          </div>

          <div className="bg-[#0f172a] rounded-2xl border border-amber-500/30 p-4 space-y-1">
            <span className="text-[11px] text-amber-400 block font-semibold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>টুর্নামেন্ট জয়েন</span>
            </span>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {loading ? '...' : analytics?.totalTournamentRegistrations || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">মোট এন্ট্রি রেজিস্টার</span>
          </div>
        </div>
      </div>

      {/* DAILY REGISTRATION TREND CHART & RECENT USERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Visualizer */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>প্রতিদিনের ইউজার রেজিস্ট্রেশন ট্রেন্ড (Daily Trend)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Asia/Dhaka</span>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            {analytics?.dailyTrend && analytics.dailyTrend.length > 0 ? (
              <div className="flex items-end justify-between gap-3 h-40 pt-6">
                {analytics.dailyTrend.map((item, idx) => {
                  const maxVal = Math.max(...analytics.dailyTrend.map((d) => d.count), 1);
                  const heightPercent = Math.max(15, (item.count / maxVal) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[11px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                      />
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono mt-1">
                        {item.dateFormattedBn}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                ট্রেন্ড ডাটা লোড হচ্ছে...
              </div>
            )}
          </div>
        </div>

        {/* Recent Registrations Widget */}
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>সর্বশেষ নিবন্ধিত ইউজারগণ</span>
            </h3>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              সব দেখুন
            </button>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            {!analytics?.latestUsers || analytics.latestUsers.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">ইউজার পাওয়া যায়নি।</p>
            ) : (
              analytics.latestUsers.map((u) => (
                <div key={u.id} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{u.displayName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{u.email || u.phone || u.id}</span>
                  </div>
                  <Badge variant={u.roles.includes('super_admin') ? 'amber' : 'slate'}>
                    {u.roles.includes('super_admin') ? 'Super Admin' : 'Player'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operational Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>অপেক্ষমাণ ডিপোজিট রিকোয়েস্ট</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
            {loading ? '...' : `${pendingDeposits} টি`}
          </div>
          <span className="text-[11px] text-slate-500 block">যাচাই ও অনুমোদনের অপেক্ষায় রয়েছে</span>
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>সক্রিয় পেমেন্ট চ্যানেল (Active)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
            {loading ? '...' : `${activeCount} টি`}
          </div>
          <span className="text-[11px] text-slate-500 block">ব্যবহারকারীরা ডিপোজিটে দেখছেন</span>
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>মোট কনফিগারকৃত মেথড</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
            {loading ? '...' : `${methodCount} টি`}
          </div>
          <span className="text-[11px] text-slate-500 block">ডেটাবেসে নিবন্ধিত পেমেন্ট চ্যানেল</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>ইউজার ব্যবস্থাপনা</span>
            </h3>
            <p className="text-xs text-slate-400">নিবন্ধিত গেমার অনুসন্ধান ও ম্যানুয়াল রোল অ্যাসাইন করুন।</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('users')}
          >
            ইউজার তালিকা দেখুন
          </Button>
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              <span>ডিপোজিট ব্যবস্থাপনা</span>
            </h3>
            <p className="text-xs text-slate-400">ইউজারদের ডিপোজিট যাচাই করে ওয়ালেটে টাকা যোগ করুন।</p>
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('deposits')}
          >
            ডিপোজিট রিকোয়েস্ট দেখুন
          </Button>
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>পেমেন্ট পদ্ধতি কনফিগারেশন</span>
            </h3>
            <p className="text-xs text-slate-400">নতুন বিকাশ/নগদ চ্যানেল চালু বা পরিবর্তন করুন।</p>
          </div>
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => onNavigate('payments')}
          >
            পেমেন্ট পদ্ধতি তালিকা
          </Button>
        </div>
      </div>
    </div>
  );
};
