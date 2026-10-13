export type GameId = 'free_fire' | 'pubg_mobile' | 'blood_strike' | 'efootball';

export type GameMode = 'solo' | 'duo' | 'squad';

export type TournamentStatus =
  | 'draft'
  | 'upcoming'
  | 'registration_open'
  | 'registration_closed'
  | 'live'
  | 'completed'
  | 'cancelled';

export interface GameCategory {
  id: GameId;
  nameBn: string;
  nameEn: string;
  tagline: string;
  activeTournaments: number;
  totalPrizeWon: number;
  bannerGradient: string;
  accentColor: string;
  iconName: string;
}

export interface Tournament {
  id: string;
  titleBn: string;
  gameId: GameId;
  gameNameBn: string;
  mode: GameMode;
  modeBn: string;
  mapBn: string;
  entryFee: number; // in BDT (0 for free)
  prizePool: number; // in BDT
  perKillPrize?: number; // in BDT per kill
  maxSlots: number;
  joinedSlots: number;
  startTime: string; // e.g. "আজ রাত ৮:৩০ টা"
  dateFormatted: string; // e.g. "১২ অক্টোবর, ২০২৬"
  status: TournamentStatus;
  statusBn: string;
  matchRules: string[];
  prizeDistribution: {
    first: number;
    second: number;
    third?: number;
    fourth?: number;
    fifth?: number;
    sixth?: number;
    seventh?: number;
    eighth?: number;
    ninth?: number;
    tenth?: number;
    perKill?: number;
  };
  roomIdAvailableAt?: string;
  featured?: boolean;
  descriptionBn?: string;
  roomStatus?: 'hidden' | 'released' | 'closed';
  roomId?: string;
  roomPassword?: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  resultSubmissionDeadline?: string;
  bannerUrl?: string;
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  inGameName: string;
  gameId: GameId;
  gameNameBn: string;
  matchesPlayed: number;
  booyahsCount: number;
  totalWinnings: number;
  avatarUrl?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'entry_fee' | 'prize_payout' | 'refund';
  typeBn: string;
  amount: number;
  method?: string;
  accountNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  statusBn: string;
  timestamp: string;
  refId: string;
}

export interface PaymentMethodConfig {
  id: string;
  nameBn: string;
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Upay';
  accountNumber: string;
  instructionsBn: string;
  minDeposit: number;
  minWithdraw: number;
  enabled: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  paymentMethodId?: string;
  paymentMethodName: string;
  paymentProvider: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | string;
  amount: number;
  senderNumber: string;
  trxId: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  statusBn: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  walletTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  userDisplayName?: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'user';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  paymentMethod: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  statusBn: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  userDisplayName?: string;
  userPhone?: string;
}

export interface WithdrawalProfile {
  method: string;
  accountNumber: string;
  accountName: string;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  walletBalance: number;
  totalWon: number;
  tournamentsJoined: number;
  roles: AdminRole[];
  withdrawalProfile?: WithdrawalProfile;
  gameIds: {
    freeFireId?: string;
    pubgId?: string;
    bloodStrikeId?: string;
    efootballId?: string;
  };
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
}

export interface ManagedUserListItem {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  createdAt: string;
  roles: AdminRole[];
  walletBalance: number;
  totalWon: number;
  tournamentsJoinedCount: number;
  depositRequestsCount: number;
  withdrawalProfile?: WithdrawalProfile;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
}

export interface UserRegistrationAnalytics {
  totalUsers: number;
  todayUsers: number;
  yesterdayUsers: number;
  last7DaysUsers: number;
  thisMonthUsers: number;
  prevMonthUsers: number;
  totalTournamentRegistrations: number;
  dailyTrend: Array<{ date: string; dateFormattedBn: string; count: number }>;
  latestUsers: Array<{
    id: string;
    displayName: string;
    email?: string;
    phone?: string;
    createdAt: string;
    roles: AdminRole[];
  }>;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorDisplayName?: string;
  targetUserId: string;
  targetDisplayName?: string;
  action: string;
  previousRole?: string;
  newRole?: string;
  createdAt: string;
}

export interface MatchResultSubmission {
  id: string;
  tournamentId: string;
  tournamentTitleBn?: string;
  userId: string;
  userDisplayName?: string;
  inGameId: string;
  screenshotUrl: string;
  explanation?: string;
  status: 'pending' | 'approved' | 'rejected' | 'evidence_requested';
  statusBn: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type ComplaintCategory = 'tournament' | 'wallet' | 'cheating_report' | 'room_issue' | 'other';

export interface UserComplaint {
  id: string;
  userId: string;
  userDisplayName?: string;
  userContact?: string;
  title: string;
  description: string;
  screenshotUrl: string;
  category: ComplaintCategory;
  categoryBn: string;
  reportedUserId?: string;
  tournamentId?: string;
  tournamentTitleBn?: string;
  status: ComplaintStatus;
  statusBn: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

