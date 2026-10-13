import React from 'react';
import { UserPlus, Wallet, Gamepad2, Gift } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '১',
      title: 'অ্যাাকাউন্ট খুলুন',
      desc: 'আপনার নাম ও মোবাইল নম্বর দিয়ে মাত্র ১ মিনিটে ফ্রি অ্যাকাউন্ট তৈরি করুন।',
      icon: UserPlus,
    },
    {
      num: '২',
      title: 'ব্যালেন্স ডিপোজিট করুন',
      desc: 'বিকাশ, নগদ বা রকেটের মাধ্যমে খুব সহজেই সর্বনিম্ন ৫০ টাকা ডিপোজিট করুন।',
      icon: Wallet,
    },
    {
      num: '৩',
      title: 'টুর্নামেন্টে যোগ দিন',
      desc: 'পছন্দের গেম সিলেক্ট করে টুর্নামেন্টে যোগ দিন এবং নির্দিষ্ট সময় রুম আইডি পান।',
      icon: Gamepad2,
    },
    {
      num: '৪',
      title: 'পুরষ্কার উইথড্র করুন',
      desc: 'ম্যাচে জয়লাভের পর সরাসরি বিকাশ বা নগদে টাকা উত্তোলন করে নিন।',
      icon: Gift,
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#060911] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            কীভাবে <span className="text-emerald-400">অংশগ্রহণ করবেন?</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            মাত্র ৪টি সহজ ধাপে টুর্নামেন্টে অংশ নিয়ে জিতে নিন চমৎকার নগদ অর্থ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800/80 relative hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 tabular-nums">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
