import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import { getAuthUser } from '@/lib/auth';
import { ticketReplySchema, ticketStatusSchema } from '@/lib/validations';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuthUser();
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();

    const parsed = ticketReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid message' }, { status: 400 });
    }

    const { id } = await params;
    const ticket = await Ticket.findById(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    if (payload.role !== 'admin' && ticket.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Cannot reply to a closed ticket' }, { status: 400 });
    }

    // Prevent unbounded message arrays (DoS protection)
    if (ticket.messages.length >= 500) {
      return NextResponse.json({ error: 'This ticket has reached the maximum number of messages. Please create a new ticket.' }, { status: 400 });
    }

    ticket.messages.push({
      sender: payload.role === 'admin' ? 'admin' : 'user',
      text: parsed.data.message,
      createdAt: new Date()
    });

    ticket.status = payload.role === 'admin' ? 'pending' : 'open';
    await ticket.save();

    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getAuthUser();
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const parsed = ticketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { id } = await params;
    const ticket = await Ticket.findByIdAndUpdate(id, { status: parsed.data.status }, { new: true });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
