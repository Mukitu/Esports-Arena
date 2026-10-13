import React, { useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Minus,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
  Maximize2,
  UserCheck
} from 'lucide-react';
import { useAiChat } from '../../context/AiChatContext';
import { AI_CONFIG } from '../../config/aiConfig';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { AiProfileSetupModal } from './AiProfileSetupModal';

export const DigantaAiModal: React.FC = () => {
  const {
    messages,
    isOpen,
    isMinimized,
    isLoading,
    isVoiceSpeaking,
    voiceEnabled,
    userProfile,
    closeChat,
    minimizeChat,
    restoreChat,
    sendMessage,
    clearHistory,
    speakMessage,
    toggleVoice,
    resetUserProfile,
  } = useAiChat();

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside chat message container ONLY (strictly never scrolls the window or page)
  useEffect(() => {
    if (isOpen && !isMinimized && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  if (!isOpen) return null;

  // Render minimized floating pill in the exact bottom right corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={restoreChat}
          className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all group font-semibold text-xs sm:text-sm cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950/40 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <span>{AI_CONFIG.assistantNameBn}</span>
          <Maximize2 className="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    );
  }

  const isEn = userProfile.language === 'en';

  return (
    <div
      className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100dvh-100px)] z-50 flex flex-col bg-[#090d16] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-['Hind_Siliguri',sans-serif] animate-in fade-in zoom-in-95 duration-200 overscroll-contain"
    >
      {/* Profile Onboarding / Setup Layer */}
      <AiProfileSetupModal />

      {/* Header - Clean Diganta AI Branding with zero third-party AI tags */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1322] border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <Bot className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isEn ? AI_CONFIG.assistantNameEn : AI_CONFIG.assistantNameBn}
              </h3>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isEn ? 'Online' : 'অনলাইন'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {userProfile.name ? `${userProfile.name} • ` : ''}
              {isEn ? 'Gaming Assistant' : AI_CONFIG.taglineBn}
            </p>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 text-slate-400">
          {/* User profile / Name change button */}
          <button
            onClick={resetUserProfile}
            title={isEn ? 'Change name or phone' : 'নাম বা মোবাইল নম্বর পরিবর্তন করুন'}
            className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Voice Output Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? (isEn ? 'Turn Voice Off' : 'অটো অডিও অফ করুন') : (isEn ? 'Turn Voice On' : 'অটো অডিও অন করুন')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              voiceEnabled
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'hover:text-white hover:bg-slate-800'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset chat */}
          <button
            onClick={clearHistory}
            title={isEn ? 'Clear chat history' : 'চ্যাট হিস্ট্রি ক্লিয়ার করুন'}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Minimize */}
          <button
            onClick={minimizeChat}
            title={isEn ? 'Minimize' : 'মিনিমাইজ করুন'}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={closeChat}
            title={isEn ? 'Close' : 'বন্ধ করুন'}
            className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area - scoped internal scrolling only */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar overscroll-contain bg-radial from-slate-900/40 to-transparent"
      >
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            onSpeak={speakMessage}
            isSpeaking={isVoiceSpeaking}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-400 animate-pulse px-2 py-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            </div>
            <span>{isEn ? 'Diganta AI is typing...' : 'দিগন্ত এআই উত্তর তৈরি করছে...'}</span>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};
