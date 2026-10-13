import React from 'react';
import { Home, Trophy, Award, Wallet, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAiChat } from '../../context/AiChatContext';

interface MobileNavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  currentPage,
  onPageChange,
}) => {
  const { requireAuth } = useAuth();
  const { openChat } = useAiChat();

  const items = [
    { id: 'home', label: 'হোম', icon: Home, isProtected: false },
    { id: 'tournaments', label: 'টুর্নামেন্ট', icon: Trophy, isProtected: false },
    { id: 'leaderboard', label: 'লিডারবোর্ড', icon: Award, isProtected: false },
    { id: 'ai', label: 'এআই চ্যাট', icon: Bot, isProtected: false },
    { id: 'wallet', label: 'ওয়ালেট', icon: Wallet, isProtected: true },
  ];

  const handleClick = (id: string, isProtected: boolean) => {
    if (id === 'ai') {
      openChat();
      return;
    }
    if (isProtected) {
      requireAuth(() => {
        onPageChange(id);
      }, 'আপনার ওয়ালেট ও লেনদেনের ইতিহাস দেখতে প্রথমে অ্যাকাউন্টে লগইন করুন।');
    } else {
      onPageChange(id);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id, item.isProtected)}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] transition-all rounded-lg ${
                isActive
                  ? 'text-emerald-400 font-semibold bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : ''}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
