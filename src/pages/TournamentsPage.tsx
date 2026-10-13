import React, { useState, useEffect, useMemo } from 'react';
import { TournamentCard } from '../components/tournaments/TournamentCard';
import { TournamentFilters } from '../components/tournaments/TournamentFilters';
import { fetchTournaments } from '../services/tournamentService';
import { GameId, Tournament } from '../types';
import { Trophy, RefreshCw } from 'lucide-react';

interface TournamentsPageProps {
  onSelectTournament: (tournament: Tournament) => void;
}

export const TournamentsPage: React.FC<TournamentsPageProps> = ({
  onSelectTournament,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await fetchTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Error loading tournaments:', err);
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
    <div className="py-8 sm:py-12 bg-[#090d16] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-emerald-400" />
              <span>সকল <span className="text-emerald-400">টুর্নামেন্টসমূহ</span></span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              ফ্রি ফায়ার, পাবজি মোবাইল, ব্লাড স্ট্রাইক এবং ই-ফুটবল টুর্নামেন্টে প্রবেশ করে আপনার স্লট বুকিং করুন
            </p>
          </div>

          <button
            onClick={loadTournaments}
            className="self-start sm:self-auto p-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* Filters */}
        <TournamentFilters
          selectedGame={selectedGame}
          onGameSelect={setSelectedGame}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusSelect={setSelectedStatus}
        />

        {/* Tournaments Grid */}
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
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              কোনো টুর্নামেন্ট মেলেনি
            </h3>
            <p className="text-xs text-slate-500">
              অ্যাডমিন কর্তৃক যুক্ত করা টুর্নামেন্টসমূহ এখানে প্রদর্শিত হবে।
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
