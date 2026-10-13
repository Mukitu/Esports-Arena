import React, { useState, useEffect, useMemo } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { GameCategories } from '../components/home/GameCategories';
import { TournamentCard } from '../components/tournaments/TournamentCard';
import { TournamentFilters } from '../components/tournaments/TournamentFilters';
import { HowItWorks } from '../components/home/HowItWorks';
import { TransparencySection } from '../components/home/TransparencySection';
import { LeaderboardPreview } from '../components/home/LeaderboardPreview';
import { FaqSection } from '../components/home/FaqSection';
import { fetchTournaments } from '../services/tournamentService';
import { GameId, Tournament } from '../types';
import { Trophy, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

interface HomePageProps {
  onPageChange: (page: string) => void;
  onSelectTournament: (tournament: Tournament) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onPageChange,
  onSelectTournament,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Error loading tournaments on HomePage:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchGame = selectedGame === 'all' || t.gameId === selectedGame;
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchSearch =
        !searchQuery.trim() ||
        t.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.gameNameBn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGame && matchStatus && matchSearch;
    });
  }, [tournaments, selectedGame, selectedStatus, searchQuery]);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <HeroSection
        onExploreClick={() => onPageChange('games')}
        onJoinClick={() => onPageChange('tournaments')}
      />

      {/* Game Categories */}
      <GameCategories
        onSelectGame={(gameId) => {
          setSelectedGame(gameId);
          onPageChange('tournaments');
        }}
      />

      {/* Featured & Upcoming Tournaments Discovery */}
      <section className="py-12 md:py-16 bg-[#090d16] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <Trophy className="w-4 h-4" />
                <span>টুর্নামেন্ট ফিল্টার</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                চলমান ও আসন্ন <span className="text-emerald-400">টুর্নামেন্টসমূহ</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                পছন্দের টুর্নামেন্টে যোগ দিন এবং গেমিং স্কিল প্রমাণ করুন
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange('tournaments')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              সকল টুর্নামেন্ট দেখুন
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="mb-8">
            <TournamentFilters
              selectedGame={selectedGame}
              onGameSelect={setSelectedGame}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedStatus={selectedStatus}
              onStatusSelect={setSelectedStatus}
            />
          </div>

          {/* Tournament Cards Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>টুর্নামেন্ট ডেটা লোড হচ্ছে...</span>
              </div>
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onSelect={onSelectTournament}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-12 text-center space-y-3">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">
                কোনো টুর্নামেন্ট পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                অ্যাডমিন কর্তৃক যুক্ত করা টুর্নামেন্টসমূহ এখানে প্রদর্শিত হবে।
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedGame('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
              >
                ফিল্টার রিসেট করুন
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Transparency & Wallet Trust Section */}
      <TransparencySection />

      {/* Leaderboard Preview */}
      <LeaderboardPreview
        onViewFullLeaderboard={() => onPageChange('leaderboard')}
      />

      {/* FAQ Accordion Section */}
      <FaqSection />
    </div>
  );
};
