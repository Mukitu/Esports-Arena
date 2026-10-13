import { GameCategory, Tournament, LeaderboardPlayer } from '../types';

export const GAMES_DATA: GameCategory[] = [
  {
    id: 'free_fire',
    nameBn: 'ফ্রি ফায়ার',
    nameEn: 'Free Fire',
    tagline: 'বাংলাদেশের এক নম্বর ব্যাটেল রয়্যাল টুর্নামেন্ট',
    activeTournaments: 12,
    totalPrizeWon: 400000,
    bannerGradient: 'from-amber-600/30 via-orange-900/20 to-slate-900',
    accentColor: '#f59e0b',
    iconName: 'Flame',
  },
  {
    id: 'pubg_mobile',
    nameBn: 'পাবজি মোবাইল',
    nameEn: 'PUBG Mobile',
    tagline: 'স্কোয়াড ব্যাটেল ও প্রফেশনাল অ্যারেনা',
    activeTournaments: 8,
    totalPrizeWon: 350000,
    bannerGradient: 'from-emerald-600/30 via-teal-900/20 to-slate-900',
    accentColor: '#10b981',
    iconName: 'Crosshair',
  },
  {
    id: 'blood_strike',
    nameBn: 'ব্লাড স্ট্রাইক',
    nameEn: 'Blood Strike',
    tagline: 'দ্রুতগতির ট্যাকটিক্যাল এফপিএস যুদ্ধ',
    activeTournaments: 5,
    totalPrizeWon: 150000,
    bannerGradient: 'from-cyan-600/30 via-blue-900/20 to-slate-900',
    accentColor: '#06b6d4',
    iconName: 'Zap',
  },
  {
    id: 'efootball',
    nameBn: 'ই-ফুটবল',
    nameEn: 'eFootball',
    tagline: 'ওয়ান-অন-ওয়ান আলটিমেট সকার লিগ',
    activeTournaments: 6,
    totalPrizeWon: 100000,
    bannerGradient: 'from-indigo-600/30 via-purple-900/20 to-slate-900',
    accentColor: '#6366f1',
    iconName: 'Trophy',
  },
];

export const TOURNAMENTS_DATA: Tournament[] = [
  {
    id: 'trn-ff-01',
    titleBn: 'ফ্রি ফায়ার গ্র্যান্ড বারমুডা চ্যাম্পিয়নশিপ',
    gameId: 'free_fire',
    gameNameBn: 'ফ্রি ফায়ার',
    mode: 'squad',
    modeBn: 'স্কোয়াড (Squad)',
    mapBn: 'বারমুডা (Bermuda)',
    entryFee: 50,
    prizePool: 5000,
    perKillPrize: 20,
    maxSlots: 48,
    joinedSlots: 36,
    startTime: 'আজ রাত ৮:৩০ টা',
    dateFormatted: '১২ অক্টোবর, ২০২৬',
    status: 'upcoming',
    statusBn: 'আসন্ন',
    featured: true,
    matchRules: [
      'ম্যাচ শুরুর ১৫ মিনিট আগে রুম আইডি ও পাসওয়ার্ড দেওয়া হবে।',
      'হ্যাকিং, থার্ড পার্টি অ্যাপ বা ইমুলেটর সম্পূর্ণ নিষিদ্ধ।',
      'ম্যাচ শেষে স্ক্রিনশট ও কিল কাউন্ট সাবমিট করতে হবে।',
      'প্রতি কিলে অতিরিক্ত ৳২০ পুরষ্কার প্রদান করা হবে।'
    ],
    prizeDistribution: {
      first: 2500,
      second: 1500,
      third: 1000,
      perKill: 20
    },
    roomIdAvailableAt: 'রাত ৮:১৫ টা'
  },
  {
    id: 'trn-pubg-01',
    titleBn: 'পাবজি ইম্পেরিয়াল ইরাঙ্গেল প্রফেশনাল কাপ',
    gameId: 'pubg_mobile',
    gameNameBn: 'পাবজি মোবাইল',
    mode: 'squad',
    modeBn: 'স্কোয়াড (Squad)',
    mapBn: 'ইরাঙ্গেল (Erangel)',
    entryFee: 100,
    prizePool: 10000,
    perKillPrize: 50,
    maxSlots: 25,
    joinedSlots: 25,
    startTime: 'আজ রাত ৯:০০ টা',
    dateFormatted: '১২ অক্টোবর, ২০২৬',
    status: 'live',
    statusBn: 'লাইভ (চলমান)',
    featured: true,
    matchRules: [
      'আইপ্যাড মিনি/ট্যাবলেট ব্যবহারকারীদের জন্য আলাদা চেক।',
      'টিমিং বা ফেয়ার প্লে লঙ্ঘন করলে টিম সাথে সাথে বাতিল।',
      'অফিসিয়াল স্ট্রিম লাইভে সরাসরি সম্প্রচার করা হচ্ছে।'
    ],
    prizeDistribution: {
      first: 5000,
      second: 3000,
      third: 2000,
      perKill: 50
    },
    roomIdAvailableAt: 'রাত ৮:৪৫ টা'
  },
  {
    id: 'trn-bs-01',
    titleBn: 'ব্লাড স্ট্রাইক শুটার্স অ্যারেনা ব্যাটল',
    gameId: 'blood_strike',
    gameNameBn: 'ব্লাড স্ট্রাইক',
    mode: 'duo',
    modeBn: 'ডুও (Duo)',
    mapBn: 'শাটল ভ্যালি',
    entryFee: 30,
    prizePool: 2500,
    perKillPrize: 15,
    maxSlots: 30,
    joinedSlots: 12,
    startTime: 'আগামীকাল সন্ধ্যা ৭:০০ টা',
    dateFormatted: '১৩ অক্টোবর, ২০২৬',
    status: 'upcoming',
    statusBn: 'আসন্ন',
    featured: false,
    matchRules: [
      'শুধুমাত্র মোবাইল ডিভাইস সমর্থিত।',
      'রুমে প্রবেশের সময় ইন-গেম নাম মিল থাকতে হবে।'
    ],
    prizeDistribution: {
      first: 1200,
      second: 800,
      third: 500,
      perKill: 15
    },
    roomIdAvailableAt: 'সন্ধ্যা ৬:৪৫ টা'
  },
  {
    id: 'trn-ef-01',
    titleBn: 'ই-ফুটবল চ্যাম্পিয়নস চ্যালেঞ্জার কাপ',
    gameId: 'efootball',
    gameNameBn: 'ই-ফুটবল',
    mode: 'solo',
    modeBn: 'সোলো ১v১ (Solo 1v1)',
    mapBn: 'স্ট্যান্ডার্ড স্টেডিয়াম',
    entryFee: 40,
    prizePool: 3000,
    maxSlots: 16,
    joinedSlots: 16,
    startTime: 'আগামীকাল রাত ৮:০০ টা',
    dateFormatted: '১৩ অক্টোবর, ২০২৬',
    status: 'upcoming',
    statusBn: 'আসন্ন (পূর্ণ)',
    featured: false,
    matchRules: [
      'ম্যাচের সময়সীমা ১০ মিনিট।',
      'নেটওয়ার্ক কনেকশন বিচ্ছিন্ন হলে প্রতিপক্ষ বিজয়ী ঘোষিত হতে পারে।',
      'ম্যাচ শেষে রেজাল্ট স্ক্রিনশট আপলোড করতে হবে।'
    ],
    prizeDistribution: {
      first: 1500,
      second: 1020,
      third: 480
    },
    roomIdAvailableAt: 'রাত ৭:৫০ টা'
  },
  {
    id: 'trn-ff-02',
    titleBn: 'ফ্রি ফায়ার সোলো স্কিল হান্ট (ফ্রি এন্ট্রি)',
    gameId: 'free_fire',
    gameNameBn: 'ফ্রি ফায়ার',
    mode: 'solo',
    modeBn: 'সোলো (Solo)',
    mapBn: 'কলাহারি (Kalahari)',
    entryFee: 0,
    prizePool: 1000,
    perKillPrize: 10,
    maxSlots: 48,
    joinedSlots: 42,
    startTime: 'আজ রাত ১০:০০ টা',
    dateFormatted: '১২ অক্টোবর, ২০২৬',
    status: 'upcoming',
    statusBn: 'আসন্ন',
    featured: true,
    matchRules: [
      'সম্পূর্ণ ফ্রি এন্ট্রি টুর্নামেন্ট।',
      'সকল নতুন গেমারদের জন্য উন্মুক্ত।'
    ],
    prizeDistribution: {
      first: 500,
      second: 300,
      third: 200,
      perKill: 10
    },
    roomIdAvailableAt: 'রাত ৯:৪৫ টা'
  }
];

export const LEADERBOARD_DATA: LeaderboardPlayer[] = [
  {
    rank: 1,
    username: 'SabbirX_Fire',
    inGameName: '⚡SabbirBooyah⚡',
    gameId: 'free_fire',
    gameNameBn: 'ফ্রি ফায়ার',
    matchesPlayed: 85,
    booyahsCount: 42,
    totalWinnings: 38500
  },
  {
    rank: 2,
    username: 'PUBG_King_BD',
    inGameName: '★CYBER_ROYAL★',
    gameId: 'pubg_mobile',
    gameNameBn: 'পাবজি মোবাইল',
    matchesPlayed: 92,
    booyahsCount: 38,
    totalWinnings: 32000
  },
  {
    rank: 3,
    username: 'Tanvir_Striker',
    inGameName: 'Blood_Tanvir_99',
    gameId: 'blood_strike',
    gameNameBn: 'ব্লাড স্ট্রাইক',
    matchesPlayed: 64,
    booyahsCount: 30,
    totalWinnings: 21400
  },
  {
    rank: 4,
    username: 'Messi_BD_eFoot',
    inGameName: 'DHAKA_FC_PRO',
    gameId: 'efootball',
    gameNameBn: 'ই-ফুটবল',
    matchesPlayed: 50,
    booyahsCount: 25,
    totalWinnings: 18000
  },
  {
    rank: 5,
    username: 'Rafi_Gamer_07',
    inGameName: 'Viper_Rafi',
    gameId: 'free_fire',
    gameNameBn: 'ফ্রি ফায়ার',
    matchesPlayed: 75,
    booyahsCount: 27,
    totalWinnings: 15500
  }
];

export const FAQ_DATA = [
  {
    qBn: 'টুর্নামেন্টের রুম আইডি ও পাসওয়ার্ড কোথায় পাব?',
    aBn: 'টুর্নামেন্ট শুরু হওয়ার ১০ থেকে ১৫ মিনিট আগে আপনার নিবন্ধিত অ্যাকাউন্টের "আমার টুর্নামেন্ট" পেইজে এবং ড্যাশবোর্ডে অফিসিয়াল রুম আইডি ও পাসওয়ার্ড দেখতে পাবেন।'
  },
  {
    qBn: 'কিভাবে ওয়ালেটে টাকা জমা বা উত্তোলন করা যাবে?',
    aBn: 'অ্যাাকাউন্টে লগইন করার পর অ্যাডমিন কর্তৃক চালু করা অফিশিয়াল পেমেন্ট মেথড নির্বাচন করে নিরাপদ ডিপোজিট বা উইথড্র রিকোয়েস্ট জমা দেওয়া যাবে।'
  },
  {
    qBn: 'টুর্নামেন্টে জয়ের পর পুরষ্কারের টাকা কিভাবে পাব?',
    aBn: 'ম্যাচ শেষ হওয়ার পর ফলাফল যাচাই করে বিজয়ী ইউজারের ওয়ালেটে সরাসরি প্রাইজমানি যুক্ত করা হয় এবং অনুমোদিত উইথড্র চ্যানেলে ক্যাশআউট সুবিধা প্রদান করা হয়।'
  },
  {
    qBn: 'ফেয়ার প্লে এবং অ্যান্টি-চিট নীতি কী?',
    aBn: 'দিকান্ত অ্যারেনায় যেকোনো অনৈতিক গেমপ্লে, হ্যাকিং বা টিমিং কঠোরভাবে নিষিদ্ধ। লঙ্ঘনে অ্যাকাউন্ট চিরতরে স্থগিত করা হয়।'
  }
];
