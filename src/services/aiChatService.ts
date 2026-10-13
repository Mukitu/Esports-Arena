import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ChatMessage, DigantaContextData, AI_CONFIG } from '../config/aiConfig';
import { DIGANTA_AI_SYSTEM_PROMPT } from '../data/aiPrompts';

export interface SendMessageOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  context?: DigantaContextData;
  model?: string;
  onStreamChunk?: (chunk: string) => void;
}

export interface AiResponseResult {
  content: string;
  source: 'edge_function' | 'client_proxy' | 'fallback_offline';
  modelUsed: string;
}

/**
 * Sends conversation messages to Groq AI via either:
 * 1. Supabase Edge Function `diganta-ai` (Secure recommended path)
 * 2. Or local proxy endpoint / Edge function invocation
 * 3. Or intelligent fallback response if backend functions are still being provisioned
 */
export async function sendChatMessage(options: SendMessageOptions): Promise<AiResponseResult> {
  const { messages, context } = options;

  // Format context if available
  let contextAugmentedSystemPrompt = DIGANTA_AI_SYSTEM_PROMPT;
  if (context) {
    contextAugmentedSystemPrompt += `\n\n## বর্তমান ব্যবহারকারী ও প্ল্যাটফর্ম কনটেক্সট:\n`;
    if (context.user) {
      if (context.user.name) {
        contextAugmentedSystemPrompt += `- ব্যবহারকারীর নাম: ${context.user.name}\n`;
      }
      if (context.user.phone) {
        contextAugmentedSystemPrompt += `- ব্যবহারকারীর ফোন নম্বর: ${context.user.phone}\n`;
      }
      contextAugmentedSystemPrompt += `- পছন্দের ভাষা: ${context.user.preferredLanguage === 'en' ? 'English' : 'Bangla'}\n`;
      if (context.user.isLoggedIn) {
        contextAugmentedSystemPrompt += `- বর্তমান ওয়ালেট ব্যালেন্স: ৳${context.user.walletBalance ?? 0}\n`;
      }
    }
    if (context.activeTournaments && context.activeTournaments.length > 0) {
      contextAugmentedSystemPrompt += `- বর্তমান সক্রিয় টুর্নামেন্টসমূহ (${context.activeTournaments.length}টি):\n`;
      context.activeTournaments.slice(0, 5).forEach((t, i) => {
        contextAugmentedSystemPrompt += `  ${i + 1}. ${t.titleBn} (${t.gameNameBn}) - এন্ট্রি ফি: ৳${t.entryFee}, সময়: ${t.startTime}\n`;
      });
    }
    if (context.activePaymentMethods !== undefined) {
      if (context.activePaymentMethods.length > 0) {
        contextAugmentedSystemPrompt += `- প্ল্যাটফর্মে বর্তমানে সক্রিয় পেমেন্ট মেথডসমূহ (${context.activePaymentMethods.length}টি):\n`;
        context.activePaymentMethods.forEach((p, i) => {
          contextAugmentedSystemPrompt += `  ${i + 1}. ${p.nameBn} (${p.provider}) - নম্বর: ${p.accountNumber || 'ওয়ালেটে দেখুন'}, সর্বনিম্ন ডিপোজিট: ৳${p.minDeposit}, সর্বনিম্ন উইথড্র: ৳${p.minWithdraw}\n`;
        });
      } else {
        contextAugmentedSystemPrompt += `- বর্তমানে কোনো পেমেন্ট মেথড সক্রিয় নেই (অ্যাডমিন পর্যালোচনায় রয়েছে)।\n`;
      }
    }
    contextAugmentedSystemPrompt += `\n**রিয়েল-টাইম প্ল্যাটফর্ম ডেটা ব্যবহারের কঠোর নিয়ম:**\n1. পেমেন্ট বা ডিপোজিট/উইথড্র মেথড নিয়ে প্রশ্ন করলে শুধুমাত্র উপরের সক্রিয় পেমেন্ট মেথড তালিকার ভিত্তিতে উত্তর দেবে (যেমন: যদি শুধু বিকাশ চালু থাকে তবে বলবে "বর্তমানে শুধুমাত্র বিকাশ চালু আছে", নগদ/রকেট চালু না থাকলে বলবে "বর্তমানে অন্য কোনো মেথড যুক্ত নেই")।\n2. টুর্নামেন্ট নিয়ে প্রশ্ন করলে উপরের চলমান টুর্নামেন্ট তালিকা থেকে উত্তর দেবে।\n3. উত্তর সবসময় খুব সংক্ষিপ্ত (Short, ২-৪ লাইনে টু-দ্য-পয়েন্ট) হবে।\n4. কোনো কোম্পানির নাম উল্লেখ করবে না, তোমার নাম শুধুই "দিগন্ত এআই"।\n`;
  }

  const payloadMessages = [
    { role: 'system', content: contextAugmentedSystemPrompt },
    ...messages.slice(-10), // keep last 10 messages for token context window
  ];

  // 1. Direct Groq Cloud API Call (Only if user supplied key in browser session, no hardcoded keys)
  const clientStoredKey =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem('diganta_groq_api_key') ||
        window.localStorage.getItem('diganta_groq_api_key') ||
        ''
      : '';

  const targetModel = options.model || AI_CONFIG.defaultGroqModel || 'openai/gpt-oss-120b';

  if (clientStoredKey && clientStoredKey.trim().length > 10) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientStoredKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: payloadMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            content,
            source: 'client_proxy',
            modelUsed: 'diganta-ai-engine',
          };
        }
      } else {
        console.warn(`Groq request for model ${targetModel} returned status ${response.status}. Trying fallback model.`);
        // Try fallback model
        const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientStoredKey}`,
          },
          body: JSON.stringify({
            model: AI_CONFIG.fallbackGroqModel || 'openai/gpt-oss-20b',
            messages: payloadMessages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const fallbackContent = fallbackData.choices?.[0]?.message?.content;
          if (fallbackContent) {
            return {
              content: fallbackContent,
              source: 'client_proxy',
              modelUsed: 'diganta-ai-engine',
            };
          }
        }
      }
    } catch (err) {
      console.warn('Direct Groq API fetch error:', err);
    }
  }

  // 2. Try calling Supabase Edge Function if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('diganta-ai', {
        body: {
          messages: payloadMessages,
          model: targetModel,
        },
      });

      if (!error && data && data.content) {
        return {
          content: data.content,
          source: 'edge_function',
          modelUsed: 'diganta-ai-engine',
        };
      }
    } catch (err) {
      console.warn('Supabase Edge Function not reachable:', err);
    }
  }

  // Offline / Graceful Local Knowledge Fallback Engine
  // Gives immediate, contextual, and intelligent answers in Bangla if neither Edge Function nor Groq API key is linked yet
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const fallbackAnswer = generateLocalKnowledgeResponse(lastUserMsg, context);

  return {
    content: fallbackAnswer,
    source: 'fallback_offline',
    modelUsed: 'diganta-ai-engine',
  };
}

/**
 * Intelligent local fallback responder for Diganta Arena
 * Ensures the user is NEVER met with a blank screen or broken experience.
 */
function generateLocalKnowledgeResponse(query: string, context?: DigantaContextData): string {
  const q = query.toLowerCase();

  if (q.includes('রুল') || q.includes('নিয়ম') || q.includes('নিয়ম') || q.includes('কীভাবে খেলব') || q.includes('রেজিস্ট্রেশন')) {
    return `**দিগন্ত অ্যারেনায় টুর্নামেন্ট খেলার সাধারণ নিয়মাবলী:**

১. **রেজিস্ট্রেশন:** টুর্নামেন্ট তালিকায় গিয়ে আপনার পছন্দের ম্যাচটি বেছে নিন এবং "জয়েন করুন" বাটনে ক্লিক করুন।
২. **এন্ট্রি ফি:** প্রয়োজনীয় এন্ট্রি ফি আপনার ওয়ালেটে থাকতে হবে।
৩. **ইন-গেম নাম:** টুর্নামেন্টে যোগদানের সময় আপনার সঠিক ইন-গেম নাম এবং ইউজার আইডি (UID) সাবমিট করুন।
৪. **রুম আইডি ও পাসওয়ার্ড:** ম্যাচ শুরুর ঠিক **১৫ মিনিট পূর্বে** টুর্নামেন্ট ডিটেইলসে রুম আইডি ও পাসওয়ার্ড দৃশ্যমান হবে।
৫. **ফেয়ার প্লে:** যেকোনো প্রকার হ্যাক বা চিট টুলস ব্যবহার নিষিদ্ধ। এটি প্রমাণিত হলে একাউন্ট আজীবন ব্যান হবে।`;
  }

  if (q.includes('ডিপোজিট') || q.includes('পেমেন্ট') || q.includes('বিকাশ') || q.includes('নগদ') || q.includes('রকেট') || q.includes('টাকা পাঠাব')) {
    const balance = context?.user?.walletBalance ?? 0;
    const methods = context?.activePaymentMethods || [];
    let methodDetail = '';
    if (methods.length > 0) {
      methodDetail = methods.map(m => `• **${m.nameBn}**: ${m.accountNumber} (সর্বনিম্ন ডিপোজিট: ৳${m.minDeposit})`).join('\n');
    } else {
      methodDetail = '• বর্তমানে প্ল্যাটফর্মে অ্যাডমিন কনফিগার করা মেথডসমূহ সক্রিয় রয়েছে।';
    }

    return `**ওয়ালেট ও ডিপোজিট তথ্য:**
আপনার ওয়ালেট ব্যালেন্স: **৳${balance}**

বর্তমানে সক্রিয় পেমেন্ট মেথড:
${methodDetail}

👉 ওয়ালেট পেজে গিয়ে সেন্ড মানি সম্পন্ন করে প্রেরক নম্বর ও TrxID সাবমিট করুন।`;
  }

  if (q.includes('উইথড্র') || q.includes('ক্যাশআউট') || q.includes('টাকা তুলব')) {
    const balance = context?.user?.walletBalance ?? 0;
    const methods = context?.activePaymentMethods || [];
    const methodNames = methods.length > 0 ? methods.map(m => m.nameBn).join(', ') : 'ওয়ালেট পেজে প্রদর্শিত মেথড';
    return `**উইথড্রয়াল (ক্যাশআউট) নিয়ম:**
আপনার ওয়ালেট ব্যালেন্স: **৳${balance}**
উপলব্ধ চ্যানেল: **${methodNames}**

👉 ওয়ালেট পেজে গিয়ে আপনার নম্বর ও পরিমাণ লিখে রিকোয়েস্ট সাবমিট করুন। অ্যাডমিন অনুমোদনের পর সরাসরি টাকা পৌঁছে যাবে।`;
  }

  if (q.includes('ফ্রি ফায়ার') || q.includes('free fire') || q.includes('headshot') || q.includes('হেডশট')) {
    return `**ফ্রি ফায়ারে সেরা খেলার ও হেডশটের প্রো টিপস:**

🎯 **হেডশট টেকনিক (Drag Headshot):**
- **General Sensitivity:** ৯৫-১০০ এর মধ্যে রাখুন।
- ফায়ার করার সময় জয়স্টিক ছেড়ে দিয়ে ফায়ার বাটন সোজা ওপরের দিকে আলতো ড্র্যাগ (Drag) করুন।
- ক্লোজ রেঞ্জে 'J-Drag' বা রোটেশন ড্র্যাগ সবচেয়ে কার্যকর।

🔫 **সেরা গান কম্বিনেশন:**
- শর্ট রেঞ্জ: MP40 / M1887 / Charge Buster
- মিড-লং রেঞ্জ: Woodpecker / Groza / Parafal / Scar

🛡️ **কভার ম্যানেজমেন্ট:** কখনোই খোলা ময়দানে দাঁড়িয়ে ফায়ার করবেন না। গ্লু-ওয়াল (Gloo Wall) ড্রপ স্পিড অনুশীলন করুন!`;
  }

  if (q.includes('পাবজি') || q.includes('pubg') || q.includes('চিকেন') || q.includes('রিলিজ')) {
    return `**পাবজি মোবাইল টুর্নামেন্ট স্ট্র্যাটেজি:**

🍗 **চিকেন ডিনারের মূল মন্ত্র:**
১. **রোটেশন ও সেফ জোন:** সার্কেল ছোট হওয়ার সাথে সাথে সার্কেলের দুর্বল দিক (Edge of Zone) ধরে ঢুকুন।
২. **ইউটিলিটি ব্যবহার:** স্মোক গ্রেনেড (Smoke) অন্তত ৪-৫টি সাথে রাখুন। এটি ওপেন ফিল্ডে কভার তৈরিতে জীবন বাঁচায়।
৩. **রিকয়েল কন্ট্রোল:** M416 + 6x (adjusted to 3x) স্প্রে নিয়ন্ত্রণের জন্য জাইরোস্কোপ (Gyroscope) অলওয়েজ অন রাখুন।
৪. **টিমওয়ার্ক:** ডুয়ো বা স্কোয়াডে একসাথে রাশ দিন, নক হওয়া টিমমেটকে আগে রিভাইভ দিন।`;
  }

  if (q.includes('ম্যাচ') || q.includes('আজকে') || q.includes('টুর্নামেন্ট')) {
    const list = context?.activeTournaments || [];
    if (list.length > 0) {
      return `**বর্তমানে দিগন্ত অ্যারেনায় চলমান টুর্নামেন্টসমূহ:**\n\n` +
        list.map((t, idx) => `${idx + 1}. **${t.titleBn}** (${t.gameNameBn}) — ফি: ৳${t.entryFee} | প্রাইজ: ৳${t.prizePool} (${t.startTime})`).join('\n') +
        `\n\n👉 অংশগ্রহণ করতে উপরে টুর্নামেন্ট মেনুতে ক্লিক করুন!`;
    }
    return `বর্তমানে দিগন্ত অ্যারেনায় ফ্রি ফায়ার, পাবজি মোবাইল ও ব্লাড স্ট্রাইক টুর্নামেন্টগুলো নিয়মিত অনুষ্ঠিত হচ্ছে। বিস্তারিত দেখতে অনুগ্রহ করে **"টুর্নামেন্ট"** ট্যাবে যান।`;
  }

  // Default welcome response
  return `হ্যালো গেমার! আমি **দিগন্ত এআই** (Diganta AI) — দিগন্ত অ্যারেনার অফিসিয়াল গেমিং অ্যাসিস্ট্যান্ট।

🎮 আমি আপনাকে নিচের বিষয়গুলোতে সাহায্য করতে পারি:
- টুর্নামেন্টে যোগদানের নিয়ম ও রুম আইডি পাওয়া
- ওয়ালেট ডিপোজিট ও উইথড্র প্রক্রিয়া
- ফ্রি ফায়ার ও পাবজি মোবাইলের প্রো গেমিং স্ট্র্যাটেজি ও সেনসিটিভিটি টিপস
- অ্যান্টি-চিট ও প্ল্যাটফর্ম পলিসি

আপনার যেকোনো প্রশ্ন আমাকে জিজ্ঞাসা করতে পারেন!`;
}
