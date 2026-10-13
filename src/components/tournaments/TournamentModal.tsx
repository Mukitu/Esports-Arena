import React, { useState, useEffect } from 'react';
import { Tournament } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, Trophy, ShieldCheck, Clock, CheckCircle2, Copy, Lock, AlertCircle, RefreshCw, Upload, CreditCard, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { joinTournamentRpc, fetchTournamentRoomCredentials, checkUserJoinedTournament } from '../../services/tournamentService';
import { ResultSubmissionModal } from './ResultSubmissionModal';

interface TournamentModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onJoinSuccess: (tournamentTitle: string) => void;
  onNavigateToWallet?: () => void;
  onOpenComplaint?: (tournamentId: string) => void;
}

function checkIsWithin15Mins(startTimeStr: string): boolean {
  try {
    if (!startTimeStr) return true;
    const cleanTime = startTimeStr.trim();
    const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM|এএম|পিএম|টা)?/i);
    if (!match) return true;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = (match[3] || '').toUpperCase();

    if ((ampm === 'PM' || ampm === 'পিএম') && hours < 12) hours += 12;
    if ((ampm === 'AM' || ampm === 'এএম') && hours === 12) hours = 0;

    const matchDate = new Date();
    matchDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = matchDate.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    return diffMins <= 15;
  } catch (err) {
    return true;
  }
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  tournament,
  onClose,
  onJoinSuccess,
  onNavigateToWallet,
  onOpenComplaint,
}) => {
  const { user, isAuthenticated, requireAuth, openAuthModal, isAdmin } = useAuth();
  const [inGameIdInput, setInGameIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [roomCredentials, setRoomCredentials] = useState<{ roomId?: string; roomPassword?: string } | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  useEffect(() => {
    if (!tournament || !isAuthenticated) {
      setAlreadyRegistered(false);
      setRoomCredentials(null);
      return;
    }

    checkUserJoinedTournament(tournament.id).then((registered) => {
      setAlreadyRegistered(registered);
      if (registered || isAdmin) {
        loadCredentials(tournament.id);
      }
    });
  }, [tournament, isAuthenticated, isAdmin]);

  if (!tournament) return null;

  const loadCredentials = async (tournamentId: string) => {
    setLoadingRoom(true);
    const res = await fetchTournamentRoomCredentials(tournamentId);
    if (res.success && res.roomId) {
      setRoomCredentials({ roomId: res.roomId, roomPassword: res.roomPassword });
    }
    setLoadingRoom(false);
  };

  const isUnlocked15Mins = isAdmin || checkIsWithin15Mins(tournament.startTime);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInsufficientBalance(false);

    if (!inGameIdInput.trim()) {
      setErrorMessage('আপনার ইন-গেম ইউজার আইডি বা নাম প্রদান করুন।');
      return;
    }

    requireAuth(async () => {
      if (user?.isSuspended) {
        setErrorMessage(
          `আপনার অ্যাকাউন্টটি বর্তমানে অ্যাডমিন কর্তৃক স্থগিত (Suspended) করা হয়েছে। কারণ: ${
            user.suspensionReason || 'নীতিমালা লঙ্ঘন'
          }। সহায়তার জন্য হেল্পডেস্কে যোগাযোগ করুন।`
        );
        return;
      }

      if (tournament.status === 'cancelled') {
        setErrorMessage('এই টুর্নামেন্টটি ইতিমধ্যে বাতিল করা হয়েছে। নতুন করে যোগ দেওয়া সম্ভব নয়।');
        return;
      }

      if ((user?.walletBalance || 0) < tournament.entryFee) {
        setInsufficientBalance(true);
        setErrorMessage(`পর্যাপ্ত ওয়ালেট ব্যালেন্স নেই! আপনার ওয়ালেটে ৳${user?.walletBalance || 0} রয়েছে, কিন্তু এন্ট্রি ফি ৳${tournament.entryFee}।`);
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await joinTournamentRpc(tournament.id, inGameIdInput);
        if (res.success) {
          if (user && res.newBalance !== undefined) {
            user.walletBalance = res.newBalance;
          }
          setJoinedSuccess(true);
          setAlreadyRegistered(true);
          onJoinSuccess(tournament.titleBn);
          await loadCredentials(tournament.id);
        } else {
          if (res.messageBn?.includes('ব্যালেন্স')) {
            setInsufficientBalance(true);
          }
          setErrorMessage(res.messageBn || 'টুর্নামেন্টে যোগ দেওয়া সম্ভব হয়নি।');
        }
      } catch (err) {
        setErrorMessage('একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
      } finally {
        setIsSubmitting(false);
      }
    }, 'টুর্নামেন্টে যোগ দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
  };

  const copyRoomId = () => {
    requireAuth(() => {
      if (!roomCredentials) {
        setErrorMessage('রুম আইডি এখনো উপলব্ধ করা হয়নি বা আপনি এই টুর্নামেন্টে যুক্ত নন।');
        return;
      }
      const roomText = `ROOM: ${roomCredentials.roomId} | PASS: ${roomCredentials.roomPassword}`;
      navigator.clipboard.writeText(roomText);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    }, 'রুম আইডি দেখতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
  };

  // Helper to list all configured prizes up to 10th
  const pDist = tournament.prizeDistribution || {};
  const prizeItems: Array<{ rankLabel: string; amount: number }> = [];

  if (pDist.first) prizeItems.push({ rankLabel: '১ম স্থান (চ্যাম্পিয়ন)', amount: pDist.first });
  if (pDist.second) prizeItems.push({ rankLabel: '২য় স্থান (রানার্স-আপ)', amount: pDist.second });
  if (pDist.third) prizeItems.push({ rankLabel: '৩য় স্থান', amount: pDist.third });
  if (pDist.fourth) prizeItems.push({ rankLabel: '৪র্থ স্থান', amount: pDist.fourth });
  if (pDist.fifth) prizeItems.push({ rankLabel: '৫ম স্থান', amount: pDist.fifth });
  if (pDist.sixth) prizeItems.push({ rankLabel: '৬ষ্ঠ স্থান', amount: pDist.sixth });
  if (pDist.seventh) prizeItems.push({ rankLabel: '৭ম স্থান', amount: pDist.seventh });
  if (pDist.eighth) prizeItems.push({ rankLabel: '৮ম স্থান', amount: pDist.eighth });
  if (pDist.ninth) prizeItems.push({ rankLabel: '৯ম স্থান', amount: pDist.ninth });
  if (pDist.tenth) prizeItems.push({ rankLabel: '১০ম স্থান', amount: pDist.tenth });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          aria-label="মোডাল বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Thumbnail / Banner Header Image if present */}
        {tournament.bannerUrl && (
          <div className="w-full h-44 sm:h-52 overflow-hidden relative">
            <img
              src={tournament.bannerUrl}
              alt={tournament.titleBn}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="emerald">{tournament.gameNameBn}</Badge>
            <Badge variant="slate">{tournament.modeBn}</Badge>
            <Badge variant="cyan">{tournament.mapBn}</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {tournament.titleBn}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>সময়: {tournament.startTime} ({tournament.dateFormatted})</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-500/60 rounded-xl text-xs text-rose-200 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">অনুরোধ প্রক্রিয়া করতে ব্যর্থ হয়েছে</span>
                  <p>{errorMessage}</p>
                </div>
              </div>

              {/* Direct Deposit Call-To-Action if insufficient balance */}
              {insufficientBalance && onNavigateToWallet && (
                <div className="pt-2 border-t border-rose-800/50 flex items-center justify-between">
                  <span className="text-[11px] text-rose-300">তাত্ক্ষণিকভাবে ওয়ালেটে ডিপোজিট করুন:</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToWallet();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-lg transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>টাকা জমা দিন (Deposit)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prize Breakdown Section (up to 10th Place) */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>পুরষ্কার মানি বন্টন তালিকা</span>
              </h3>
              <span className="text-xs font-bold text-white bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                মোট প্রাইজপুল: ৳{tournament.prizePool}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              {prizeItems.length > 0 ? (
                prizeItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block truncate">{item.rankLabel}</span>
                    <span className="text-emerald-400 font-extrabold text-sm sm:text-base tabular-nums">
                      ৳{item.amount}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 col-span-full">
                  <span className="text-[11px] text-slate-400 block">মোট প্রাইজপুল</span>
                  <span className="text-emerald-400 font-bold text-base tabular-nums">
                    ৳{tournament.prizePool}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Room ID Release Notice & Credentials (15 Min Auto-Unlock Logic) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>রুম আইডি ও পাসওয়ার্ড অ্যাক্সেস</span>
              </h4>
              <p className="text-xs text-slate-400">
                ম্যাচের <span className="text-emerald-400 font-bold">১৫ মিনিট আগে (সময়: {tournament.startTime})</span> শুধুমাত্র নিবন্ধিত গেমারদের জন্য অটোমেটিক আনলক হবে।
              </p>
            </div>

            {isAuthenticated ? (
              (alreadyRegistered || isAdmin) ? (
                isUnlocked15Mins ? (
                  roomCredentials ? (
                    <div className="shrink-0 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">নিবন্ধিত ক্রেডিট</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {roomCredentials.roomId} | PASS: {roomCredentials.roomPassword}
                        </span>
                      </div>
                      <button
                        onClick={copyRoomId}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-md shrink-0 ml-1"
                        title="কপি করুন"
                      >
                        {copiedRoom ? 'কপি হয়েছে' : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
                      {loadingRoom ? 'রুম প্রসেস হচ্ছে...' : 'রুম আইডি তৈরির অপেক্ষায়'}
                    </span>
                  )
                ) : (
                  <div className="shrink-0 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-lg text-xs text-amber-300">
                    <span className="block font-semibold">রুম লক করা আছে</span>
                    <span className="text-[10px] text-amber-400">ম্যাচ শুরুর ১৫ মিনিট আগে ({tournament.startTime}) স্বয়ংক্রিয়ভাবে খুলে যাবে।</span>
                  </div>
                )
              ) : (
                <button
                  onClick={() => setErrorMessage('রুম আইডি দেখতে প্রথমে নিচে ইন-গেম আইডি দিয়ে টুর্নামেন্টে যোগ দিন।')}
                  className="shrink-0 bg-slate-800/80 text-xs text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>শুধুমাত্র যোগদানকারীদের জন্য</span>
                </button>
              )
            ) : (
              <button
                onClick={() => openAuthModal('রুম আইডি দেখতে প্রথমে অ্যাকাউন্টে লগইন করুন।')}
                className="shrink-0 bg-slate-800 text-xs text-amber-400 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>লগইন করুন</span>
              </button>
            )}
          </div>

          {/* Match Rules */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>অফিসিয়াল নিয়মাবলী ও শর্তাবলী:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              {tournament.matchRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {tournament.status === 'cancelled' ? (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-base font-bold text-rose-400">এই টুর্নামেন্টটি বাতিল করা হয়েছে</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                পর্যাপ্ত স্লট পূরণ না হওয়া বা অনিবার্য কারণে ম্যাচটি বাতিল করা হয়েছে এবং সকল নিবন্ধিত খেলোয়াড়ের ওয়ালেটে ১০০% এন্ট্রি ফি সম্পূর্ণ রিফান্ড করে দেওয়া হয়েছে।
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>এই টুর্নামেন্টে যোগ দিতে প্রথমে লগইন করতে হবে।</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAuthModal('এই টুর্নামেন্টে যোগ দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।')}
              >
                লগইন করুন
              </Button>
            </div>
          ) : null}

          {/* Registration Form / Joined State */}
          {tournament.status !== 'cancelled' && isAuthenticated && (
            (joinedSuccess || alreadyRegistered) ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-emerald-400">
                  {alreadyRegistered ? 'আপনি এই টুর্নামেন্টে ইতিমধ্যে নিবন্ধিত!' : 'অভিনন্দন! আপনি সফলভাবে নিবন্ধিত হয়েছেন।'}
                </h4>
                <p className="text-xs text-slate-300">
                  ম্যাচ শুরুর ১৫ মিনিট আগে ({tournament.startTime}) রুম আইডি স্বয়ংক্রিয়ভাবে উপরে দৃশ্যমান হবে।
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Upload className="w-4 h-4" />}
                    onClick={() => setResultModalOpen(true)}
                  >
                    ম্যাচ রেজাল্ট স্ক্রিনশট জমা দিন
                  </Button>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    ঠিক আছে (বন্ধ করুন)
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="inGameId" className="text-xs font-semibold text-slate-200">
                    আপনার ইন-গেম ইউজার আইডি (In-Game UID / Name):
                  </label>
                  <span className="text-[11px] text-amber-400">সঠিক আইডি প্রদান আবশ্যক</span>
                </div>
                <input
                  id="inGameId"
                  type="text"
                  required
                  value={inGameIdInput}
                  onChange={(e) => {
                    setInGameIdInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="যেমন: 5829104812 (ইন-গেম নাম বা আইডি)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">
                    এন্ট্রি ফি কাটবে: <strong className="text-emerald-400">{tournament.entryFee === 0 ? 'ফ্রি' : `৳${tournament.entryFee}`}</strong>
                  </span>
                  <span className="text-slate-400">
                    আপনার ওয়ালেট ব্যালেন্স: <strong className={user && user.walletBalance < tournament.entryFee ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      ৳{user?.walletBalance || 0}
                    </strong>
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                  className="mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>প্রসেসিং হচ্ছে...</span>
                    </span>
                  ) : (
                    `সিট বুকিং করুন (${tournament.entryFee === 0 ? 'ফ্রি' : `৳${tournament.entryFee}`})`
                  )}
                </Button>
              </form>
            )
          )}

          {/* Report Issue / Cheating Link */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px]">ম্যাচ, রুম বা কোনো খেলোয়াড়ের চিটিং সমস্যা?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenComplaint) onOpenComplaint(tournament.id);
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>অভিযোগ দাখিল করুন</span>
            </button>
          </div>
        </div>
      </div>

      {resultModalOpen && (
        <ResultSubmissionModal
          tournament={tournament}
          isOpen={resultModalOpen}
          onClose={() => setResultModalOpen(false)}
        />
      )}
    </div>
  );
};
