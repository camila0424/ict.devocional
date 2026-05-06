import { NextResponse } from 'next/server';
import { getDaysInMonth, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshStreakOnLoad } from '@/lib/streak-engine';
import type { ApiResponse } from '@/types/api';
import type { ProgressData } from '@/hooks/useProgress';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ month: string }> },
): Promise<NextResponse<ApiResponse<ProgressData>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { month: monthParam } = await params;
  const [yearStr, monthStr] = monthParam.split('-');
  const year = parseInt(yearStr ?? '0', 10);
  const month = parseInt(monthStr ?? '0', 10);

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { success: false, error: 'Formato de mes inválido', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = subDays(todayUTC, 6);

  const [monthProgress, allTimeCount, rawStreak, last7Progress] = await Promise.all([
    prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        date: { gte: monthStart, lte: monthEnd },
        completed: true,
      },
      select: { date: true },
    }),
    prisma.userProgress.count({
      where: { userId: session.user.id, completed: true },
    }),
    prisma.streak.findUnique({ where: { userId: session.user.id } }),
    prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        date: { gte: sevenDaysAgo, lte: todayUTC },
        completed: true,
      },
      select: { date: true },
    }),
  ]);

  const streakState = refreshStreakOnLoad(
    {
      current: rawStreak?.current ?? 0,
      best: rawStreak?.best ?? 0,
      lastCompletedAt: rawStreak?.lastCompletedAt ?? null,
    },
    new Date(),
  );

  if (rawStreak && streakState.current !== rawStreak.current) {
    await prisma.streak.update({
      where: { userId: session.user.id },
      data: { current: streakState.current },
    });
  }

  const completedDays = monthProgress.map((p) => new Date(p.date).getUTCDate());
  const completedThisMonth = completedDays.length;
  const percentageMonth = Math.round((completedThisMonth / daysInMonth) * 100);

  const completedLast7Set = new Set(
    last7Progress.map((p) => new Date(p.date).toISOString().slice(0, 10)),
  );

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(todayUTC, 6 - i);
    const dateStr = date.toISOString().slice(0, 10);
    return {
      dayNumber: date.getUTCDate(),
      date: dateStr,
      completed: completedLast7Set.has(dateStr),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      month,
      year,
      daysInMonth,
      completedDays,
      streak: { current: streakState.current, best: streakState.best },
      stats: {
        totalCompleted: allTimeCount,
        completedThisMonth,
        bestStreak: streakState.best,
        percentageMonth,
      },
      last7Days,
    },
  });
}
