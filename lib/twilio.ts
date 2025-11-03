import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send an SMS message via Twilio
 * @param to - Phone number in E.164 format (e.g., +1234567890)
 * @param message - Message content
 * @param mediaUrl - Optional media URL for MMS
 */
export async function sendSMS(
  to: string,
  message: string,
  mediaUrl?: string
) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const messageData: any = {
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  };

  if (mediaUrl) {
    messageData.mediaUrl = [mediaUrl];
  }

  return await client.messages.create(messageData);
}

/**
 * Send a WhatsApp message via Twilio
 * @param to - Phone number in E.164 format (without whatsapp: prefix)
 * @param message - Message content
 * @param mediaUrl - Optional media URL
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  mediaUrl?: string
) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const messageData: any = {
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
  };

  if (mediaUrl) {
    messageData.mediaUrl = [mediaUrl];
  }

  return await client.messages.create(messageData);
}

/**
 * Validate Twilio webhook signature
 * @param signature - X-Twilio-Signature header
 * @param url - Full webhook URL
 * @param params - Request body parameters
 */
export function validateWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) {
    throw new Error('Twilio auth token not configured');
  }

  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Get available Twilio phone numbers for purchase
 * @param areaCode - Optional area code filter
 * @param country - Country code (default: US)
 */
export async function getAvailablePhoneNumbers(
  areaCode?: string,
  country: string = 'US'
) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const searchParams: any = {
    smsEnabled: true,
    mmsEnabled: true,
  };

  if (areaCode) {
    searchParams.areaCode = areaCode;
  }

  const numbers = await client
    .availablePhoneNumbers(country)
    .local.list(searchParams);

  return numbers;
}

/**
 * Purchase a phone number
 * @param phoneNumber - Phone number to purchase in E.164 format
 */
export async function purchasePhoneNumber(phoneNumber: string) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  return await client.incomingPhoneNumbers.create({
    phoneNumber,
    smsUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio`,
    smsMethod: 'POST',
  });
}

/**
 * Get message delivery status
 * @param messageSid - Twilio message SID
 */
export async function getMessageStatus(messageSid: string) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  return await client.messages(messageSid).fetch();
}