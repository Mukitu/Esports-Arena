import React, { useState } from 'react';
import { FAQ_DATA } from '../../data/sampleData';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-12 md:py-16 bg-[#090d16]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>সাহায্য কেন্দ্র</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            সাধারণ <span className="text-emerald-400">জিজ্ঞাসা (FAQ)</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            টুর্নামেন্ট, ডিপোজিট ও উইথড্র সংক্রান্ত সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-100">
                    {item.qBn}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {item.aBn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
