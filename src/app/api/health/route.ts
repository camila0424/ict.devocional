import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [userCount, planCount] = await Promise.all([
      prisma.user.count(),
      prisma.devotionalPlan.count(),
    ]);

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      users: userCount,
      plans: planCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
