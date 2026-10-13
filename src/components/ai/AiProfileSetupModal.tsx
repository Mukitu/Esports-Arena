import React, { useState, useEffect } from 'react';
import { Bot, User, Phone, Globe, Check, X } from 'lucide-react';
import { useAiChat } from '../../context/AiChatContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const AiProfileSetupModal: React.FC = () => {
  const { userProfile, saveUserProfile, isProfileSetupOpen, closeProfileSetup } = useAiChat();
  const { user } = useAuth();
  const [name, setName] = useState(userProfile.name || user?.name || '');
  const [phone, setPhone] = useState(userProfile.phone || user?.phone || '');
  const [language, setLanguage] = useState<'bn' | 'en'>(userProfile.language || 'bn');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(userProfile.name || user?.name || '');
    setPhone(userProfile.phone || user?.phone || '');
    setLanguage(userProfile.language || 'bn');
  }, [userProfile, user, isProfileSetupOpen]);

  if (!isProfileSetupOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.');
      return;
    }
    setError(null);
    saveUserProfile(name.trim(), phone.trim(), language);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#090d16]/95 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-center animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-2xl relative space-y-4">
        {userProfile.isConfigured && (
          <button
            type="button"
            onClick={closeProfileSetup}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-md">
            <Bot className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {language === 'bn' ? 'স্বাগতম! আপনার পরিচয় দিন' : 'Welcome! Set up your profile'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'bn'
                ? 'আপনার সাথে সঠিকভাবে কথা বলতে নিচের তথ্যগুলো দিন'
                : 'Help me address you properly and choose your language'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {/* Name Field - No autoFocus to prevent viewport jumping */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'bn' ? 'আপনার নাম *' : 'Your Name *'}</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: সাকিব আহমেদ' : 'e.g. John Doe'}
              className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Number (Optional)'}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'bn' ? 'কথোপকথনের ভাষা' : 'Preferred Language'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  language === 'bn'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>বাংলা (Bangla)</span>
                {language === 'bn' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button variant="primary" fullWidth size="md" type="submit">
              {language === 'bn' ? 'কথোপকথন শুরু করুন' : 'Start Conversation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
