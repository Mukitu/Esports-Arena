import React from 'react';
import { GameId } from '../../types';
import { Search, Flame, Crosshair, Zap, Trophy, Filter } from 'lucide-react';

interface TournamentFiltersProps {
  selectedGame: GameId | 'all';
  onGameSelect: (game: GameId | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: 'all' | 'upcoming' | 'live' | 'completed';
  onStatusSelect: (status: 'all' | 'upcoming' | 'live' | 'completed') => void;
}

export const TournamentFilters: React.FC<TournamentFiltersProps> = ({
  selectedGame,
  onGameSelect,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusSelect,
}) => {
  const games = [
    { id: 'all', label: 'সব গেম', icon: Trophy },
    { id: 'free_fire', label: 'ফ্রি ফায়ার', icon: Flame },
    { id: 'pubg_mobile', label: 'পাবজি মোবাইল', icon: Crosshair },
    { id: 'blood_strike', label: 'ব্লাড স্ট্রাইক', icon: Zap },
    { id: 'efootball', label: 'ই-ফুটবল', icon: Trophy },
  ];

  const statuses = [
    { id: 'all', label: 'সকল স্ট্যাটাস' },
    { id: 'upcoming', label: 'আসন্ন' },
    { id: 'live', label: 'লাইভ' },
    { id: 'completed', label: 'সম্পন্ন' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Input & Status Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="টুর্নামেন্টের নাম বা গেম সার্চ করুন..."
            className="w-full bg-[#0f172a] border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Status Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#0f172a] border border-slate-800 rounded-xl overflow-x-auto">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusSelect(st.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                selectedStatus === st.id
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game Filter Tabs (Segmented Buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {games.map((game) => {
          const Icon = game.icon;
          const isSelected = selectedGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onGameSelect(game.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all border whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/60 shadow-md shadow-emerald-950/20'
                  : 'bg-[#0f172a] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{game.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
