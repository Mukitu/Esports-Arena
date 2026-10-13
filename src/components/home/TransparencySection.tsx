import React from 'react';
import { ShieldCheck, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';

export const TransparencySection: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-[#090d16]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-emerald-950/30 rounded-3xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>স্বচ্ছতা ও সুরক্ষা ব্যবস্থা</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                সম্পূর্ণ স্বচ্ছ ফলাফল এবং{' '}
                <span className="text-emerald-400">অ্যাডমিন-নিয়ন্ত্রিত চ্যানেল</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {BRAND_CONFIG.nameBn}-য় প্রতিটি টুর্নামেন্টের ফলাফল এবং ওয়ালেট লেনদেন সম্পূর্ণ স্বচ্ছতা ও অ্যান্টি-চিট পলিসি মেনে প্রসেস করা হয়।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">অনুমোদিত প্রসেসিং</h4>
                    <p className="text-[11px] text-slate-400">অ্যাডমিন দ্বারা অন-বোর্ডকৃত পেমেন্ট চ্যানেলে উইথড্র ব্যবস্থা।</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">অ্যান্টি-চিট পলিসি</h4>
                    <p className="text-[11px] text-slate-400">হ্যাকিং বা অনিয়ম রোধে ইন-গেম ট্র্যাকিং ও অডিট।</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>প্ল্যাটফর্ম সিকিউরিটি গ্যারান্টি</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>অটোমেটেড রুম আইডি ডেলিভারি</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pl-6">
                    টুর্নামেন্ট শুরুর ১৫ মিনিট পূর্বে কেবল ভ্যালিড রেজিস্ট্রেশনকৃত গেমারের ড্যাশবোর্ডে রুম আইডি প্রকাশিত হয়।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>সার্ভার ভ্যালিডেটেড ওয়ালেট লেজার</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pl-6">
                    প্রতিটি ওয়ালেট ট্রানজেকশন সার্ভার-সাইড এনক্রিপশন ও অথরাইজেশন ফিল্টারের মাধ্যমে সুরক্ষিত।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
