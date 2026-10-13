import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BRAND_CONFIG } from '../../config/brand';
import { AdminOverview } from './AdminOverview';
import { AdminPaymentMethods } from './AdminPaymentMethods';
import { AdminDeposits } from './AdminDeposits';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminUsers } from './AdminUsers';
import { AdminTournaments } from './AdminTournaments';
import { AdminResults } from './AdminResults';
import { AdminLeaderboard } from './AdminLeaderboard';
import { AdminComplaints } from './AdminComplaints';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Shield, ShieldCheck, LayoutDashboard, CreditCard, ArrowDownLeft, ArrowUpRight, LogOut, ArrowLeft, Lock, User, Users, Trophy, CheckSquare, Award, ShieldAlert } from 'lucide-react';

interface AdminLayoutProps {
  onReturnToApp: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onReturnToApp }) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'tournaments' | 'results' | 'deposits' | 'withdrawals' | 'payments' | 'leaderboard' | 'complaints'
  >('overview');

  // Security Access Guard: Reject unauthenticated or non-admin users
  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-2xl text-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">অ্যাডমিন ড্যাশবোর্ড সিকিউরিটি</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে প্রথমে সুপাবেস অ্যাডমিন অ্যাকাউন্টে লগইন করতে হবে।
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => openAuthModal('অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন।')}
            >
              অ্যাডমিন লগইন করুন
            </Button>
            <Button variant="ghost" fullWidth size="md" onClick={onReturnToApp}>
              মূল প্ল্যাটফর্মে ফিরে যান
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="py-20 min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-2xl text-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">প্রবেশাধিকার সংরক্ষিত (Access Denied)</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনার এই অ্যাডমিন সেকশনে প্রবেশের অনুমতি (Permission) নেই। কেবল অনুমোদিত অ্যাডমিনগণ এটি অ্যাক্সেস করতে পারবেন।
            </p>
          </div>
          <Button variant="primary" fullWidth size="lg" onClick={onReturnToApp}>
            মূল প্ল্যাটফর্মে ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>মূল ওয়েবসাইটে যান</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              {BRAND_CONFIG.nameBn} <span className="text-emerald-400">অ্যাডমিন কন্ট্রোল</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Identity Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200 font-semibold">{user.name}</span>
            <Badge variant={isSuperAdmin ? 'amber' : 'emerald'}>
              {isSuperAdmin ? 'Super Admin' : user.roles?.includes('admin') ? 'Admin' : 'Admin Staff'}
            </Badge>
          </div>

          <button
            onClick={logout}
            title="লগআউট করুন"
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Shell Layout */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="p-3 bg-[#0f172a] rounded-xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
              অ্যাডমিন মেনু
            </span>
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ওভারভিউ (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'tournaments'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>টুর্নামেন্ট ব্যবস্থাপনা</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>লিডারবোর্ড ব্যবস্থাপনা</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'results'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>রেজাল্ট যাচাইকরণ</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'users'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ইউজার ব্যবস্থাপনা</span>
            </button>

            <button
              onClick={() => setActiveTab('deposits')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'deposits'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>ডিপোজিট ব্যবস্থাপনা</span>
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'withdrawals'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>উইথড্রয়াল ব্যবস্থাপনা</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'payments'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>পেমেন্ট পদ্ধতি কনফিগারেশন</span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                activeTab === 'complaints'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>অভিযোগসমূহ (Complaints)</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-grow min-w-0">
          {activeTab === 'overview' && <AdminOverview onNavigate={(t: any) => setActiveTab(t)} />}
          {activeTab === 'tournaments' && <AdminTournaments />}
          {activeTab === 'leaderboard' && <AdminLeaderboard />}
          {activeTab === 'results' && <AdminResults />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'deposits' && <AdminDeposits />}
          {activeTab === 'withdrawals' && <AdminWithdrawals />}
          {activeTab === 'payments' && <AdminPaymentMethods />}
          {activeTab === 'complaints' && <AdminComplaints />}
        </main>
      </div>
    </div>
  );
};
