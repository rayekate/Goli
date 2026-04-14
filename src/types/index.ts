import type { Document, Types } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  role: 'user' | 'admin';
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  withdrawalOtpEnabled: boolean;
  notifications: {
    platformBroadcasts: boolean;
    financialConfirmations: boolean;
    marketAlerts: boolean;
    securityAlerts: boolean;
  };
  payoutWallet: {
    address: string;
    network: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  username: string;
  email: string;
  balance: number;
  role: 'user' | 'admin';
}

// ─── Trade ───────────────────────────────────────────────────────────────────
export type TradeDirection = 'up' | 'down';
export type TradeResult = 'win' | 'loss' | 'pending';

export interface ITrade extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  direction: TradeDirection;
  result: TradeResult;
  profitOrLoss: number;
  entryPrice: number;
  exitPrice?: number;
  duration: number;
  expiresAt?: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  walletAddress?: string;
  transactionId?: string;
  transactionHash?: string;
  cryptoType?: string;
  proofImage?: string;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response shapes ─────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}

export interface TradeResponse {
  message: string;
  trade: ITrade;
  currentBalance: number;
}

export interface TransactionResponse {
  message: string;
  transaction: ITransaction;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

// ─── Admin enriched user ─────────────────────────────────────────────────────
export interface UserStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfitLoss: number;
  totalVolume: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
}

export interface EnrichedUser extends Omit<IUser, 'password'> {
  stats: UserStats;
}
