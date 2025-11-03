import { NextRequest, NextResponse } from 'next/server';
import { processScheduledMessages } from '@/lib/scheduled-processor';

/**
 * GET /api/cron/process-scheduled
 * Processes scheduled messages that are due
 * This should be called by a cron job (e.g., Vercel Cron, GitHub Actions) every minute
 * 
 * For security, you should add authorization header check in production:
 * if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Verify cron secret in production
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await processScheduledMessages();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * For local development, you can also allow POST requests
 */
export async function POST(req: NextRequest) {
  return GET(req);
}