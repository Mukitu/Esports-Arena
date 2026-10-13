import React, { useState, useEffect, useRef } from 'react';
import { UserComplaint, ComplaintCategory } from '../../types';
import { submitUserComplaint, fetchUserComplaints, COMPLAINT_CATEGORIES } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  MessageSquare,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTournamentId?: string;
  defaultReportedUserId?: string;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  defaultTournamentId,
  defaultReportedUserId,
}) => {
  const { user, isAuthenticated, requireAuth, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'my_complaints'>('new');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('tournament');
  const [reportedUserId, setReportedUserId] = useState(defaultReportedUserId || '');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // My Complaints list
  const [myComplaints, setMyComplaints] = useState<UserComplaint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selected image zoom modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultReportedUserId) setReportedUserId(defaultReportedUserId);
      if (isAuthenticated) {
        loadHistory();
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchUserComplaints();
      setMyComplaints(data);
    } catch (e) {
      console.error('Error loading complaints history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  // Handle local image file upload (MANDATORY)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (PNG, JPG, JPEG, WEBP) আপলোড করুন।');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('ছবির সাইজ সর্বোচ্চ ৮ মেগাবাইট (8MB) হতে পারে।');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setScreenshotUrl(base64);
      setScreenshotPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isAuthenticated) {
      openAuthModal('অভিযোগ জমা দিতে প্রথমে অ্যাকাউন্টে লগইন করুন।');
      return;
    }

    // MANDATORY VALIDATIONS: Title, Description & Screenshot
    if (!title.trim()) {
      setErrorMessage('অভিযোগের শিরোনাম বা টাইটেল প্রদান করা বাধ্যতামূলক।');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('সমস্যার বিস্তারিত ডেসক্রিপশন প্রদান করা বাধ্যতামূলক।');
      return;
    }

    if (!screenshotUrl.trim()) {
      setErrorMessage('প্রমাণ হিসেবে স্ক্রিনশট বা ছবি আপলোড করা বাধ্যতামূলক।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitUserComplaint({
        title: title.trim(),
        description: description.trim(),
        screenshotUrl: screenshotUrl.trim(),
        category,
        reportedUserId: reportedUserId.trim() || undefined,
        tournamentId: defaultTournamentId,
      });

      if (res.success) {
        setSuccessMessage(res.messageBn);
        setTitle('');
        setDescription('');
        setScreenshotUrl('');
        setScreenshotPreview(null);
        setReportedUserId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadHistory();
        setTimeout(() => {
          setActiveTab('my_complaints');
        }, 1500);
      } else {
        setErrorMessage(res.messageBn);
      }
    } catch (err: any) {
      setErrorMessage('অভিযোগ জমা দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden font-['Hind_Siliguri',sans-serif]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                অভিযোগ বক্স (User Dispute & Report Box)
              </h3>
              <p className="text-xs text-slate-400">
                যেকোনো সমস্যা, চিটিং রিপোর্ট বা অসুবিধার বিষয়ে প্রমাণসহ অভিযোগ জমা দিন।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'new'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>নতুন অভিযোগ দাখিল করুন</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my_complaints');
              loadHistory();
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'my_complaints'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>আমার অভিযোগসমূহ ও স্ট্যাটাস</span>
            {myComplaints.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full">
                {myComplaints.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: NEW COMPLAINT FORM */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                ℹ️ <strong>নির্দেশনা:</strong> অভিযোগের <strong>টাইটেল</strong>, <strong>ডেসক্রিপশন</strong> এবং <strong>স্ক্রিনশটের ছবি</strong> আপলোড করা <strong>বাধ্যতামূলক (Mandatory)</strong>। অ্যাডমিন প্যানেল আপনার আপলোডকৃত প্রমাণ যাচাই করে উপযুক্ত ব্যবস্থা গ্রহণ করবে।
              </div>

              {/* Title Input - MANDATORY */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>অভিযোগের শিরোনাম (Title) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400">ম্যান্ডেটরি</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ম্যাচে চিটার প্লেয়ারের সন্দেহজনক আচরণ / উইথড্র সংক্রান্ত সমস্যা"
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Category & Optional Target User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200">অভিযোগের ধরন (Category):</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200">অভিযুক্ত প্লেয়ারের UID (ঐচ্ছিক):</label>
                  <input
                    type="text"
                    value={reportedUserId}
                    onChange={(e) => setReportedUserId(e.target.value)}
                    placeholder="যেমন: ইন-গেম UID বা নম্বর"
                    className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              {/* Description Input - MANDATORY */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>সমস্যার বিস্তারিত বিবরণ (Description) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400">ম্যান্ডেটরি</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="কী সমস্যা হয়েছে, কত নম্বর ম্যাচে হয়েছে বা বিস্তারিত বিবরণ পরিষ্কারভাবে লিখুন..."
                  className="w-full bg-[#090d16] border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Screenshot Image Upload - MANDATORY */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>প্রমাণ হিসেবে স্ক্রিনশট বা ছবি (Screenshot Image) <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-rose-400 font-bold">বাধ্যতামূলক (Mandatory)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {screenshotPreview ? (
                  <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>স্ক্রিনশট ছবি যুক্ত করা হয়েছে</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotUrl('');
                          setScreenshotPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-400 hover:underline cursor-pointer"
                      >
                        ছবি পরিবর্তন / মুছুন
                      </button>
                    </div>

                    <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-56 bg-slate-950 flex items-center justify-center">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot proof"
                        className="w-full h-auto max-h-56 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40 hover:bg-slate-900/70 space-y-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        ডিভাইস থেকে স্ক্রিনশট বা ছবি আপলোড করুন
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, JPEG বা WEBP ফাইল (সর্বোচ্চ ৮ মেগাবাইট)
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium">
                      ফাইল নির্বাচন করুন
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim() || !screenshotUrl.trim()}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>অভিযোগ দাখিল করা হচ্ছে...</span>
                    </span>
                  ) : (
                    'অভিযোগ সাবমিট করুন'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: MY COMPLAINTS STATUS & RESOLUTION */}
          {activeTab === 'my_complaints' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-400 font-semibold">
                  আপনার দাখিলকৃত অভিযোগসমূহ ({myComplaints.length}টি)
                </span>
                <button
                  onClick={loadHistory}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                  <span>রিফ্রেশ</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>অভিযোগের স্ট্যাটাস লোড হচ্ছে...</span>
                </div>
              ) : myComplaints.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs sm:text-sm">আপনি এখনো কোনো অভিযোগ দাখিল করেননি।</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    + নতুন অভিযোগ দাখিল করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myComplaints.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#090d16] border border-slate-800 rounded-xl p-4 space-y-3 shadow-md text-xs sm:text-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{item.title}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                              {item.categoryBn}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            তারিখ: {new Date(item.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <Badge
                            variant={
                              item.status === 'resolved'
                                ? 'emerald'
                                : item.status === 'in_progress'
                                ? 'amber'
                                : item.status === 'rejected'
                                ? 'rose'
                                : 'slate'
                            }
                          >
                            {item.statusBn || item.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>

                      {/* Screenshot Preview */}
                      {item.screenshotUrl && (
                        <div className="pt-1">
                          <span className="text-[11px] text-slate-400 block mb-1">সংযুক্ত স্ক্রিনশট প্রমাণ:</span>
                          <div
                            onClick={() => setZoomedImage(item.screenshotUrl)}
                            className="inline-block relative rounded-lg overflow-hidden border border-slate-700 cursor-pointer group max-w-xs"
                          >
                            <img
                              src={item.screenshotUrl}
                              alt="Complaint proof"
                              className="h-24 w-auto object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>বড় করে দেখুন</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Status Banner & Admin Resolution Notes */}
                      {item.status === 'resolved' && (
                        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>অভিযোগটি সফলভাবে সমাধান করা হয়েছে</span>
                          </div>
                          <p className="text-emerald-200 text-xs leading-relaxed">
                            {item.adminNotes
                              ? item.adminNotes
                              : 'অ্যাডমিন টিম অভিযোগটি পর্যালোচনা করে প্রয়োজনীয় ব্যবস্থা গ্রহণ করেছে ও সমাধান সম্পন্ন করেছে।'}
                          </p>
                          {item.reviewedAt && (
                            <span className="text-[10px] text-emerald-400/70 font-mono block pt-0.5">
                              সমাধানের তারিখ: {new Date(item.reviewedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}

                      {item.status === 'rejected' && (
                        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>অভিযোগটি বাতিল / প্রত্যাখ্যাত করা হয়েছে</span>
                          </div>
                          <p className="text-rose-200 text-xs leading-relaxed">
                            {item.adminNotes
                              ? item.adminNotes
                              : 'পর্যাপ্ত প্রমাণের অভাব বা অভিযোগটি প্ল্যাটফর্ম নীতিমালার আওতায় গ্রহণযোগ্য বিবেচিত হয়নি।'}
                          </p>
                          {item.reviewedAt && (
                            <span className="text-[10px] text-rose-400/70 font-mono block pt-0.5">
                              পর্যালোচনার তারিখ: {new Date(item.reviewedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}

                      {item.status === 'in_progress' && (
                        <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>অভিযোগটি তদন্ত ও প্রক্রিয়াকরণের অধীনে রয়েছে</span>
                          </div>
                          <p className="text-amber-200 text-xs leading-relaxed">
                            {item.adminNotes
                              ? item.adminNotes
                              : 'অ্যাডমিন টিম অভিযোগটি আমলে নিয়ে তদন্ত চালাচ্ছে। খুব শীঘ্রই চূড়ান্ত সিদ্ধান্ত জানানো হবে।'}
                          </p>
                          {item.reviewedAt && (
                            <span className="text-[10px] text-amber-400/70 font-mono block pt-0.5">
                              তদন্ত শুরুর তারিখ: {new Date(item.reviewedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>অভিযোগটি পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে। অ্যাডমিন টিম শীঘ্রই এটি দেখে সিদ্ধান্ত জানাবে।</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-rose-400 text-sm font-bold"
            >
              ✕ বন্ধ করুন
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed proof"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
