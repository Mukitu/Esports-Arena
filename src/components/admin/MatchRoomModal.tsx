import React, { useState } from 'react';
import { Tournament } from '../../types';
import { updateMatchRoomCredentials } from '../../services/tournamentService';
import { Button } from '../common/Button';
import { X, Lock, Key, Eye, EyeOff, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface MatchRoomModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MatchRoomModal: React.FC<MatchRoomModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [roomId, setRoomId] = useState(tournament?.roomId || '');
  const [roomPassword, setRoomPassword] = useState(tournament?.roomPassword || '');
  const [roomStatus, setRoomStatus] = useState<'hidden' | 'released' | 'closed'>(
    tournament?.roomStatus || 'hidden'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !tournament) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (roomStatus === 'released' && (!roomId.trim() || !roomPassword.trim())) {
      setErrorMessage('রুম প্রকাশ (Release) করতে অবশ্যই Room ID এবং Password বসাতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateMatchRoomCredentials(
        tournament.id,
        roomId.trim(),
        roomPassword.trim(),
        roomStatus
      );

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.messageBn);
      }
    } catch (err) {
      setErrorMessage('একটি অপ্রত্যাশিত সমস্যা ঘটেছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">ম্যাচ রুম কন্ট্রোল</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="font-bold text-emerald-400 block mb-0.5">{tournament.titleBn}</span>
          <span className="text-[11px] text-slate-400">
            সমাকলন: {tournament.startTime} ({tournament.dateFormatted})
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              রুম প্রকাশনার অবস্থা (Room Visibility Status):
            </label>
            <select
              value={roomStatus}
              onChange={(e) => setRoomStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="hidden">লুকানো (Hidden / Private)</option>
              <option value="released">প্রকাশিত (Released to Registered Gamers)</option>
              <option value="closed">বন্ধ (Closed / Expired)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              রুম আইডি (Room ID):
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="যেমন: ROOM-993812"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              রুম পাসওয়ার্ড (Room Password):
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="যেমন: 1234"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-300">
            রুম “প্রকাশিত (Released)” অবস্থায় আনলে কেবল এই টুর্নামেন্টে নিবন্ধিত গেমাররা এটি তাদের মোডালে দেখতে পাবেন।
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              বাতিল
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>সংরক্ষণ...</span>
                </span>
              ) : (
                'রুম ক্রিডেনশিয়াল সংরক্ষণ করুন'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
