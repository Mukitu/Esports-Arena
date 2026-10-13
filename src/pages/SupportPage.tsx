import React, { useState } from 'react';
import { HelpCircle, MessageCircle, Send, Phone, ShieldCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BRAND_CONFIG } from '../config/brand';
import { useAiChat } from '../context/AiChatContext';
import { useAuth } from '../context/AuthContext';
import { ComplaintModal } from '../components/complaints/ComplaintModal';

export const SupportPage: React.FC = () => {
  const { openChat } = useAiChat();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);

  const handleOpenComplaint = () => {
    if (!isAuthenticated) {
      openAuthModal('অভিযোগ জমা দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।');
      return;
    }
    setComplaintModalOpen(true);
  };

  return (
    <div className="py-8 sm:py-12 bg-[#090d16] min-h-screen font-['Hind_Siliguri',sans-serif]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-emerald-400" />
            <span>সহায়তা কেন্দ্র & <span className="text-emerald-400">হেল্পলাইন</span></span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            {BRAND_CONFIG.nameBn} টুর্নামেন্ট সংক্রান্ত যেকোনো প্রশ্ন বা সহযোগিতার জন্য আমাদের হেল্পডেস্কে যোগাযোগ করুন
          </p>
        </div>

        {/* Feature Highlight: Dedicated Complaint Box Banner */}
        <div className="bg-gradient-to-r from-rose-950/50 via-[#0f172a] to-slate-900 rounded-2xl p-6 sm:p-8 border border-rose-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>অফিসিয়াল অভিযোগ বক্স (Dispute & Report Box)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              কোনো ম্যাচ, প্লেয়ার বা পেমেন্টে সমস্যা হয়েছে?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              সরাসরি টাইটেল, বিস্তারিত বিবরণ এবং <strong>স্ক্রিনশটের ছবি</strong> আপলোড করে অভিযোগ দাখিল করুন। অ্যাডমিন টিম অভিযোগ রিভিউ করে তদন্ত সাপেক্ষে দ্রুত সমাধান ও প্রয়োজনীয় ব্যবস্থা গ্রহণ করবে।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Button
              variant="primary"
              size="lg"
              icon={<ShieldAlert className="w-4 h-4" />}
              onClick={handleOpenComplaint}
            >
              অভিযোগ জমা দিন
            </Button>
            <button
              onClick={handleOpenComplaint}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>আমার অভিযোগের স্ট্যাটাস দেখুন</span>
            </button>
          </div>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Diganta AI Assistant Card */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-emerald-500/40 relative overflow-hidden space-y-4 shadow-lg shadow-emerald-950/30">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <HelpCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">দিগন্ত এআই</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">২৪/৭ AI</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">তাৎক্ষণিক টুর্নামেন্ট ও নিয়মের উত্তর</p>
            </div>
            <button
              onClick={() => openChat()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              এআই-এর সাথে কথা বলুন
            </button>
          </div>

          {/* WhatsApp Support */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">হোয়াটসঅ্যাপ সাপোর্ট</h3>
              <p className="text-xs text-slate-400 mt-1">তাৎক্ষণিক মেসেজ ও কল সুবিধা (২৪/৭)</p>
            </div>
            <a href="https://wa.me/" target="_blank" rel="noreferrer">
              <Button variant="primary" fullWidth size="md">
                WhatsApp এ চ্যাট করুন
              </Button>
            </a>
          </div>

          {/* Telegram Channel */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">টেলিগ্রাম চ্যানেল</h3>
              <p className="text-xs text-slate-400 mt-1">সর্বশেষ টুর্নামেন্ট ও রুম আইডি নোটিশ</p>
            </div>
            <a href="https://t.me/" target="_blank" rel="noreferrer">
              <Button variant="secondary" fullWidth size="md">
                Telegram গ্রুপে যোগ দিন
              </Button>
            </a>
          </div>

          {/* Phone Helpline */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">সরাসরি ফোন হেল্পলাইন</h3>
              <p className="text-xs text-slate-400 mt-1">সকাল ১০টা থেকে রাত ১১টা পর্যন্ত</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl text-center font-mono font-bold text-emerald-400 text-sm border border-slate-800">
              {BRAND_CONFIG.helplinePhone}
            </div>
          </div>
        </div>

        {/* Rulebook Notice */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>ফেয়ার প্লে ও অ্যান্টি-চিট নীতিমালা</span>
          </h3>
          <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p>১. সকল ম্যাচ অফিশিয়াল কাস্টম রুমে অনুষ্ঠিত হয়। রুম আইডি শেয়ার করা কঠোরভাবে নিষিদ্ধ।</p>
            <p>২. ইন-গেম নাম বা ইউজার আইডি মিল না থাকলে প্লেয়ারকে কাস্টম রুম থেকে কিক করা হবে।</p>
            <p>৩. ম্যাচ চলাকালীন যেকোনো প্রকার হ্যাক, গ্লিচ বা থার্ড-পার্টি টুলস ব্যবহার প্রমাণিত হলে সাথে সাথে অ্যাকাউন্ট ব্যান ও ওয়ালেট ব্যালেন্স বাজেয়াপ্ত হবে।</p>
            <p>৪. ফলাফল সংক্রান্ত কোনো সমস্যা দেখা দিলে অভিযোগ বক্সে স্ক্রিনশট প্রমাণসহ অভিযোগ সাবমিট করুন।</p>
          </div>
        </div>
      </div>

      {/* Complaint Box Modal */}
      <ComplaintModal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
      />
    </div>
  );
};
