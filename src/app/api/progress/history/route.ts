import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMadridNow } from '@/lib/madrid-date';
import type { ApiResponse } from '@/types/api';
import type { ProgressHistoryData } from '@/hooks/useProgressHistory';

export async function GET(): Promise<NextResponse<ApiResponse<ProgressHistoryData>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const [plans, completedRows] = await Promise.all([
    prisma.devotionalPlan.findMany({
      select: { month: true, year: true, _count: { select: { entries: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.userProgress.findMany({
      where: { userId: session.user.id, completed: true },
      select: { date: true },
    }),
  ]);

  const completedByMonth = new Map<string, number>();
  for (const row of completedRows) {
    const d = new Date(row.date);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    completedByMonth.set(key, (completedByMonth.get(key) ?? 0) + 1);
  }

  const now = getMadridNow();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const months = plans.map((p) => {
    const raw = new Date(p.year, p.month - 1, 1).toLocaleString('es-ES', { month: 'long' });
    const label = `${raw.charAt(0).toUpperCase()}${raw.slice(1)} ${p.year}`;
    return {
      month: p.month,
      year: p.year,
      label,
      totalDays: p._count.entries,
      completedDays: completedByMonth.get(`${p.year}-${p.month}`) ?? 0,
      isCurrent: p.month === currentMonth && p.year === currentYear,
    };
  });

  return NextResponse.json({ success: true, data: { months } });
}
