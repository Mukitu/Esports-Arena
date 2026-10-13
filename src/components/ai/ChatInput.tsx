import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Volume2
} from 'lucide-react';
import { useAiChat } from '../../context/AiChatContext';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const { userProfile } = useAiChat();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = userProfile.language === 'en' ? 'en-US' : 'bn-BD';

        recog.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        recog.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInput((prev) => {
              // Replace or append
              return currentTranscript;
            });
          }
        };

        recog.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          setIsListening(false);
          if (e.error === 'not-allowed') {
            setSpeechError(
              userProfile.language === 'en'
                ? 'Microphone permission denied. Please allow microphone in browser.'
                : 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারে পারমিশন দিন।'
            );
          } else if (e.error === 'no-speech') {
            // No speech detected, quietly reset
          } else {
            setSpeechError(
              userProfile.language === 'en'
                ? 'Could not recognize voice. Please try again.'
                : 'ভয়েস স্পষ্ট শোনা যায়নি, অনুগ্রহ করে আবার বলুন।'
            );
          }
          setTimeout(() => setSpeechError(null), 4000);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      } catch (err) {
        console.warn('Error initializing SpeechRecognition:', err);
      }
    }
  }, [userProfile.language]);

  const handleToggleSpeech = () => {
    if (!speechSupported || !recognitionRef.current) {
      setSpeechError(
        userProfile.language === 'en'
          ? 'Voice input is not supported in this browser. Please use Chrome or Edge.'
          : 'আপনার ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। দয়া করে Chrome ব্যবহার করুন।'
      );
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = userProfile.language === 'en' ? 'en-US' : 'bn-BD';
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechError(null);
      } catch (e) {
        console.warn('Could not start recognition:', e);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const isEn = userProfile.language === 'en';

  return (
    <div className="border-t border-slate-800 bg-[#090d16]/95 p-3 space-y-2">
      {/* Speech active / error indicator */}
      {speechError && (
        <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{isEn ? 'Listening to your voice... Speak now' : 'মুখে কথা বলুন... শুনছি...'}</span>
        </div>
      )}

      {/* Main input container - NO SUGGESTIONS */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-[#0d1322] border border-slate-700/80 rounded-xl p-1.5 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all"
      >
        <button
          type="button"
          onClick={handleToggleSpeech}
          disabled={isLoading}
          title={isListening ? (isEn ? 'Stop Voice' : 'কথা বলা বন্ধ করুন') : (isEn ? 'Speak with Microphone' : 'মাইক্রোফোনে কথা বলুন')}
          className={`p-2 rounded-lg transition-all shrink-0 ${
            isListening
              ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/50'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? (isEn ? 'Listening... Speak now' : 'শুনছি... মুখে কথা বলুন...')
              : (isEn ? 'Type your question... (Press Enter)' : 'আপনার প্রশ্নটি লিখুন... (Enter চাপুন)')
          }
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none outline-none py-1.5 px-1 max-h-[120px] font-['Hind_Siliguri',sans-serif] leading-relaxed"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 shrink-0 shadow-md shadow-emerald-500/20"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
