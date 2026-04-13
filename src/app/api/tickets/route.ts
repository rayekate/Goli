import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { createTicketSchema } from '@/lib/validations';
import { ticketLimiter } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    if (payload.role === 'admin') {
      const tickets = await Ticket.find().populate('userId', 'name email').sort({ updatedAt: -1 });
      return NextResponse.json({ tickets });
    }

    const tickets = await Ticket.find({ userId: payload.userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit ticket creation per user
    const rl = ticketLimiter(payload.userId);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many tickets. Please try again later.' }, { status: 429 });
    }

    await connectToDatabase();

    // Check if user is blocked
    if (payload.role !== 'admin') {
      const user = await User.findById(payload.userId).select('isBlocked');
      if (user?.isBlocked) {
        return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
      }
    }

    const body = await req.json();

    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { title, message } = parsed.data;

    // Limit open tickets per user
    const openTicketCount = await Ticket.countDocuments({
      userId: payload.userId,
      status: { $ne: 'closed' },
    });
    if (openTicketCount >= 10) {
      return NextResponse.json({ error: 'You have too many open tickets. Please close some before creating new ones.' }, { status: 400 });
    }

    const ticket = await Ticket.create({
      userId: payload.userId,
      title,
      messages: [{ sender: payload.role === 'admin' ? 'admin' : 'user', text: message }]
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
