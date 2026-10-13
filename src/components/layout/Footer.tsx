import React from 'react';
import { Trophy, Shield, Phone, MessageCircle, Send, Heart, CheckCircle2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';

interface FooterProps {
  onPageChange: (page: string) => void;
  onOpenComplaint?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onPageChange, onOpenComplaint }) => {
  return (
    <footer className="bg-[#060911] border-t border-slate-800/80 pt-12 pb-20 md:pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {BRAND_CONFIG.nameBn.split(' ')[0]} <span className="text-emerald-400">{BRAND_CONFIG.nameBn.split(' ')[1]}</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              {BRAND_CONFIG.descriptionBn}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>১০০% সুরক্ষিত ও অ্যান্টি-চিট পলিসি গ্যারান্টি</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">দ্রুত নেভিগেশন</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onPageChange('home')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  হোম পেইজ
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('tournaments')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  চলমান টুর্নামেন্ট
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('leaderboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  চ্যাম্পিয়ন লিডারবোর্ড
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('wallet')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  মাই ওয়ালেট & ক্যাশআউট
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onOpenComplaint) onOpenComplaint();
                    else onPageChange('support');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>অফিসিয়াল অভিযোগ বক্স</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Payment Transparency Notice */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">পেমেন্ট সিকিউরিটি</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              দিকান্ত অ্যারেনায় কেবল অ্যাডমিন কর্তৃক অন-বোর্ডকৃত অনুমোদিত পেমেন্ট চ্যানেলের মাধ্যমে নিরাপদে ডিপোজিট ও উইথড্র সুবিধা প্রদান করা হয়।
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
              <span className="text-emerald-400 font-bold block mb-1">অ্যাডমিন কনট্রোল্ড চ্যানেল</span>
              <span>সকল লেনদেন নিরাপদ সার্ভার ভ্যালিডেশনের মাধ্যমে পরিচালিত হয়।</span>
            </div>
          </div>

          {/* Col 4: Customer Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">সাহায্য ও সাপোর্ট</h4>
            <p className="text-xs text-slate-400">
              যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন:
            </p>
            <div className="space-y-2 text-xs">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg text-emerald-400 hover:bg-emerald-900/40 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>হোয়াটসঅ্যাপ সাপোর্ট (২৪/৭)</span>
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-sky-950/40 border border-sky-800/40 p-2 rounded-lg text-sky-400 hover:bg-sky-900/40 transition-colors"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>টেলিগ্রাম চ্যানেল ও কমিউনিটি</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{BRAND_CONFIG.copyrightBn}</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>বাংলাদেশের গেমারদের জন্য নিবেদিত</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
