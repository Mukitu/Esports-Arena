import React, { useState, useEffect } from 'react';
import { MatchResultSubmission, Tournament } from '../../types';
import { fetchAdminResultSubmissions, reviewMatchResultSubmission, fetchTournaments } from '../../services/tournamentService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Trophy, Filter, Eye, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';

export const AdminResults: React.FC = () => {
  const [submissions, setSubmissions] = useState<MatchResultSubmission[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTourneyFilter, setSelectedTourneyFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('pending');

  const [reviewingSubmission, setReviewingSubmission] = useState<MatchResultSubmission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedTourneyFilter, selectedStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, tourneys] = await Promise.all([
        fetchAdminResultSubmissions(selectedTourneyFilter, selectedStatusFilter),
        fetchTournaments(),
      ]);
      setSubmissions(subs);
      setTournaments(tourneys);
    } catch (err) {
      console.error('Error loading result submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (
    submissionId: string,
    status: 'approved' | 'rejected' | 'evidence_requested',
    notes?: string
  ) => {
    setSubmittingAction(true);
    setFeedbackMessage(null);

    try {
      const res = await reviewMatchResultSubmission(submissionId, status, notes);
      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.messageBn });
        setReviewingSubmission(null);
        setRejectReasonInput('');
        await loadData();
      } else {
        setFeedbackMessage({ type: 'error', text: res.messageBn });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।' });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>ম্যাচ রেজাল্ট ট্র্যাকিং</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            ম্যাচ রেজাল্ট ও স্ক্রিনশট যাচাইকরণ
          </h2>
          <p className="text-xs text-slate-400">
            গেমারদের জমা দেওয়া বিজয়ী স্ক্রিনশট ও স্কোর যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন।
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Feedback Message Alert */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>টুর্নামেন্ট:</span>
            <select
              value={selectedTourneyFilter}
              onChange={(e) => setSelectedTourneyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none max-w-xs truncate"
            >
              <option value="all">সব টুর্নামেন্ট (All Tournaments)</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleBn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>স্ট্যাটাস:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="pending">অপেক্ষমাণ (Pending Review)</option>
              <option value="approved">অনুমোদিত (Approved)</option>
              <option value="rejected">বাতিলকৃত (Rejected)</option>
              <option value="evidence_requested">অতিরিক্ত প্রমাণ চাওয়া হয়েছে</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Submissions Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>রেজাল্ট স্ক্রিনশট লোড হচ্ছে...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-[#0f172a] rounded-2xl border border-slate-800">
            কোনো ম্যাচ রেজাল্ট জমা পাওয়া যায়নি।
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* Image Preview Thumbnail */}
              <div className="relative h-44 bg-slate-950 overflow-hidden border-b border-slate-800">
                <img
                  src={sub.screenshotUrl}
                  alt="Match Screenshot"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback visual if image fails to render
                    (e.target as any).src =
                      'https://placehold.co/600x400/0f172a/emerald?text=Screenshot+Submitted';
                  }}
                />
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={
                      sub.status === 'approved'
                        ? 'emerald'
                        : sub.status === 'rejected'
                        ? 'rose'
                        : sub.status === 'evidence_requested'
                        ? 'amber'
                        : 'indigo'
                    }
                  >
                    {sub.statusBn}
                  </Badge>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-4 space-y-3 flex-grow">
                <div>
                  <span className="text-[11px] text-emerald-400 font-semibold block">
                    {sub.tournamentTitleBn}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {sub.userDisplayName}
                  </h4>
                  <span className="text-[11px] text-amber-400 font-mono block">
                    In-Game UID: {sub.inGameId}
                  </span>
                </div>

                {sub.explanation && (
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 italic">
                    "{sub.explanation}"
                  </p>
                )}

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>জমা দেওয়ার সময়:</span>
                  <span>{new Date(sub.createdAt).toLocaleString('bn-BD')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setReviewingSubmission(sub)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>স্ক্রিনশট বিস্তারিত ও যাচাই</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Submission Modal Dialog */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">রেজাল্ট স্ক্রিনশট রিভিউ</h3>
              <button
                onClick={() => setReviewingSubmission(null)}
                className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Large Image View */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 max-h-80 flex items-center justify-center">
              <a
                href={reviewingSubmission.screenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center"
              >
                <img
                  src={reviewingSubmission.screenshotUrl}
                  alt="Full Screenshot"
                  className="max-h-80 mx-auto object-contain"
                />
              </a>
            </div>

            {/* Info Summary */}
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">গেমার:</span>
                <strong className="text-white">{reviewingSubmission.userDisplayName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">In-Game ID:</span>
                <strong className="text-amber-400 font-mono">{reviewingSubmission.inGameId}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">টুর্নামেন্ট:</span>
                <strong className="text-emerald-400">{reviewingSubmission.tournamentTitleBn}</strong>
              </div>
            </div>

            {/* Rejection Note Input if needed */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                অ্যাডমিন নোট / প্রত্যাখ্যানের কারণ (Rejection Reason / Note):
              </label>
              <textarea
                rows={2}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="যেমন: স্ক্রিনশটে ইন-গেম নাম বা কিল কাউন্ট স্পষ্ট নয়।"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="primary"
                size="md"
                disabled={submittingAction}
                onClick={() =>
                  handleReviewAction(reviewingSubmission.id, 'approved', rejectReasonInput)
                }
              >
                {submittingAction ? 'প্রসেসিং...' : 'অনুমোদন করুন (Approve)'}
              </Button>

              <Button
                variant="danger"
                size="md"
                disabled={submittingAction}
                onClick={() => {
                  if (!rejectReasonInput.trim()) {
                    alert('প্রত্যাখ্যান করতে কারণ বা নোট বসানো বাধ্যতামূলক।');
                    return;
                  }
                  handleReviewAction(reviewingSubmission.id, 'rejected', rejectReasonInput);
                }}
              >
                বাতিল করুন (Reject)
              </Button>

              <Button
                variant="secondary"
                size="md"
                disabled={submittingAction}
                onClick={() =>
                  handleReviewAction(
                    reviewingSubmission.id,
                    'evidence_requested',
                    rejectReasonInput || 'অতিরিক্ত প্রমাণ স্ক্রিনশট প্রয়োজন।'
                  )
                }
              >
                অতিরিক্ত প্রমাণ চান
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
