import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorRole: 'user' | 'admin';
  action: string;
  targetType: 'user' | 'transaction' | 'trade' | 'ticket' | 'settings';
  targetId?: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  ip: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['user', 'admin'], required: true },
    action: { type: String, required: true, maxlength: 100 },
    targetType: { type: String, enum: ['user', 'transaction', 'trade', 'ticket', 'settings'], required: true },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> = mongoose.models?.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
