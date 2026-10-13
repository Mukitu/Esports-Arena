import React from 'react';
import { Tournament } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Trophy, Users, Clock, Flame, Crosshair, Zap, Shield, ArrowRight } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onSelect,
}) => {
  const percentageJoined = Math.min(
    100,
    Math.round((tournament.joinedSlots / tournament.maxSlots) * 100)
  );

  const isFull = tournament.joinedSlots >= tournament.maxSlots;

  const getGameIcon = (gameId: string) => {
    switch (gameId) {
      case 'free_fire':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'pubg_mobile':
        return <Crosshair className="w-4 h-4 text-emerald-400" />;
      case 'blood_strike':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'efootball':
        return <Trophy className="w-4 h-4 text-indigo-400" />;
      default:
        return <Trophy className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getGameBadgeColor = (gameId: string) => {
    switch (gameId) {
      case 'free_fire':
        return 'amber';
      case 'pubg_mobile':
        return 'emerald';
      case 'blood_strike':
        return 'cyan';
      case 'efootball':
        return 'indigo';
      default:
        return 'emerald';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="rose" icon={<span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}>লাইভ (চলমান)</Badge>;
      case 'completed':
        return <Badge variant="slate">সম্পন্ন</Badge>;
      default:
        return <Badge variant="emerald">আসন্ন</Badge>;
    }
  };

  return (
    <div className="group bg-[#0f172a] rounded-xl border border-slate-800/90 overflow-hidden hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-300 flex flex-col h-full">
      {/* Banner / Graphic Header */}
      <div className="relative h-32 sm:h-36 bg-slate-900 overflow-hidden flex items-center justify-center p-4">
        {/* Dynamic Game Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${
          tournament.gameId === 'free_fire'
            ? 'from-amber-950/80 via-amber-900/40 to-slate-950'
            : tournament.gameId === 'pubg_mobile'
            ? 'from-emerald-950/80 via-teal-900/40 to-slate-950'
            : tournament.gameId === 'blood_strike'
            ? 'from-cyan-950/80 via-blue-900/40 to-slate-950'
            : 'from-indigo-950/80 via-purple-900/40 to-slate-950'
        }`} />

        {/* Ambient overlay motif grid */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <Badge variant={getGameBadgeColor(tournament.gameId)} icon={getGameIcon(tournament.gameId)}>
            {tournament.gameNameBn}
          </Badge>
          {getStatusBadge(tournament.status)}
        </div>

        {/* Center Game Graphic Motif */}
        <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-300">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md mb-1">
            {getGameIcon(tournament.gameId)}
          </div>
          <p className="text-[11px] font-semibold text-slate-300 tracking-wider">
            {tournament.modeBn} • {tournament.mapBn}
          </p>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {tournament.titleBn}
          </h3>

          {/* Time & Date */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{tournament.startTime}</span>
            <span aria-hidden="true">·</span>
            <span>{tournament.dateFormatted}</span>
          </div>
        </div>

        {/* Prize & Entry Fee Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">মোট পুরষ্কার:</span>
            <span className="text-emerald-400 font-extrabold text-sm sm:text-base tabular-nums">
              ৳{tournament.prizePool}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">এন্ট্রি ফি:</span>
            <span className={`font-bold text-sm sm:text-base tabular-nums ${tournament.entryFee === 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {tournament.entryFee === 0 ? 'ফ্রি এন্ট্রি' : `৳${tournament.entryFee}`}
            </span>
          </div>
          {tournament.perKillPrize && (
            <div className="col-span-2 pt-1 border-t border-slate-800/60 text-[11px] text-amber-400 font-medium flex items-center justify-between">
              <span>প্রতি কিল বোনাস:</span>
              <span className="font-bold tabular-nums">৳{tournament.perKillPrize} / কিল</span>
            </div>
          )}
        </div>

        {/* Slots Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>বুকিং অবস্থা:</span>
            </span>
            <span className="text-slate-200 font-semibold tabular-nums">
              {tournament.joinedSlots} / {tournament.maxSlots} স্লট
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFull
                  ? 'bg-rose-500'
                  : percentageJoined > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentageJoined}%` }}
            />
          </div>
        </div>

        {/* Details Action Button */}
        <Button
          variant={isFull ? 'secondary' : 'primary'}
          fullWidth
          size="sm"
          onClick={() => onSelect(tournament)}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {tournament.status === 'completed'
            ? 'ফলাফল দেখুন'
            : isFull
            ? 'বিস্তারিত ও ওয়েটিং লিস্ট'
            : 'বিস্তারিত দেখুন'}
        </Button>
      </div>
    </div>
  );
};
