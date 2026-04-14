import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getSettings } from '@/models/PlatformSettings';
import { getAuthUser } from '@/lib/auth';
import { transactionSchema } from '@/lib/validations';
import { apiLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * GET: Fetch transaction history for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.min(10000, Math.max(1, parseInt(searchParams.get('page') || '1') || 1));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50));
    const skip = (page - 1) * limit;

    const filter = { userId: payload.userId };
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).select('-proofImage').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return NextResponse.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Create a new deposit or withdrawal request
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot perform user transactions' }, { status: 403 });
    }

    // Rate limit per IP
    const ip = getClientIP(req);
    const rl = apiLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    // Validate input with Zod discriminated union
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid transaction details';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parsed.data;

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Check maintenance mode
    const platformSettings = await getSettings();
    if (platformSettings.maintenanceMode) {
      return NextResponse.json({ error: 'Platform is under maintenance.' }, { status: 503 });
    }

    if (data.type === 'deposit') {
      // Enforce maximum deposit
      if (data.amount > platformSettings.maxDeposit) {
        return NextResponse.json(
          { error: `Maximum deposit amount is $${platformSettings.maxDeposit}` },
          { status: 400 }
        );
      }
      // Check for duplicate transaction hash
      if (data.transactionHash) {
        const existingTx = await Transaction.findOne({
          transactionHash: data.transactionHash,
          type: 'deposit',
        });
        if (existingTx) {
          return NextResponse.json({ error: 'This transaction hash has already been submitted' }, { status: 409 });
        }
      }
    }

    if (data.type === 'withdrawal') {
      // Enforce platform minimum and maximum withdrawal
      if (data.amount < platformSettings.minWithdrawal) {
        return NextResponse.json(
          { error: `Minimum withdrawal amount is $${platformSettings.minWithdrawal}` },
          { status: 400 }
        );
      }
      if (data.amount > platformSettings.maxWithdrawal) {
        return NextResponse.json(
          { error: `Maximum withdrawal amount is $${platformSettings.maxWithdrawal}` },
          { status: 400 }
        );
      }

      if (user.balance < data.amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
      
      // Check for pending withdrawals (prevent stacking)
      const pendingCount = await Transaction.countDocuments({
        userId: payload.userId,
        type: 'withdrawal',
        status: 'pending',
      });
      if (pendingCount >= 3) {
        return NextResponse.json({ error: 'You have too many pending withdrawals. Please wait for existing ones to be processed.' }, { status: 400 });
      }

      // Verify OTP if withdrawal OTP is enabled
      if (user.withdrawalOtpEnabled) {
        const otpCode = data.otpCode;
        if (!otpCode) {
          return NextResponse.json({ error: 'OTP code is required for withdrawals' }, { status: 400 });
        }
        if (!user.withdrawalOtp || user.withdrawalOtp.length !== 6 || !user.withdrawalOtpExpiry) {
          return NextResponse.json({ error: 'Please request an OTP first' }, { status: 400 });
        }
        const expiryTime = user.withdrawalOtpExpiry instanceof Date 
          ? user.withdrawalOtpExpiry.getTime() 
          : new Date(user.withdrawalOtpExpiry).getTime();
        if (expiryTime < Date.now()) {
          return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }
        if (user.withdrawalOtp !== otpCode) {
          return NextResponse.json({ error: 'Invalid OTP code. Please try again.' }, { status: 400 });
        }
        // Clear OTP after successful verification (use updateOne to avoid race conditions)
        await User.updateOne(
          { _id: payload.userId },
          { $unset: { withdrawalOtp: '', withdrawalOtpExpiry: '' } }
        );
      }
    }
    
    // Handle Cloudinary upload for deposit proof
    let finalProofUrl = data.type === 'deposit' ? data.proofImage : undefined;
    if (data.type === 'deposit' && data.proofImage) {
      const uploadedUrl = await uploadToCloudinary(data.proofImage, 'deposits');
      if (!uploadedUrl) {
        return NextResponse.json({ error: 'Failed to upload payment proof. Please try a different image.' }, { status: 500 });
      }
      finalProofUrl = uploadedUrl;
    }
    
    const transaction = await Transaction.create({
      userId: payload.userId,
      type: data.type,
      amount: Number(data.amount.toFixed(2)),
      status: 'pending',
      transactionHash: data.type === 'deposit' ? data.transactionHash : undefined,
      cryptoType: data.cryptoType,
      proofImage: finalProofUrl,
      walletAddress: data.type === 'withdrawal' ? data.walletAddress : undefined,
    });

    console.log(`[Transaction] ${data.type.toUpperCase()} created. ID: ${transaction._id}. Proof: ${finalProofUrl || 'N/A'}`);

    return NextResponse.json({
      message: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} request submitted`,
      transaction: { ...transaction.toObject(), proofImage: undefined },
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
