// Configuration for Diganta AI Gaming Assistant
export const AI_CONFIG = {
  assistantNameBn: 'দিগন্ত এআই',
  assistantNameEn: 'Diganta AI',
  taglineBn: 'গেমিং ও টুর্নামেন্ট অ্যাসিস্ট্যান্ট',
  defaultGroqModel: 'openai/gpt-oss-120b',
  fallbackGroqModel: 'openai/gpt-oss-20b',
  storageKeyMessages: 'diganta_arena_ai_messages_v1',
  storageKeyVoice: 'diganta_arena_ai_voice_enabled',
  storageKeyProfile: 'diganta_arena_ai_profile_v1',
  defaultGroqKey: '',
};

export interface AiUserProfile {
  name: string;
  phone: string;
  language: 'bn' | 'en';
  isConfigured: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO or formatted
  isStreaming?: boolean;
}

export interface DigantaContextData {
  user?: {
    name?: string;
    phone?: string;
    preferredLanguage?: 'bn' | 'en';
    walletBalance?: number;
    roles?: string[];
    isLoggedIn?: boolean;
  };
  activeTournaments?: Array<{
    id: string;
    titleBn: string;
    gameNameBn: string;
    entryFee: number;
    prizePool: number;
    statusBn: string;
    startTime: string;
  }>;
  activePaymentMethods?: Array<{
    id: string;
    nameBn: string;
    provider: string;
    accountNumber: string;
    minDeposit: number;
    minWithdraw: number;
    instructionsBn?: string;
  }>;
  brand?: {
    nameBn: string;
    supportEmail: string;
    helplinePhone: string;
  };
}
