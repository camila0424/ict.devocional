import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';
import type { DailyEntryData } from '@/types/devotional';

export async function GET(): Promise<NextResponse<ApiResponse<DailyEntryData | null>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const day = today.getDate();

  const entry = await prisma.dailyEntry.findFirst({
    where: { plan: { month, year }, dayNumber: day },
    include: {
      plan: { select: { visionText: true, strategyText: true } },
      readings: { orderBy: { order: 'asc' } },
      responses: { where: { userId: session.user.id } },
    },
  });

  if (!entry) {
    return NextResponse.json({ success: true, data: null });
  }

  const response = entry.responses[0] ?? null;

  return NextResponse.json({
    success: true,
    data: {
      id: entry.id,
      dayNumber: entry.dayNumber,
      date: entry.date,
      rawReadings: entry.rawReadings,
      readings: entry.readings,
      visionText: entry.plan.visionText ?? null,
      strategyText: entry.plan.strategyText ?? null,
      response: response
        ? {
            message: response.message,
            promise: response.promise,
            commandment: response.commandment,
            wrongAttitudes: response.wrongAttitudes,
            teotherapy: response.teotherapy,
            petition: response.petition,
            gratitude: response.gratitude,
            pending: response.pending,
            completedAt: response.completedAt,
          }
        : null,
    },
  });
}
