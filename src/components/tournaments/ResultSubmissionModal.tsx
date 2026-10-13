import React, { useState, useEffect } from 'react';
import { Tournament, MatchResultSubmission } from '../../types';
import { submitMatchResultScreenshot, fetchUserResultSubmission } from '../../services/tournamentService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, Trophy, Upload, CheckCircle2, AlertCircle, RefreshCw, Image, Clock, ShieldCheck } from 'lucide-react';

interface ResultSubmissionModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResultSubmissionModal: React.FC<ResultSubmissionModalProps> = ({
  tournament,
  isOpen,
  onClose,
}) => {
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [existingSubmission, setExistingSubmission] = useState<MatchResultSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tournament && isOpen) {
      loadUserSubmission(tournament.id);
    }
  }, [tournament, isOpen]);

  const loadUserSubmission = async (tournamentId: string) => {
    setLoading(true);
    try {
      const sub = await fetchUserResultSubmission(tournamentId);
      setExistingSubmission(sub);
      if (sub?.screenshotUrl) {
        setScreenshotUrl(sub.screenshotUrl);
      }
      if (sub?.explanation) {
        setExplanation(sub.explanation);
      }
    } catch (err) {
      console.error('Error loading submission:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tournament) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!screenshotUrl.trim()) {
      setErrorMessage('স্ক্রিনশটের ইমেজ লিঙ্ক (Image URL) প্রদান করা আবশ্যক।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitMatchResultScreenshot(
        tournament.id,
        screenshotUrl.trim(),
        explanation.trim()
      );

      if (res.success) {
        setSuccessMessage(res.messageBn);
        await loadUserSubmission(tournament.id);
      } else {
        setErrorMessage(res.messageBn);
      }
    } catch (err) {
      setErrorMessage('একটি অপ্রত্যাশিত সমস্যা ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">ম্যাচ রেজাল্ট স্ক্রিনশট জমা দিন</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tournament Info */}
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="font-bold text-emerald-400 block">{tournament.titleBn}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            গেম: {tournament.gameNameBn} ({tournament.modeBn})
          </span>
        </div>

        {/* Existing Status Banner */}
        {existingSubmission && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              existingSubmission.status === 'approved'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : existingSubmission.status === 'rejected'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                {existingSubmission.status === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                <span>রেজাল্ট স্ট্যাটাস: {existingSubmission.statusBn}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(existingSubmission.createdAt).toLocaleDateString('bn-BD')}
              </span>
            </div>
            {existingSubmission.rejectionReason && (
              <p className="text-[11px] pt-1 border-t border-slate-800">
                নোট / কারণ: {existingSubmission.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              স্ক্রিনশটের ইমেজ ইউআরএল (Screenshot Image URL):
            </label>
            <div className="relative">
              <Upload className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://imgur.com/your-screenshot.png"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Imgur, ImgBB বা যেকোনো ইমেজ ডিরেক্ট লিঙ্ক বসান।
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              অতিরিক্ত মন্তব্য / কিলের সংখ্যা (ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="যেমন: ৮ কিল এবং ১ নম্বর র‍্যাঙ্ক বোয়াহ।"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              বন্ধ করুন
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>জমা দেওয়া হচ্ছে...</span>
                </span>
              ) : existingSubmission ? (
                'স্ক্রিনশট হালনাগাদ করুন'
              ) : (
                'স্ক্রিনশট জমা দিন'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
