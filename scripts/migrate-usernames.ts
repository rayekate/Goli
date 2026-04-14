import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-trading';

/**
 * Generate a unique username from a user's name or email.
 * Falls back to "user_<id>" if all else fails.
 */
async function generateUsername(name: string, email: string, id: string): Promise<string> {
  // Try name-based: "John Doe" → "johndoe"
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);

  // Try email-based: "john@example.com" → "john"
  const baseEmail = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 16);

  const candidates = [baseName, baseEmail, `user_${id.slice(-8)}`];

  for (const base of candidates) {
    if (base.length < 3) continue;

    // Check if this username is available
    const exists = await User.findOne({ username: base });
    if (!exists) return base;

    // Try with random suffix
    for (let i = 1; i <= 99; i++) {
      const attempt = `${base}${i}`;
      const taken = await User.findOne({ username: attempt });
      if (!taken) return attempt;
    }
  }

  // Ultimate fallback
  return `user_${id}`;
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    // Drop the unique index on username temporarily (if it exists) to avoid errors during migration
    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log('⚡ Dropped existing username index for safe migration');
    } catch {
      // Index doesn't exist yet, that's fine
    }

    const usersWithout = await User.find({
      $or: [{ username: { $exists: false } }, { username: '' }, { username: null }],
    });

    console.log(`Found ${usersWithout.length} users without a username\n`);

    if (usersWithout.length === 0) {
      console.log('✅ All users already have usernames. Nothing to do.');
    } else {
      for (const user of usersWithout) {
        const username = await generateUsername(user.name, user.email, user._id.toString());
        await User.updateOne({ _id: user._id }, { $set: { username } });
        console.log(`  ✅ ${user.email} → @${username}`);
      }
      console.log(`\n✅ Migrated ${usersWithout.length} users`);
    }

    // Re-create the unique index
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    console.log('⚡ Username unique index ensured\n');

    console.log('🚀 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
