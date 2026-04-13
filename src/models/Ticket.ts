import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITicketMessage {
  sender: 'user' | 'admin';
  text: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  status: 'open' | 'pending' | 'closed';
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  text: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new Schema<ITicket>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open' },
  messages: { type: [ticketMessageSchema], default: [] }
}, { timestamps: true });

ticketSchema.index({ userId: 1 });
ticketSchema.index({ status: 1 });

const Ticket: Model<ITicket> = mongoose.models?.Ticket || mongoose.model('Ticket', ticketSchema);
export default Ticket;
