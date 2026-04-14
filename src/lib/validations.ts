import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter username or email').max(100).trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// ─── Trade ───────────────────────────────────────────────────────────────────
export const ALLOWED_DURATIONS = [30, 60, 80, 120, 180, 320] as const;

export const tradeSchema = z.object({
  amount: z
    .number({ error: 'Amount must be a number' })
    .min(10, 'Minimum trade amount is $10')
    .max(1000000, 'Maximum trade amount is $1,000,000'),
  direction: z.enum(['up', 'down'], {
    error: 'Direction must be "up" or "down"',
  }),
  duration: z
    .number({ error: 'Duration is required' })
    .refine((val) => ([30, 60, 80, 120, 180, 320] as readonly number[]).includes(val), {
      message: 'Invalid trade duration. Allowed: 30, 60, 80, 120, 180, 320 seconds',
    }),
});

// ─── Transaction (user-facing) ───────────────────────────────────────────────
export const depositSchema = z.object({
  type: z.literal('deposit'),
  amount: z.number().positive('Amount must be positive').max(100000, 'Maximum deposit is $100,000'),
  transactionHash: z.string().min(1, 'Transaction hash is required').max(256).trim(),
  cryptoType: z.string().min(1, 'Crypto type is required').max(50),
  proofImage: z
    .string()
    .max(500_000, 'Image too large — max ~350KB base64')
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, 'Invalid image format')
    .optional(),
});

export const withdrawalSchema = z.object({
  type: z.literal('withdrawal'),
  amount: z.number()
    .min(10, 'Minimum withdrawal is $10')
    .max(50000, 'Maximum withdrawal is $50,000')
    .refine(v => Number(v.toFixed(2)) === v, 'Amount must have at most 2 decimal places'),
  walletAddress: z.string().min(10, 'Invalid wallet address').max(256).trim(),
  cryptoType: z.enum(['USDT_TRC20', 'USDT_ERC20', 'BTC', 'ETH'], { error: 'Invalid crypto type' }),
  otpCode: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits').optional(),
});

export const transactionSchema = z.discriminatedUnion('type', [
  depositSchema,
  withdrawalSchema,
]);

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1, 'User ID required').regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
  balance: z.number().min(0).optional(),
  role: z.enum(['user', 'admin']).optional(),
  isBlocked: z.boolean().optional(),
});

export const adminTransactionActionSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID required').regex(/^[a-f\d]{24}$/i, 'Invalid transaction ID'),
  status: z.enum(['approved', 'rejected'], {
    error: 'Status must be "approved" or "rejected"',
  }),
});

export const adminManualTxSchema = z.object({
  userId: z.string().min(1, 'User ID required').regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  note: z.string().max(500).trim().optional(),
});

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  message: z.string().min(5, 'Message must be at least 5 characters').max(5000).trim(),
});

export const ticketReplySchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000).trim(),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['open', 'pending', 'closed']),
});

// ─── User Settings ───────────────────────────────────────────────────────────
export const updateSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).trim().optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim()
    .optional(),
  twoFactorEnabled: z.boolean().optional(),
  withdrawalOtpEnabled: z.boolean().optional(),
  verificationCode: z.string().length(6).regex(/^\d{6}$/).optional(),
  notifications: z.object({
    platformBroadcasts: z.boolean().optional(),
    financialConfirmations: z.boolean().optional(),
    marketAlerts: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
  }).optional(),
  payoutWallet: z.object({
    address: z.string().max(256).trim(),
    network: z.string().max(50).trim(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// ─── Admin Platform Settings ─────────────────────────────────────────────
export const adminPlatformSettingsSchema = z.object({
  platformName: z.string().min(1).max(100).trim().optional(),
  maintenanceMode: z.boolean().optional(),
  mandatory2FA: z.boolean().optional(),
  allowUser2FA: z.boolean().optional(),
  ticketSystem: z.boolean().optional(),
  withdrawalVerification: z.boolean().optional(),
  requireTransactionHash: z.boolean().optional(),
  minWithdrawal: z.number().min(0).optional(),
  maxWithdrawal: z.number().min(0).optional(),
  maxDeposit: z.number().min(0).optional(),
  minTrade: z.number().min(0).optional(),
  maxTrade: z.number().min(0).optional(),
  profitPercent: z.number().min(0).max(100).optional(),
  tradeDuration: z.number().min(10).max(600).optional(), // 10s to 10min
  walletBTC: z.string().max(256).trim().optional(),
  walletETH: z.string().max(256).trim().optional(),
  walletUSDT: z.string().max(256).trim().optional(),
  wallets: z.array(z.object({
    coinName: z.string().min(1, 'Coin name required').max(50).trim(),
    network: z.string().min(1, 'Network required').max(100).trim(),
    address: z.string().min(1, 'Address required').max(256).trim(),
    logo: z.string().max(256).trim().optional(),
  })).max(20).optional(),
});

export const adminScheduleSchema = z.object({
  tradingStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  tradingEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  tradingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).max(7).optional(),
});
