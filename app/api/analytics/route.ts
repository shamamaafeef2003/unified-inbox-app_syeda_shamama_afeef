import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Pusher from "pusher";

const prisma = new PrismaClient();

// ✅ Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function GET(req: NextRequest) {
  try {
    // Total messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ["channel"],
      _count: { id: true },
    });

    // Messages by direction
    const messagesByDirection = await prisma.message.groupBy({
      by: ["direction"],
      _count: { id: true },
    });

    // Messages over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messagesOverTime = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count,
        "channel"
      FROM "Message"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt"), "channel"
      ORDER BY date ASC
    `;

    // Response time analytics
    const responseTimeData = await prisma.$queryRaw`
      SELECT 
        m1."contactId",
        AVG(
          EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt")) / 60
        ) as avg_response_time_minutes
      FROM "Message" m1
      INNER JOIN "Message" m2 ON m1."contactId" = m2."contactId"
      WHERE m1."direction" = 'INBOUND' 
        AND m2."direction" = 'OUTBOUND'
        AND m2."createdAt" > m1."createdAt"
        AND m2."createdAt" = (
          SELECT MIN("createdAt") 
          FROM "Message" 
          WHERE "contactId" = m1."contactId" 
            AND "direction" = 'OUTBOUND' 
            AND "createdAt" > m1."createdAt"
        )
      GROUP BY m1."contactId"
    `;

    const avgResponseTime =
      responseTimeData.length > 0
        ? responseTimeData.reduce(
            (acc: number, curr: any) =>
              acc + parseFloat(curr.avg_response_time_minutes),
            0
          ) / responseTimeData.length
        : 0;

    const totalContacts = await prisma.contact.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeContacts = await prisma.contact.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const messagesByStatus = await prisma.message.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const analyticsData = {
      messagesByChannel: messagesByChannel.map((m) => ({
        channel: m.channel,
        count: m._count.id,
      })),
      messagesByDirection: messagesByDirection.map((m) => ({
        direction: m.direction,
        count: m._count.id,
      })),
      messagesOverTime,
      avgResponseTimeMinutes: avgResponseTime,
      totalContacts,
      activeContacts,
      messagesByStatus: messagesByStatus.map((m) => ({
        status: m.status,
        count: m._count.id,
      })),
    };

    // ✅ Emit event to Pusher for realtime dashboard updates
    await pusher.trigger("analytics-channel", "update", analyticsData);

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
