import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  walletAddress?: string; // used for withdrawal
  transactionId?: string; // legacy deposit proof
  transactionHash?: string; // new crypto hash
  cryptoType?: string; // BTC, ETH, USDT
  proofImage?: string; // Base64 or URL
  adminNote?: string; // rejection reason or admin note
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    walletAddress: { type: String },
    transactionId: { type: String },
    transactionHash: { type: String },
    cryptoType: { type: String },
    proofImage: { type: String },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// Performance indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models?.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
