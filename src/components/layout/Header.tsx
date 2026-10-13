import React, { useState } from 'react';
import { Trophy, Wallet, Menu, X, User, LogOut, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';
import { BRAND_CONFIG } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import { useAiChat } from '../../context/AiChatContext';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onOpenAdmin: () => void;
  onOpenComplaint?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageChange,
  onOpenAdmin,
  onOpenComplaint,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const { openChat } = useAiChat();

  const navItems = [
    { id: 'home', label: 'হোম' },
    { id: 'tournaments', label: 'টুর্নামেন্ট' },
    { id: 'games', label: 'গেমসমূহ' },
    { id: 'leaderboard', label: 'লিডারবোর্ড' },
    { id: 'ai', label: 'দিগন্ত এআই' },
    { id: 'support', label: 'সহায়তা' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'ai') {
      openChat();
      setMobileMenuOpen(false);
      return;
    }
    onPageChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16 sm:h-20">
          {/* Zone 1: Official Brand Wordmark & Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                {BRAND_CONFIG.nameBn.split(' ')[0]} <span className="text-gradient-emerald">{BRAND_CONFIG.nameBn.split(' ')[1]}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase hidden sm:block">
                {BRAND_CONFIG.taglineBn}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop 1-line links) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    isActive
                      ? 'text-emerald-400 border-emerald-500 font-semibold'
                      : 'text-slate-300 border-transparent hover:text-white hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Account Action or Verified Wallet Status */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Quick Complaint Box Button */}
            <button
              onClick={() => {
                if (onOpenComplaint) onOpenComplaint();
                else onPageChange('support');
              }}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="অভিযোগ বক্স — যে কোনো সমস্যা বা চিটিং রিপোর্ট করুন"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>অভিযোগ বক্স</span>
            </button>

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
            )}

            {isAuthenticated && user ? (
              <>
                <button
                  onClick={() => handleNavClick('wallet')}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:border-emerald-500/60"
                >
                  <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">ব্যালেন্স:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">৳{user.walletBalance}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">{user.name}</span>
                  <button
                    onClick={logout}
                    title="লগআউট করুন"
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<User className="w-4 h-4" />}
                onClick={() => openAuthModal('এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।')}
              >
                লগইন করুন
              </Button>
            )}
          </div>

          {/* Mobile Actions Trigger */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('wallet')}
                className="flex items-center gap-1.5 bg-slate-900 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="tabular-nums">৳{user?.walletBalance || 0}</span>
              </button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAuthModal('এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।')}
              >
                লগইন
              </Button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-slate-800 px-4 py-4 space-y-3 animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenComplaint) onOpenComplaint();
                else onPageChange('support');
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 p-2.5 rounded-xl text-xs font-semibold transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>অভিযোগ বক্স (সমস্যা বা চিটিং রিপোর্ট)</span>
            </button>
            {isAdmin && (
              <Button
                variant="secondary"
                fullWidth
                size="md"
                icon={<ShieldCheck className="w-4 h-4 text-amber-400" />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
              >
                অ্যাডমিন ড্যাশবোর্ড
              </Button>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-semibold">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-rose-400 hover:underline font-medium"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <Button
                variant="primary"
                fullWidth
                size="md"
                icon={<User className="w-4 h-4" />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('এই সুবিধাটি ব্যবহার করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
                }}
              >
                লগইন / নিবন্ধন
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
