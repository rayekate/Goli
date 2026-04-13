import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import { z } from 'zod';
import { apiLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/api-guard';

const contactSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().max(256).trim(),
  subject: z.enum(['general', 'partnership', 'legal']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000).trim(),
});

/**
 * POST: Public contact form — creates a ticket linked to user if they exist,
 * otherwise stores as a guest inquiry ticket with a placeholder user lookup.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = apiLimiter(ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { firstName, lastName, email, subject, message } = parsed.data;

    await connectToDatabase();

    // Try to find existing user by email
    const existingUser = await User.findOne({ email });

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      partnership: 'Partnership & Affiliates',
      legal: 'Legal & Compliance',
    };

    const title = `[Contact] ${subjectLabels[subject] || subject} — ${firstName} ${lastName}`;
    const fullMessage = `From: ${firstName} ${lastName} <${email}>\nSubject: ${subjectLabels[subject]}\n\n${message}`;

    if (existingUser) {
      // Create a real support ticket linked to the user
      await Ticket.create({
        userId: existingUser._id,
        title,
        status: 'open',
        messages: [{ sender: 'user', text: fullMessage }],
      });
    } else {
      // For guest users, find or create admin to hold the ticket
      const admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }
      await Ticket.create({
        userId: admin._id,
        title,
        status: 'open',
        messages: [{ sender: 'user', text: fullMessage }],
      });
    }

    return NextResponse.json({ message: 'Your inquiry has been submitted successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
