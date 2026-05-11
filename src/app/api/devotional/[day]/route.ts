import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';
import type { DailyEntryData } from '@/types/devotional';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ day: string }> },
): Promise<NextResponse<ApiResponse<DailyEntryData | null>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { day } = await params;
  const dayNumber = parseInt(day, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
    return NextResponse.json(
      { success: false, error: 'Día inválido', code: 'INVALID_DAY' },
      { status: 400 },
    );
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const entry = await prisma.dailyEntry.findFirst({
    where: { plan: { month, year }, dayNumber },
    include: {
      readings: { orderBy: { order: 'asc' } },
      responses: { where: { userId: session.user.id } },
      plan: true,
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
