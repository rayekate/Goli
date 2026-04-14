import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUserNotifications {
  platformBroadcasts: boolean;
  financialConfirmations: boolean;
  marketAlerts: boolean;
  securityAlerts: boolean;
}

export interface IPayoutWallet {
  address: string;
  network: string;
}

export interface IUser extends Document {
  isVerified: boolean;
  registrationOtp: string;
  registrationOtpExpiry: Date;
  name: string;
  username: string;
  email: string;
  password?: string;
  balance: number;
  role: 'user' | 'admin';
  isBlocked: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  loginOtp: string;
  loginOtpExpiry: Date;
  withdrawalOtpEnabled: boolean;
  withdrawalOtp: string;
  withdrawalOtpExpiry: Date;
  resetPasswordOtp: string;
  resetPasswordOtpExpiry: Date;
  notifications: IUserNotifications;
  payoutWallet: IPayoutWallet;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    registrationOtp: { type: String, default: '' },
    registrationOtpExpiry: { type: Date },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: '' },
    loginOtp: { type: String, default: '' },
    loginOtpExpiry: { type: Date },
    withdrawalOtpEnabled: { type: Boolean, default: false },
    withdrawalOtp: { type: String, default: '' },
    withdrawalOtpExpiry: { type: Date },
    resetPasswordOtp: { type: String, default: '' },
    resetPasswordOtpExpiry: { type: Date },
    notifications: {
      platformBroadcasts: { type: Boolean, default: true },
      financialConfirmations: { type: Boolean, default: true },
      marketAlerts: { type: Boolean, default: false },
      securityAlerts: { type: Boolean, default: true },
    },
    payoutWallet: {
      address: { type: String, default: '' },
      network: { type: String, default: '' },
    },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// Performance indexes
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ username: 1 });

const User: Model<IUser> = mongoose.models?.User || mongoose.model('User', userSchema);
export default User;
