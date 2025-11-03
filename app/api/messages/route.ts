import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendSMS, sendWhatsApp } from '@/lib/twilio';
import Pusher from 'pusher';

const prisma = new PrismaClient();

// ✅ Initialize Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const messageSchema = z.object({
  contactId: z.string(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'TWITTER', 'FACEBOOK']),
  content: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  mediaUrl: z.string().url().optional(),
});

/**
 * GET /api/messages?contactId=xxx - Fetch messages for a contact
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: { contactId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST /api/messages - Send a new message + trigger realtime update
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = messageSchema.parse(body);

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: validated.contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // ✅ Handle scheduled messages
    if (validated.scheduledAt) {
      const scheduled = await prisma.scheduledMessage.create({
        data: {
          contactId: validated.contactId,
          channel: validated.channel,
          content: validated.content,
          scheduledAt: new Date(validated.scheduledAt),
        },
      });

      return NextResponse.json({ success: true, scheduled: true, message: scheduled });
    }

    // ✅ Send message immediately
    let externalResponse;

    switch (validated.channel) {
      case 'SMS':
        if (!contact.phone) {
          return NextResponse.json({ error: 'Contact has no phone number' }, { status: 400 });
        }
        externalResponse = await sendSMS(contact.phone, validated.content);
        break;

      case 'WHATSAPP':
        if (!contact.whatsapp && !contact.phone) {
          return NextResponse.json({ error: 'Contact has no WhatsApp number' }, { status: 400 });
        }
        externalResponse = await sendWhatsApp(contact.whatsapp || contact.phone!, validated.content);
        break;

      default:
        return NextResponse.json({ error: 'Channel not implemented' }, { status: 501 });
    }

    // ✅ Save to database
    const message = await prisma.message.create({
      data: {
        contactId: validated.contactId,
        channel: validated.channel,
        direction: 'OUTBOUND',
        content: validated.content,
        status: 'SENT',
        sentAt: new Date(),
        mediaUrl: validated.mediaUrl,
        metadata: { sid: externalResponse.sid },
      },
    });

    // ✅ Update contact's timestamp
    await prisma.contact.update({
      where: { id: validated.contactId },
      data: { updatedAt: new Date() },
    });

    // ✅ Trigger Pusher realtime event
    await pusher.trigger('messages', 'new-message', {
      id: message.id,
      contactId: message.contactId,
      content: message.content,
      channel: message.channel,
      createdAt: message.createdAt,
      direction: message.direction,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid message data', details: error.errors }, { status: 400 });
    }
    console.error('❌ Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
