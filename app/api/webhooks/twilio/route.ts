import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

// ✅ Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

// ✅ Pusher setup
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// ✅ Send SMS
export async function sendSMS(to: string, message: string) {
  return await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
}

// ✅ Send WhatsApp message
export async function sendWhatsApp(to: string, message: string) {
  return await client.messages.create({
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER!,
    to: `whatsapp:${to}`,
  });
}

// ✅ Handle incoming Twilio webhook (for SMS/WhatsApp)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get('From')?.toString();
    const body = formData.get('Body')?.toString();

    console.log('📩 Incoming message from Twilio:', { from, body });

    if (!from || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ✅ Normalize phone number (remove "whatsapp:" prefix if any)
    const cleanFrom = from.replace('whatsapp:', '');

    // ✅ Save message to DB
    const contact = await prisma.contact.upsert({
      where: { phone: cleanFrom },
      update: {},
      create: { phone: cleanFrom, name: cleanFrom },
    });

    const savedMessage = await prisma.message.create({
      data: {
        content: body,
        channel: from.includes('whatsapp:') ? 'WHATSAPP' : 'SMS',
        direction: 'INBOUND',
        contactId: contact.id,
      },
      include: { contact: true },
    });

    // ✅ Trigger real-time update to frontend
    await pusher.trigger('messages', 'new-message', {
      id: savedMessage.id,
      contactId: contact.id,
      content: savedMessage.content,
      channel: savedMessage.channel,
      direction: savedMessage.direction,
      createdAt: savedMessage.createdAt,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
      },
    });

    // ✅ Respond to Twilio
    return new NextResponse(
      `<Response><Message>✅ Message received from ${cleanFrom}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
