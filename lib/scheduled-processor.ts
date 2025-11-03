import { PrismaClient } from '@prisma/client';
import { sendSMS, sendWhatsApp } from './twilio';

const prisma = new PrismaClient();

/**
 * Process scheduled messages that are due to be sent
 * This should be called by a cron job every minute
 */
export async function processScheduledMessages() {
  const now = new Date();

  try {
    // Find all pending scheduled messages that are due
    const dueMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: now,
        },
      },
    });

    console.log(`Found ${dueMessages.length} scheduled messages to process`);

    for (const scheduledMsg of dueMessages) {
      try {
        // Get contact details
        const contact = await prisma.contact.findUnique({
          where: { id: scheduledMsg.contactId },
        });

        if (!contact) {
          console.error(`Contact not found for scheduled message ${scheduledMsg.id}`);
          await prisma.scheduledMessage.update({
            where: { id: scheduledMsg.id },
            data: { status: 'FAILED' },
          });
          continue;
        }

        // Send the message
        let externalResponse;

        switch (scheduledMsg.channel) {
          case 'SMS':
            if (!contact.phone) {
              throw new Error('Contact has no phone number');
            }
            externalResponse = await sendSMS(contact.phone, scheduledMsg.content);
            break;

          case 'WHATSAPP':
            if (!contact.whatsapp && !contact.phone) {
              throw new Error('Contact has no WhatsApp number');
            }
            externalResponse = await sendWhatsApp(
              contact.whatsapp || contact.phone!,
              scheduledMsg.content
            );
            break;

          default:
            throw new Error(`Channel ${scheduledMsg.channel} not yet implemented`);
        }

        // Save to message history
        await prisma.message.create({
          data: {
            contactId: scheduledMsg.contactId,
            channel: scheduledMsg.channel,
            direction: 'OUTBOUND',
            content: scheduledMsg.content,
            status: 'SENT',
            sentAt: new Date(),
            metadata: { 
              sid: externalResponse.sid,
              scheduledMessageId: scheduledMsg.id 
            },
          },
        });

        // Update scheduled message status
        await prisma.scheduledMessage.update({
          where: { id: scheduledMsg.id },
          data: { status: 'SENT' },
        });

        console.log(`Successfully sent scheduled message ${scheduledMsg.id}`);
      } catch (error) {
        console.error(`Error sending scheduled message ${scheduledMsg.id}:`, error);

        // Mark as failed
        await prisma.scheduledMessage.update({
          where: { id: scheduledMsg.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return {
      processed: dueMessages.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
    throw error;
  }
}

/**
 * Get upcoming scheduled messages
 */
export async function getUpcomingScheduledMessages(limit = 10) {
  return await prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: {
        gte: new Date(),
      },
    },
    include: {
      contact: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: limit,
  });
}