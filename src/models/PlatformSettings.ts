import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  // General
  platformName: string;
  siteTitle: string;
  siteDescription: string;
  maintenanceMode: boolean;

  // Security
  mandatory2FA: boolean;
  allowUser2FA: boolean;
  ticketSystem: boolean;
  withdrawalVerification: boolean;
  requireTransactionHash: boolean;

  // Finance
  minWithdrawal: number;
  maxWithdrawal: number;
  maxDeposit: number;
  minTrade: number;
  maxTrade: number;
  profitPercent: number;
  tradeDuration: number; // seconds

  // Trading Schedule
  tradingStartTime: string; // HH:mm
  tradingEndTime: string;   // HH:mm
  tradingDays: string[];    // ["Monday", "Tuesday", ...]

  // Wallet Addresses (admin-configurable, dynamic list)
  wallets: {
    coinName: string;
    network: string;
    address: string;
    logo?: string;
  }[];

  // Legacy (kept for migration compatibility)
  walletBTC: string;
  walletETH: string;
  walletUSDT: string;


}

const schemaDefinition: any = {
  // General
  platformName: { type: String, default: 'GoldTradex' },
  siteTitle: { type: String, default: 'GoldXchange' },
  siteDescription: { type: String, default: 'Institutional Gold Trading Terminal' },
  maintenanceMode: { type: Boolean, default: false },

  // Security
  mandatory2FA: { type: Boolean, default: false },
  allowUser2FA: { type: Boolean, default: true },
  ticketSystem: { type: Boolean, default: true },
  withdrawalVerification: { type: Boolean, default: false },
  requireTransactionHash: { type: Boolean, default: true },

  // Finance
  minWithdrawal: { type: Number, default: 10 },
  maxWithdrawal: { type: Number, default: 50000 },
  maxDeposit: { type: Number, default: 100000 },
  minTrade: { type: Number, default: 1 },
  maxTrade: { type: Number, default: 10000 },
  profitPercent: { type: Number, default: 80 },
  tradeDuration: { type: Number, default: 60 }, // seconds

  // Trading Schedule
  tradingStartTime: { type: String, default: '00:00' },
  tradingEndTime: { type: String, default: '23:59' },
  tradingDays: { 
    type: [String], 
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
  },

  // Wallet Addresses (dynamic)
  wallets: {
    type: [
      {
        coinName: { type: String, required: true },
        network: { type: String, required: true },
        address: { type: String, required: true },
        logo: { type: String, default: '💰' },
      },
    ],
    default: [],
  },

  // Legacy wallet fields (kept for migration)
  walletBTC: { type: String, default: '' },
  walletETH: { type: String, default: '' },
  walletUSDT: { type: String, default: '' },
};

const platformSettingsSchema = new Schema<IPlatformSettings>(schemaDefinition, { timestamps: true });

/**
 * Always returns the singleton settings document.
 * Creates it with defaults if it doesn't exist.
 * Auto-migrates legacy wallet fields to new wallets array.
 */
export async function getSettings(): Promise<IPlatformSettings> {
  const PlatformSettings = getPlatformSettingsModel();
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }

  // Auto-migrate legacy wallet fields
  let needsSave = false;
  if (!settings.wallets || settings.wallets.length === 0) {
    const legacyWallets: Array<{ coinName: string; network: string; address: string }> = [];
    if (settings.walletBTC) legacyWallets.push({ coinName: 'Bitcoin', network: 'BTC', address: settings.walletBTC });
    if (settings.walletETH) legacyWallets.push({ coinName: 'Ethereum', network: 'ERC20', address: settings.walletETH });
    if (settings.walletUSDT) legacyWallets.push({ coinName: 'USDT', network: 'TRC20', address: settings.walletUSDT });

    if (legacyWallets.length > 0) {
      settings.wallets = legacyWallets;
      needsSave = true;
    }
  }

  // Ensure trading schedule defaults exist
  if (!settings.tradingStartTime) {
    settings.tradingStartTime = '00:00';
    needsSave = true;
  }
  if (!settings.tradingEndTime) {
    settings.tradingEndTime = '23:59';
    needsSave = true;
  }
  if (!settings.tradingDays || settings.tradingDays.length === 0) {
    settings.tradingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    needsSave = true;
  }

  if (needsSave) {
    await settings.save();
  }

  return settings;
}

function getPlatformSettingsModel(): Model<IPlatformSettings> {
  return mongoose.models?.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
}

export default getPlatformSettingsModel();
