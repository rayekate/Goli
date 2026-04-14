import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import PlatformSettings from '../src/models/PlatformSettings';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-trading';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    // Create Admin
    const adminEmail = 'admin@goldtradex.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'System Admin',
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        balance: 1000000,
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@goldtradex.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // Create a Test User
    const userEmail = 'user@example.com';
    const existingUser = await User.findOne({ email: userEmail });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('user123', 12);
      await User.create({
        name: 'Test Trader',
        username: 'testtrader',
        email: userEmail,
        password: hashedPassword,
        balance: 5000,
        role: 'user'
      });
      console.log('✅ Test user created: user@example.com / user123');
    }

    // Seed wallet addresses into PlatformSettings
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    if (!settings.wallets || settings.wallets.length === 0) {
      settings.wallets = [
        { coinName: 'Bitcoin', network: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', logo: '₿' },
        { coinName: 'Ethereum', network: 'ERC-20', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', logo: 'Ξ' },
        { coinName: 'USDT', network: 'TRC-20', address: 'TKFzQoGpfMYYbiDznEGTmqXYzGhyv1RJGF', logo: '₮' },
        { coinName: 'Litecoin', network: 'LTC', address: 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kgmn4n9', logo: 'Ł' },
      ];
      await settings.save();
      console.log('✅ 4 crypto wallets seeded (BTC, ETH, USDT, LTC)');
    } else {
      console.log('ℹ️ Wallets already configured, skipping.');
    }

    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
