import React, { useState } from 'react';
import { Tournament, GameId, GameMode, TournamentStatus } from '../../types';
import { createTournament, updateTournament } from '../../services/tournamentService';
import { Button } from '../common/Button';
import {
  X,
  Trophy,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  CheckSquare,
  Square,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';

interface TournamentFormModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BANGLA_MONTHS = [
  'জানুয়ারী',
  'ফেব্রুয়ারী',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

function toBanglaDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BANGLA_DIGITS[parseInt(d, 10)]);
}

function formatDateToBangla(dateIso: string): string {
  if (!dateIso) return '';
  const [yearStr, monthStr, dayStr] = dateIso.split('-');
  if (!yearStr || !monthStr || !dayStr) return '';

  const dayNum = parseInt(dayStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const yearNum = parseInt(yearStr, 10);

  const dayBn = toBanglaDigits(dayNum);
  const monthBn = BANGLA_MONTHS[monthNum - 1] || '';
  const yearBn = toBanglaDigits(yearNum);

  return `${dayBn} ${monthBn}, ${yearBn}`;
}

function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  const hFormatted = h < 10 ? `0${h}` : `${h}`;
  const mFormatted = m < 10 ? `0${m}` : `${m}`;

  return `${hFormatted}:${mFormatted} ${ampm}`;
}

export const TournamentFormModal: React.FC<TournamentFormModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(tournament);

  const [titleBn, setTitleBn] = useState(tournament?.titleBn || '');
  const [gameNameBn, setGameNameBn] = useState(tournament?.gameNameBn || 'ফ্রি ফায়ার');
  const [modeInput, setModeInput] = useState(tournament?.modeBn || 'স্কোয়াড');
  const [mapBn, setMapBn] = useState(tournament?.mapBn || 'বারমুডা');
  const [entryFee, setEntryFee] = useState(tournament?.entryFee !== undefined ? tournament.entryFee : 50);

  // Thumbnail state (URL vs Upload)
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'upload'>('url');
  const [bannerUrl, setBannerUrl] = useState(tournament?.bannerUrl || '');

  // Prize Breakdown State (1st to 10th place)
  const dist: Record<string, number | undefined> = tournament?.prizeDistribution || {};
  const [prize1st, setPrize1st] = useState(dist.first || (tournament?.prizePool ? Math.round(tournament.prizePool * 0.5) : 500));
  const [prize2nd, setPrize2nd] = useState(dist.second || (tournament?.prizePool ? Math.round(tournament.prizePool * 0.3) : 300));

  const [enable3rd, setEnable3rd] = useState(Boolean(dist.third && dist.third > 0));
  const [prize3rd, setPrize3rd] = useState(dist.third || 200);

  const [enable4th, setEnable4th] = useState(Boolean(dist.fourth && dist.fourth > 0));
  const [prize4th, setPrize4th] = useState(dist.fourth || 150);

  const [enable5th, setEnable5th] = useState(Boolean(dist.fifth && dist.fifth > 0));
  const [prize5th, setPrize5th] = useState(dist.fifth || 100);

  const [enable6th, setEnable6th] = useState(Boolean(dist.sixth && dist.sixth > 0));
  const [prize6th, setPrize6th] = useState(dist.sixth || 80);

  const [enable7th, setEnable7th] = useState(Boolean(dist.seventh && dist.seventh > 0));
  const [prize7th, setPrize7th] = useState(dist.seventh || 70);

  const [enable8th, setEnable8th] = useState(Boolean(dist.eighth && dist.eighth > 0));
  const [prize8th, setPrize8th] = useState(dist.eighth || 60);

  const [enable9th, setEnable9th] = useState(Boolean(dist.ninth && dist.ninth > 0));
  const [prize9th, setPrize9th] = useState(dist.ninth || 50);

  const [enable10th, setEnable10th] = useState(Boolean(dist.tenth && dist.tenth > 0));
  const [prize10th, setPrize10th] = useState(dist.tenth || 40);

  const [maxSlots, setMaxSlots] = useState(tournament?.maxSlots || 48);

  // Calendar Date & Match Time Picker state
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateIso, setDateIso] = useState<string>(todayIso);
  const [dateFormatted, setDateFormatted] = useState(
    tournament?.dateFormatted || formatDateToBangla(todayIso)
  );

  const [timeIso, setTimeIso] = useState<string>('20:30');
  const [startTime, setStartTime] = useState(tournament?.startTime || '08:30 PM');

  const [status, setStatus] = useState<TournamentStatus>(tournament?.status || 'upcoming');
  const [descriptionBn, setDescriptionBn] = useState(tournament?.descriptionBn || '');
  const [matchRulesText, setMatchRulesText] = useState(
    tournament?.matchRules
      ? tournament.matchRules.join('\n')
      : 'হ্যাক বা থার্ড পার্টি অ্যাপ সম্পূর্ণ নিষিদ্ধ।\nসঠিক ইন-গেম ইউজার আইডি দিয়ে যোগ দিন।'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Total calculated prize pool based on enabled prizes
  const totalCalculatedPrizePool =
    Number(prize1st || 0) +
    Number(prize2nd || 0) +
    (enable3rd ? Number(prize3rd || 0) : 0) +
    (enable4th ? Number(prize4th || 0) : 0) +
    (enable5th ? Number(prize5th || 0) : 0) +
    (enable6th ? Number(prize6th || 0) : 0) +
    (enable7th ? Number(prize7th || 0) : 0) +
    (enable8th ? Number(prize8th || 0) : 0) +
    (enable9th ? Number(prize9th || 0) : 0) +
    (enable10th ? Number(prize10th || 0) : 0);

  // Date calendar picker handler
  const handleDateIsoChange = (newIso: string) => {
    setDateIso(newIso);
    if (newIso) {
      const formatted = formatDateToBangla(newIso);
      setDateFormatted(formatted);
    }
  };

  // Preset date offset
  const setDatePresetDaysOffset = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const iso = d.toISOString().split('T')[0];
    handleDateIsoChange(iso);
  };

  // Time picker handler
  const handleTimeIsoChange = (newTime: string) => {
    setTimeIso(newTime);
    if (newTime) {
      const formatted = formatTimeTo12Hour(newTime);
      setStartTime(formatted);
    }
  };

  // File upload handler converting image to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল আপলোড করুন (JPG, PNG, WebP)।');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('ফাইল সাইজ খুব বড়! সর্বোচ্চ ৫MB ছবি আপলোড করা সম্ভব।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBannerUrl(reader.result);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!titleBn.trim()) {
      setErrorMessage('টুর্নামেন্টের শিরোনাম প্রদান করুন।');
      return;
    }

    if (!gameNameBn.trim()) {
      setErrorMessage('গেমের নাম লিখুন।');
      return;
    }

    setSubmitting(true);

    const rulesArray = matchRulesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const gameIdSlug = gameNameBn.toLowerCase().includes('pubg')
      ? 'pubg_mobile'
      : gameNameBn.toLowerCase().includes('blood')
      ? 'blood_strike'
      : gameNameBn.toLowerCase().includes('football')
      ? 'efootball'
      : 'free_fire';

    const normalizedMode = modeInput.toLowerCase().includes('solo') || modeInput.includes('সোলো')
      ? 'solo'
      : modeInput.toLowerCase().includes('duo') || modeInput.includes('ডুও')
      ? 'duo'
      : 'squad';

    const prizeDistributionPayload = {
      first: Number(prize1st),
      second: Number(prize2nd),
      ...(enable3rd && { third: Number(prize3rd) }),
      ...(enable4th && { fourth: Number(prize4th) }),
      ...(enable5th && { fifth: Number(prize5th) }),
      ...(enable6th && { sixth: Number(prize6th) }),
      ...(enable7th && { seventh: Number(prize7th) }),
      ...(enable8th && { eighth: Number(prize8th) }),
      ...(enable9th && { ninth: Number(prize9th) }),
      ...(enable10th && { tenth: Number(prize10th) }),
    };

    try {
      if (isEdit && tournament) {
        const res = await updateTournament(tournament.id, {
          titleBn: titleBn.trim(),
          gameId: gameIdSlug as GameId,
          gameNameBn: gameNameBn.trim(),
          mode: normalizedMode as GameMode,
          modeBn: modeInput.trim(),
          mapBn: mapBn.trim(),
          entryFee: Number(entryFee),
          prizePool: Number(totalCalculatedPrizePool),
          maxSlots: Number(maxSlots),
          startTime: startTime.trim(),
          dateFormatted: dateFormatted.trim(),
          status,
          matchRules: rulesArray,
          prizeDistribution: prizeDistributionPayload,
          descriptionBn,
          bannerUrl,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMessage(res.messageBn);
        }
      } else {
        const res = await createTournament({
          titleBn: titleBn.trim(),
          gameId: gameIdSlug as GameId,
          gameNameBn: gameNameBn.trim(),
          mode: normalizedMode as GameMode,
          modeBn: modeInput.trim(),
          mapBn: mapBn.trim(),
          entryFee: Number(entryFee),
          prizePool: Number(totalCalculatedPrizePool),
          maxSlots: Number(maxSlots),
          startTime: startTime.trim(),
          dateFormatted: dateFormatted.trim(),
          status,
          statusBn: 'আসন্ন',
          matchRules: rulesArray,
          prizeDistribution: prizeDistributionPayload,
          roomIdAvailableAt: '১৫ মিনিট আগে',
          descriptionBn,
          bannerUrl,
          roomStatus: 'hidden',
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMessage(res.messageBn);
        }
      }
    } catch (err) {
      setErrorMessage('একটি অপ্রত্যাশিত সমস্যা ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-100">
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">
              {isEdit ? 'টুর্নামেন্টের তথ্য সম্পাদনা' : 'নতুন টুর্নামেন্ট যোগ করুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tournament Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              টুর্নামেন্টের নাম (Tournament Title):
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: ফ্রি ফায়ার সোলো নাইট কাপ #৪২"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* THUMBNAIL / BANNER SECTION (Upload or URL) */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>টুর্নামেন্ট থাম্বনেইল / ব্যানার ছবি (Tournament Thumbnail)</span>
              </label>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setThumbnailMode('url')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                    thumbnailMode === 'url'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Image URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailMode('upload')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                    thumbnailMode === 'upload'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>আপলোড করুন</span>
                </button>
              </div>
            </div>

            {thumbnailMode === 'url' ? (
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/tournament-banner.jpg (ফটো লিঙ্ক)"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-emerald-300 hover:file:bg-emerald-900 border border-slate-700 bg-slate-950 rounded-xl p-1.5 cursor-pointer"
                />
              </div>
            )}

            {/* Thumbnail Preview */}
            {bannerUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-36 group">
                <img
                  src={bannerUrl}
                  alt="Thumbnail Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="absolute top-2 right-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 p-1.5 rounded-lg border border-rose-500/50 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ছবি মুছুন</span>
                </button>
              </div>
            )}
          </div>

          {/* FREE TEXT GAME NAME, MODE, MAP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                গেমের নাম (Free Text):
              </label>
              <input
                type="text"
                required
                value={gameNameBn}
                onChange={(e) => setGameNameBn(e.target.value)}
                placeholder="যেমন: ফ্রি ফায়ার / পাবজি / লুডু স্টার"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                গেমের মোড (Free Text):
              </label>
              <input
                type="text"
                required
                value={modeInput}
                onChange={(e) => setModeInput(e.target.value)}
                placeholder="যেমন: সোলো / স্কোয়াড / CS 4v4 / 1v1"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                ম্যাপের নাম (Free Text):
              </label>
              <input
                type="text"
                required
                value={mapBn}
                onChange={(e) => setMapBn(e.target.value)}
                placeholder="যেমন: বারমুডা / ইরাঙ্গেল / কালহারি"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ENTRY FEE & MAX SLOTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">এন্ট্রি ফি (৳ BDT):</label>
              <input
                type="number"
                min="0"
                required
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">সর্বোচ্চ স্লট (Max Slots):</label>
              <input
                type="number"
                min="2"
                required
                value={maxSlots}
                onChange={(e) => setMaxSlots(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* EXTENDED PRIZE BREAKDOWN SECTION (1st to 10th Place) */}
          <div className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <Trophy className="w-4 h-4" />
                <span>পুরস্কার মানি কনফিগারেশন (১ম থেকে ১০ম স্থান পর্যন্ত)</span>
              </span>
              <span className="text-xs font-bold text-white bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                মোট প্রাইজপুল: ৳{totalCalculatedPrizePool}
              </span>
            </div>

            {/* Default Mandatory 1st and 2nd */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  প্রথম পুরস্কার (১ম স্থান ৳):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={prize1st}
                  onChange={(e) => setPrize1st(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  দ্বিতীয় পুরস্কার (২য় স্থান ৳):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={prize2nd}
                  onChange={(e) => setPrize2nd(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Optional 3rd to 10th Prizes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">
                অতিরিক্ত পুরস্কার নির্বাচন করুন (৩য় থেকে ১০ম স্থান):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 3rd Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable3rd(!enable3rd)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable3rd ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>তৃতীয় পুরস্কার (৩য় স্থান)</span>
                  </button>
                  {enable3rd && (
                    <input
                      type="number"
                      min="0"
                      value={prize3rd}
                      onChange={(e) => setPrize3rd(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 4th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable4th(!enable4th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable4th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>চতুর্থ পুরস্কার (৪র্থ স্থান)</span>
                  </button>
                  {enable4th && (
                    <input
                      type="number"
                      min="0"
                      value={prize4th}
                      onChange={(e) => setPrize4th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 5th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable5th(!enable5th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable5th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>পঞ্চম পুরস্কার (৫ম স্থান)</span>
                  </button>
                  {enable5th && (
                    <input
                      type="number"
                      min="0"
                      value={prize5th}
                      onChange={(e) => setPrize5th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 6th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable6th(!enable6th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable6th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>ষষ্ঠ পুরস্কার (৬ষ্ঠ স্থান)</span>
                  </button>
                  {enable6th && (
                    <input
                      type="number"
                      min="0"
                      value={prize6th}
                      onChange={(e) => setPrize6th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 7th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable7th(!enable7th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable7th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>সপ্তম পুরস্কার (৭ম স্থান)</span>
                  </button>
                  {enable7th && (
                    <input
                      type="number"
                      min="0"
                      value={prize7th}
                      onChange={(e) => setPrize7th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 8th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable8th(!enable8th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable8th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>অষ্টম পুরস্কার (৮ম স্থান)</span>
                  </button>
                  {enable8th && (
                    <input
                      type="number"
                      min="0"
                      value={prize8th}
                      onChange={(e) => setPrize8th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 9th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable9th(!enable9th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable9th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>নবম পুরস্কার (৯ম স্থান)</span>
                  </button>
                  {enable9th && (
                    <input
                      type="number"
                      min="0"
                      value={prize9th}
                      onChange={(e) => setPrize9th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>

                {/* 10th Place */}
                <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEnable10th(!enable10th)}
                    className="flex items-center gap-2 font-semibold text-slate-300 mb-1"
                  >
                    {enable10th ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                    <span>দশম পুরস্কার (১০ম স্থান)</span>
                  </button>
                  {enable10th && (
                    <input
                      type="number"
                      min="0"
                      value={prize10th}
                      onChange={(e) => setPrize10th(Number(e.target.value))}
                      placeholder="৳ পরিমান"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DATE & MATCH TIME WITH CALENDAR & AM/PM SELECTOR */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>তারিখ ও ম্যাচ সময় নির্বাচন (Calendar & Time Selector)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Section with Calendar */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>তারিখ বাছুন (ক্যালেন্ডার):</span>
                </label>

                <input
                  type="date"
                  value={dateIso}
                  onChange={(e) => handleDateIsoChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark]"
                />

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDatePresetDaysOffset(0)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    আজকে
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePresetDaysOffset(1)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    আগামীকাল
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePresetDaysOffset(3)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    ৩ দিন পর
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePresetDaysOffset(7)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    ৭ দিন পর
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePresetDaysOffset(10)}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    ১০ দিন পর
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                    বাংলা ফরম্যাট করা তারিখ (স্বয়ংক্রিয় / কাস্টমাইজ):
                  </label>
                  <input
                    type="text"
                    required
                    value={dateFormatted}
                    onChange={(e) => setDateFormatted(e.target.value)}
                    placeholder="যেমন: ১৫ অক্টোবর, ২০২৬"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Section with Time Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ম্যাচ সময় বাছুন (Time & AM/PM):</span>
                </label>

                <input
                  type="time"
                  value={timeIso}
                  onChange={(e) => handleTimeIsoChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none [color-scheme:dark] font-mono"
                />

                {/* Quick Time Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setStartTime('04:00 PM'); setTimeIso('16:00'); }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    04:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartTime('07:30 PM'); setTimeIso('19:30'); }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    07:30 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartTime('08:30 PM'); setTimeIso('20:30'); }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    08:30 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartTime('09:30 PM'); setTimeIso('21:30'); }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    09:30 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartTime('10:00 PM'); setTimeIso('22:00'); }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                  >
                    10:00 PM
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                    ম্যাচ শুরুর সময় (AM/PM ফরম্যাট):
                  </label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="যেমন: 08:30 PM"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Room Unlock 15 Mins Notice */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>১৫ মিনিট পূর্বে রুম আনলক সুবিধা:</strong> নির্বাচিত সময় <strong>{startTime}</strong> ({dateFormatted}) এর ঠিক ১৫ মিনিট আগে এই টুর্নামেন্টের নিবন্ধিত ইউজারদের ডিভাইসে রুম আইডি ও পাসওয়ার্ড দৃশ্যমান করার সময়সূচী স্বয়ংক্রিয়ভাবে চালু থাকবে।
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">স্ট্যাটাস (Status):</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="upcoming">আসন্ন (Upcoming)</option>
                <option value="registration_open">রেজিস্ট্রেশন খোলা (Registration Open)</option>
                <option value="registration_closed">রেজিস্ট্রেশন বন্ধ (Registration Closed)</option>
                <option value="live">লাইভ চলছে (Live)</option>
                <option value="completed">সম্পন্ন (Completed)</option>
                <option value="cancelled">বাতিল (Cancelled)</option>
                <option value="draft">ড্রাফট (Draft)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              অফিশিয়াল নিয়মাবলী (প্রতিটি নিয়ম নতুন লাইনে লিখুন):
            </label>
            <textarea
              rows={3}
              value={matchRulesText}
              onChange={(e) => setMatchRulesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="md" type="button" onClick={onClose}>
              বাতিল
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </span>
              ) : isEdit ? (
                'তথ্য হালনাগাদ করুন'
              ) : (
                'টুর্নামেন্ট প্রকাশ করুন'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
