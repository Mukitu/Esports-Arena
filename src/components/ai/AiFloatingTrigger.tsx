import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useAiChat } from '../../context/AiChatContext';
import { AI_CONFIG } from '../../config/aiConfig';

export const AiFloatingTrigger: React.FC = () => {
  const { isOpen, toggleChat } = useAiChat();

  // If already open (and not minimized), the floating button can stay hidden or serve as a quick toggle
  if (isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 group">
      <button
        onClick={toggleChat}
        className="relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-slate-950 font-extrabold px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl shadow-emerald-500/30 border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Open Diganta AI Assistant"
      >
        {/* Glow halo */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-25 blur group-hover:opacity-60 transition duration-300 -z-10" />

        <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>

        <span className="text-xs sm:text-sm font-bold text-slate-950 flex items-center gap-1 font-['Hind_Siliguri',sans-serif]">
          {AI_CONFIG.assistantNameBn}
          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
        </span>
      </button>
    </div>
  );
};
