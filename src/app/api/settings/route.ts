import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getSettings } from '@/models/PlatformSettings';

/**
 * GET: Public platform settings (non-sensitive fields only).
 * Used by the client to check maintenance mode, feature flags, etc.
 */
export async function GET() {
  try {
    await connectToDatabase();
    const s = await getSettings();

    return NextResponse.json({
      settings: {
        platformName: s.platformName,
        maintenanceMode: s.maintenanceMode,
        mandatory2FA: s.mandatory2FA,
        allowUser2FA: s.allowUser2FA,
        ticketSystem: s.ticketSystem,
        withdrawalVerification: s.withdrawalVerification,
        requireTransactionHash: s.requireTransactionHash,
        minWithdrawal: s.minWithdrawal,
        maxWithdrawal: s.maxWithdrawal,
        maxDeposit: s.maxDeposit,
        wallets: s.wallets || [],
        walletBTC: s.walletBTC,
        walletETH: s.walletETH,
        walletUSDT: s.walletUSDT,
        minTrade: s.minTrade,
        maxTrade: s.maxTrade,
        profitPercent: s.profitPercent,
        tradeDuration: s.tradeDuration,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
