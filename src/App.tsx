import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AiChatProvider } from './context/AiChatContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileNavbar } from './components/layout/MobileNavbar';
import { HomePage } from './pages/HomePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { WalletPage } from './pages/WalletPage';
import { SupportPage } from './pages/SupportPage';
import { TournamentModal } from './components/tournaments/TournamentModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { DigantaAiModal } from './components/ai/DigantaAiModal';
import { AiFloatingTrigger } from './components/ai/AiFloatingTrigger';
import { ComplaintModal } from './components/complaints/ComplaintModal';
import { Tournament } from './types';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintTournamentId, setComplaintTournamentId] = useState<string | undefined>(undefined);
  const { user, requireAdminAuth } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    requireAdminAuth(() => {
      handlePageChange('admin');
    }, 'অ্যাডমিন প্যানেলে প্রবেশ করতে প্রথমে অনুমোদিত অ্যাকাউন্টে লগইন করুন।');
  };

  const handleOpenComplaint = (tournamentId?: string) => {
    setComplaintTournamentId(tournamentId);
    setIsComplaintModalOpen(true);
  };

  // If viewing Admin Dashboard
  if (currentPage === 'admin') {
    return (
      <AdminLayout onReturnToApp={() => handlePageChange('home')} />
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Hind_Siliguri',sans-serif]">
      {/* Prominent Account Suspension Warning Banner for Suspended Users */}
      {user?.isSuspended && (
        <div className="bg-amber-950/95 border-b border-amber-500/50 text-amber-200 px-4 py-3 sticky top-0 z-50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white block">আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত (Suspended / Banned)</span>
              <span className="text-amber-300 text-xs">
                স্থগিতের কারণ: <strong>{user.suspensionReason || 'নীতিমালা লঙ্ঘন বা তদন্তাধীন'}</strong>। কোনো ভুল বোঝাবুঝি থাকলে সরাসরি অভিযোগ বক্সের মাধ্যমে আপিল করতে পারেন।
              </span>
            </div>
          </div>
          <button
            onClick={() => handleOpenComplaint()}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>আপিল / অভিযোগ জানান</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Application Shell Header */}
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onOpenAdmin={handleOpenAdmin}
        onOpenComplaint={() => handleOpenComplaint()}
      />

      {/* Main Content Body */}
      <main className="flex-grow">
        {currentPage === 'home' && (
          <HomePage
            onPageChange={handlePageChange}
            onSelectTournament={(tournament) => setSelectedTournament(tournament)}
          />
        )}

        {(currentPage === 'tournaments' || currentPage === 'games') && (
          <TournamentsPage
            onSelectTournament={(tournament) => setSelectedTournament(tournament)}
          />
        )}

        {currentPage === 'leaderboard' && <LeaderboardPage />}

        {currentPage === 'wallet' && <WalletPage />}

        {currentPage === 'support' && <SupportPage />}
      </main>

      {/* Global Application Shell Footer */}
      <Footer
        onPageChange={handlePageChange}
        onOpenComplaint={() => handleOpenComplaint()}
      />

      {/* Mobile Sticky Navigation Bar */}
      <MobileNavbar currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Interactive Tournament Details Modal */}
      <TournamentModal
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        onNavigateToWallet={() => handlePageChange('wallet')}
        onOpenComplaint={(tourneyId) => handleOpenComplaint(tourneyId)}
        onJoinSuccess={(title) => {
          showToast(`"${title}" টুর্নামেন্টে সফলভাবে নিবন্ধিত হয়েছেন!`);
        }}
      />

      {/* Protected Auth / Login Modal */}
      <AuthModal />

      {/* Official Complaint & Dispute Box Modal */}
      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        defaultTournamentId={complaintTournamentId}
      />

      {/* Diganta AI Floating Assistant Window & Glow Button */}
      <DigantaAiModal />
      <AiFloatingTrigger />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AiChatProvider>
        <MainApp />
      </AiChatProvider>
    </AuthProvider>
  );
}
