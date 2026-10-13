import React, { useState } from 'react';
import { X, User, Lock, AlertCircle, RefreshCw, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '../common/Button';
import { BRAND_CONFIG } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authPromptMessage, closeAuthModal, loginWithEmail, signUpWithEmail, isBackendConnected } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (mode === 'register' && !name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.errorBn || 'লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড পুনরায় চেক করুন।');
        }
      } else {
        const res = await signUpWithEmail(email, password, name);
        if (!res.success) {
          setErrorMessage(res.errorBn || 'নিবন্ধন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
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
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl text-slate-100">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          aria-label="মোডাল বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Auth Guard Banner Notice */}
        {authPromptMessage && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{authPromptMessage}</span>
          </div>
        )}

        {/* Backend Connection Status Notice if not configured */}
        {!isBackendConnected && (
          <div className="mb-4 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
            <span>সুপাবেস ডেটাবেস সংযোগ কনফিগারেশন প্রয়োজন</span>
            <span className="text-amber-400 font-semibold">অফলাইন মোড</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? `${BRAND_CONFIG.nameBn}-য় লগইন করুন` : `${BRAND_CONFIG.nameBn}-য় নতুন অ্যাকাউন্ট খুলুন`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'আপনার নিবন্ধিত ইমেইল ঠিকানা দিয়ে প্রবেশ করুন'
              : 'টুর্নামেন্টে অংশগ্রহণ করতে আপনার প্রোফাইল তৈরি করুন'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                আপনার পূর্ণ নাম:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              আপনার ইমেইল ঠিকানা:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              পাসওয়ার্ড:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-10 py-2 text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={submitting}
            className="mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>প্রসেসিং হচ্ছে...</span>
              </span>
            ) : mode === 'login' ? (
              'লগইন করুন'
            ) : (
              'নিবন্ধন সম্পন্ন করুন'
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-4 border-t border-slate-800 text-xs text-slate-400 mt-4">
          {mode === 'login' ? (
            <p>
              অ্যাাকাউন্ট নেই?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(null); }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                নতুন অ্যাকাউন্ট নিবন্ধন করুন
              </button>
            </p>
          ) : (
            <p>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(null); }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                এখানে লগইন করুন
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
