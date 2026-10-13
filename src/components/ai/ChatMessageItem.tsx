import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ChatMessage } from '../../config/aiConfig';

interface ChatMessageItemProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSpeak,
  isSpeaking,
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown Formatter (Bold, Bullet Points, Headers)
  const formatContent = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Bullet list
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Parse bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-0.5">
            {renderedParts}
          </li>
        );
      }

      // Check if numbered list (e.g. "১. " or "1. ")
      if (/^([০-৯]|\d+)\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="my-1 text-slate-200">
            {renderedParts}
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex gap-2.5 sm:gap-3 ${
        isAssistant ? 'items-start' : 'items-start flex-row-reverse'
      } animate-in fade-in duration-200`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
          isAssistant
            ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-bold'
            : 'bg-slate-800 text-slate-200 border border-slate-700'
        }`}
      >
        {isAssistant ? <Bot className="w-4 h-4 text-slate-950" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md font-['Hind_Siliguri',sans-serif] ${
            isAssistant
              ? 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-sm'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm font-medium'
          }`}
        >
          {formatContent(message.content)}
        </div>

        {/* Action Toolbar for Assistant Response */}
        {isAssistant && (
          <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
            <span className="text-[10px] text-slate-500">{message.timestamp}</span>

            <button
              onClick={handleCopy}
              title="টেক্সট কপি করুন"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px]">কপি হয়েছে</span>
                </>
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                title={isSpeaking ? 'থামুন' : 'শুনুন'}
                className="hover:text-emerald-400 transition-colors"
              >
                {isSpeaking ? (
                  <VolumeX className="w-3 h-3 text-rose-400 animate-pulse" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
