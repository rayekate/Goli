import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { getSettings } from '@/models/PlatformSettings';

const COLLECTION = 'platformsettings';

/**
 * GET: Public platform settings (non-sensitive fields only).
 * Uses raw MongoDB driver to avoid Mongoose schema caching issues.
 */
export async function GET() {
  try {
    await connectToDatabase();

    let doc: any = await mongoose.connection.db!.collection(COLLECTION).findOne({});
    if (!doc) {
      const s = await getSettings();
      doc = s.toObject();
    }

    return NextResponse.json({
      settings: {
        platformName: doc.platformName ?? '',
        telegramUsername: doc.telegramUsername ?? '',
        maintenanceMode: doc.maintenanceMode ?? false,
        mandatory2FA: doc.mandatory2FA ?? false,
        allowUser2FA: doc.allowUser2FA ?? true,
        ticketSystem: doc.ticketSystem ?? true,
        withdrawalVerification: doc.withdrawalVerification ?? true,
        requireTransactionHash: doc.requireTransactionHash ?? true,
        minWithdrawal: doc.minWithdrawal ?? 10,
        maxWithdrawal: doc.maxWithdrawal ?? 50000,
        maxDeposit: doc.maxDeposit ?? 100000,
        wallets: doc.wallets ?? [],
        walletBTC: doc.walletBTC ?? '',
        walletETH: doc.walletETH ?? '',
        walletUSDT: doc.walletUSDT ?? '',
        minTrade: doc.minTrade ?? 1,
        maxTrade: doc.maxTrade ?? 10000,
        profitPercent: doc.profitPercent ?? 80,
        tradeDuration: doc.tradeDuration ?? 60,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
