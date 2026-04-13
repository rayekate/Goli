import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITrade extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  direction: 'up' | 'down';
  result: 'win' | 'loss' | 'pending';
  profitOrLoss: number;
  entryPrice: number;
  exitPrice?: number;
  duration: number; // seconds until trade settles
  profitPercent?: number; // lock the profit % for this specific trade
  expiresAt?: Date; // when trade should be settled
  settledAt?: Date; // when trade was actually settled
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new Schema<ITrade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['up', 'down'], required: true },
    result: { type: String, enum: ['win', 'loss', 'pending'], default: 'pending' },
    profitOrLoss: { type: Number, default: 0 },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    duration: { type: Number, default: 60 },
    profitPercent: { type: Number },
    expiresAt: { type: Date },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

// Performance indexes
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ result: 1 });
tradeSchema.index({ result: 1, expiresAt: 1 }); // for settling pending trades

const Trade: Model<ITrade> = mongoose.models?.Trade || mongoose.model('Trade', tradeSchema);
export default Trade;
