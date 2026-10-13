import React from 'react';
import { Button } from '../common/Button';
import { Trophy, Shield, Zap, ArrowRight, Flame } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';

interface HeroSectionProps {
  onExploreClick: () => void;
  onJoinClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onJoinClick,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24 bg-gradient-to-b from-[#0b1120] via-[#090d16] to-[#090d16] border-b border-slate-800/80">
      {/* Background Accent Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top Kicker Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{BRAND_CONFIG.nameBn} — ই-স্পোর্টস টুর্নামেন্ট অ্যারেনা</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              আপনার গেমিং স্কিল দেখিয়ে{' '}
              <span className="text-gradient-emerald">নগদ টাকা পুরষ্কার</span> জিতুন!
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              ফ্রি ফায়ার, পাবজি মোবাইল, ব্লাড স্ট্রাইক এবং ই-ফুটবল টুর্নামেন্টে অংশ নিন। সরাসরি অনুমোদিত চ্যানেলে দ্রুত পুরষ্কার ক্যাশআউট সুবিধা।
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<Trophy className="w-5 h-5" />}
                onClick={onJoinClick}
                className="w-full sm:w-auto"
              >
                টুর্নামেন্টে যোগ দিন
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                onClick={onExploreClick}
                className="w-full sm:w-auto"
              >
                গেমসমূহ দেখুন
              </Button>
            </div>

            {/* Anti-cheat Trust Banner */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>১০০% অটোমেটেড অ্যান্টি-চিট সিকিউরিটি</span>
              </div>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>অনুমোদিত পেমেন্ট চ্যানেল</span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Tournament Highlight Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl p-1 bg-gradient-to-b from-emerald-500/30 via-slate-800 to-slate-900 shadow-2xl shadow-emerald-950/40">
              <div className="bg-[#0f172a] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>আজকের মেগা ম্যাচ</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    রেজিস্ট্রেশন চলছে
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white leading-snug">
                    ফ্রি ফায়ার গ্র্যান্ড বারমুডা চ্যাম্পিয়নশিপ
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    স্কোয়াড ম্যাচ • বারমুডা ম্যাপ • আজ রাত ৮:৩০ টা
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block">মোট পুরষ্কার</span>
                    <span className="text-emerald-400 font-extrabold text-xl tabular-nums">৳৫,০০০</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">এন্ট্রি ফি</span>
                    <span className="text-white font-bold text-xl tabular-nums">৳৫০</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  onClick={onJoinClick}
                >
                  এখনই যোগ দিন (৳৫০)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Statistics Strip (Public Demonstration Metrics) */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">৳১০,০০,০০০+</span>
            <span className="text-xs text-slate-400 block mt-1">বিতরণকৃত প্রাইজমানি</span>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-300 tabular-nums">৫০,০০০+</span>
            <span className="text-xs text-slate-400 block mt-1">নিবন্ধিত গেমার</span>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 tabular-nums">১,৫০০+</span>
            <span className="text-xs text-slate-400 block mt-1">সফল টুর্নামেন্ট</span>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 tabular-nums">১০০%</span>
            <span className="text-xs text-slate-400 block mt-1">অ্যান্টি-চিট সিকিউরিটি</span>
          </div>
        </div>
      </div>
    </section>
  );
};
