import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMadridNow } from '@/lib/madrid-date';
import type { ApiResponse } from '@/types/api';

type PlanEntry = {
  dayNumber: number;
  rawReadings: string;
  readings: { bookFull: string; reference: string }[];
  completed: boolean;
};

// Lecturas del mes actual con el estado de cada día; se pide solo cuando se abre el plan en Inicio.
export async function GET(): Promise<NextResponse<ApiResponse<PlanEntry[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const now = getMadridNow();
  const entries = await prisma.dailyEntry.findMany({
    where: { plan: { month: now.getMonth() + 1, year: now.getFullYear() } },
    include: {
      readings: { orderBy: { order: 'asc' } },
      responses: { where: { userId: session.user.id }, select: { completedAt: true } },
    },
    orderBy: { dayNumber: 'asc' },
  });

  return NextResponse.json({
    success: true,
    data: entries.map((e) => ({
      dayNumber: e.dayNumber,
      rawReadings: e.rawReadings,
      readings: e.readings.map((r) => ({ bookFull: r.bookFull, reference: r.reference })),
      completed: e.responses[0]?.completedAt != null,
    })),
  });
}
