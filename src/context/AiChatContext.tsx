import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatMessage, AI_CONFIG, DigantaContextData, AiUserProfile } from '../config/aiConfig';
import { sendChatMessage } from '../services/aiChatService';
import { useAuth } from './AuthContext';
import { fetchTournaments } from '../services/tournamentService';
import { fetchPaymentMethods } from '../services/paymentService';

interface AiChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  isVoiceSpeaking: boolean;
  voiceEnabled: boolean;
  userProfile: AiUserProfile;
  isProfileSetupOpen: boolean;
  openChat: (initialQuery?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  restoreChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  speakMessage: (text: string) => void;
  stopSpeaking: () => void;
  toggleVoice: () => void;
  saveUserProfile: (name: string, phone: string, language: 'bn' | 'en') => void;
  resetUserProfile: () => void;
  openProfileSetup: () => void;
  closeProfileSetup: () => void;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export const AiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);

  // Clean up any legacy localStorage from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem(AI_CONFIG.storageKeyProfile);
      localStorage.removeItem(AI_CONFIG.storageKeyMessages);
    } catch {}
  }, []);

  // Load User Profile (Name, Phone, Language) from SessionStorage
  // When browser or tab is closed, sessionStorage is automatically wiped so it asks again next time
  const [userProfile, setUserProfile] = useState<AiUserProfile>(() => {
    try {
      const saved = sessionStorage.getItem(AI_CONFIG.storageKeyProfile);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.isConfigured) return parsed;
      }
    } catch {}
    return {
      name: '',
      phone: '',
      language: 'bn',
      isConfigured: false,
    };
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AI_CONFIG.storageKeyVoice) === 'true';
    } catch {
      return false;
    }
  });

  const getGreetingMessage = (profile: AiUserProfile): ChatMessage => {
    const isEn = profile.language === 'en';
    const nameStr = profile.name.trim();

    if (isEn) {
      const content = nameStr
        ? `Hello **${nameStr}**! Welcome to Diganta Arena. I am your personal gaming assistant **${AI_CONFIG.assistantNameEn}**. How can I assist you today?`
        : `Hello gamer! Welcome to Diganta Arena. I am **${AI_CONFIG.assistantNameEn}**, your personal gaming assistant. Feel free to ask me anything about tournaments, wallets, or rules!`;
      return {
        id: 'welcome-msg',
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const content = nameStr
      ? `হ্যালো **${nameStr}**! দিগন্ত অ্যারেনায় আপনাকে স্বাগতম। আমি আপনার ব্যক্তিগত গেমিং সহকারী **${AI_CONFIG.assistantNameBn}**। টুর্নামেন্ট, ডিপোজিট বা যেকোনো বিষয়ে আপনার প্রশ্ন করুন!`
      : `স্বাগতম! 🎮 আমি **${AI_CONFIG.assistantNameBn}** — দিগন্ত অ্যারেনার অফিসিয়াল গেমিং সহকারী। টুর্নামেন্ট রেজিস্ট্রেশন, ওয়ালেট বা গেমপ্লে সম্পর্কিত যেকোনো প্রশ্ন আমাকে করতে পারেন!`;

    return {
      id: 'welcome-msg',
      role: 'assistant',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(AI_CONFIG.storageKeyMessages);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [getGreetingMessage(userProfile)];
  });

  // Save messages to SessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(AI_CONFIG.storageKeyMessages, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const saveUserProfile = (name: string, phone: string, language: 'bn' | 'en') => {
    const updated: AiUserProfile = {
      name: name.trim() || 'গেমার',
      phone: phone.trim(),
      language,
      isConfigured: true,
    };
    setUserProfile(updated);
    try {
      sessionStorage.setItem(AI_CONFIG.storageKeyProfile, JSON.stringify(updated));
    } catch {}

    const newGreeting = getGreetingMessage(updated);
    setMessages([newGreeting]);
    setIsProfileSetupOpen(false);

    if (voiceEnabled) {
      speakMessage(newGreeting.content);
    }
  };

  const resetUserProfile = () => {
    const cleared: AiUserProfile = {
      name: '',
      phone: '',
      language: 'bn',
      isConfigured: false,
    };
    setUserProfile(cleared);
    try {
      sessionStorage.removeItem(AI_CONFIG.storageKeyProfile);
    } catch {}
    setIsProfileSetupOpen(true);
  };

  const openProfileSetup = () => setIsProfileSetupOpen(true);
  const closeProfileSetup = () => setIsProfileSetupOpen(false);

  const openChat = (initialQuery?: string) => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!userProfile.isConfigured) {
      setIsProfileSetupOpen(true);
    }
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    stopSpeaking();
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      stopSpeaking();
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      if (!userProfile.isConfigured) {
        setIsProfileSetupOpen(true);
      }
    }
  };

  const minimizeChat = () => setIsMinimized(true);
  const restoreChat = () => setIsMinimized(false);

  const clearHistory = () => {
    setMessages([getGreetingMessage(userProfile)]);
    stopSpeaking();
    try {
      sessionStorage.removeItem(AI_CONFIG.storageKeyMessages);
    } catch {}
  };

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    try {
      sessionStorage.setItem(AI_CONFIG.storageKeyVoice, String(nextVal));
    } catch {}
    if (!nextVal) stopSpeaking();
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsVoiceSpeaking(false);
    }
  };

  const speakMessage = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanedText = text
        .replace(/[*#_`]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      const isEnglish = userProfile.language === 'en';

      if (isEnglish) {
        utterance.lang = 'en-US';
      } else {
        const voices = window.speechSynthesis.getVoices();
        const bnVoice = voices.find((v) => v.lang.includes('bn') || v.lang.includes('ben'));
        if (bnVoice) utterance.voice = bnVoice;
        utterance.lang = 'bn-BD';
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsVoiceSpeaking(true);
      utterance.onend = () => setIsVoiceSpeaking(false);
      utterance.onerror = () => setIsVoiceSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsVoiceSpeaking(false);
    }
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let activeTournaments: DigantaContextData['activeTournaments'] = [];
      try {
        const tours = await fetchTournaments();
        activeTournaments = (tours || []).slice(0, 8).map((t) => ({
          id: t.id,
          titleBn: t.titleBn,
          gameNameBn: t.gameNameBn,
          entryFee: t.entryFee,
          prizePool: t.prizePool,
          statusBn: t.statusBn,
          startTime: t.startTime,
        }));
      } catch {}

      let activePaymentMethods: DigantaContextData['activePaymentMethods'] = [];
      try {
        const methods = await fetchPaymentMethods();
        activePaymentMethods = (methods || []).map((m) => ({
          id: m.id,
          nameBn: m.nameBn,
          provider: m.provider,
          accountNumber: m.accountNumber,
          minDeposit: m.minDeposit,
          minWithdraw: m.minWithdraw,
          instructionsBn: m.instructionsBn,
        }));
      } catch {}

      const contextData: DigantaContextData = {
        user: {
          name: userProfile.name || user?.name,
          phone: userProfile.phone || user?.phone,
          preferredLanguage: userProfile.language,
          walletBalance: user?.walletBalance,
          roles: user?.roles,
          isLoggedIn: isAuthenticated,
        },
        activeTournaments,
        activePaymentMethods,
      };

      const result = await sendChatMessage({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        context: contextData,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (voiceEnabled) {
        speakMessage(result.content);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const isEn = userProfile.language === 'en';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isEn
          ? 'Sorry, unable to connect right now. Please try again.'
          : 'দুঃখিত, সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AiChatContext.Provider
      value={{
        messages,
        isOpen,
        isMinimized,
        isLoading,
        isVoiceSpeaking,
        voiceEnabled,
        userProfile,
        isProfileSetupOpen,
        openChat,
        closeChat,
        toggleChat,
        minimizeChat,
        restoreChat,
        sendMessage,
        clearHistory,
        speakMessage,
        stopSpeaking,
        toggleVoice,
        saveUserProfile,
        resetUserProfile,
        openProfileSetup,
        closeProfileSetup,
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChat = () => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error('useAiChat must be used within an AiChatProvider');
  }
  return context;
};
