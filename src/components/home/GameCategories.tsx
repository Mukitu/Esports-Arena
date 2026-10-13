import React from 'react';
import { GAMES_DATA } from '../../data/sampleData';
import { GameId } from '../../types';
import { Flame, Crosshair, Zap, Trophy, ArrowRight } from 'lucide-react';

interface GameCategoriesProps {
  onSelectGame: (gameId: GameId) => void;
}

export const GameCategories: React.FC<GameCategoriesProps> = ({ onSelectGame }) => {
  const getGameIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-6 h-6 text-amber-400" />;
      case 'Crosshair':
        return <Crosshair className="w-6 h-6 text-emerald-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-cyan-400" />;
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-indigo-400" />;
      default:
        return <Trophy className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#090d16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              জনপ্রিয় ই-স্পোর্টস <span className="text-emerald-400">গেমসমূহ</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              আপনার পছন্দের গেম নির্বাচন করে টুর্নামেন্ট অনুসন্ধান করুন
            </p>
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GAMES_DATA.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group cursor-pointer bg-[#0f172a] rounded-2xl border border-slate-800/90 hover:border-emerald-500/50 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Background Glow Mesh */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.bannerGradient} opacity-40 group-hover:opacity-70 transition-opacity`}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-slate-900/90 border border-slate-700/60 rounded-xl shadow-md">
                    {getGameIcon(game.iconName)}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                    {game.activeTournaments} টি সক্রিয় ম্যাচ
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {game.nameBn}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {game.tagline}
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>টুর্নামেন্ট তালিকা দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
