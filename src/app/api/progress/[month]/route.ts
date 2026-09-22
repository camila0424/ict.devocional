import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getDaysInMonth, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshStreakOnLoad, getStreakDisplayState } from '@/lib/streak-engine';
import { shouldResetLevel } from '@/lib/level-engine';
import { getMadridNow } from '@/lib/madrid-date';
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

  const madridNow = getMadridNow();
  const streakState = refreshStreakOnLoad(
    {
      current: rawStreak?.current ?? 0,
      best: rawStreak?.best ?? 0,
      lastCompletedAt: rawStreak?.lastCompletedAt ?? null,
    },
    madridNow,
  );

  if (streakState.current !== rawStreak?.current) {
    try {
      await prisma.streak.upsert({
        where: { userId: session.user.id },
        update: { current: streakState.current },
        create: { userId: session.user.id, current: streakState.current, best: streakState.best },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'user_not_found', code: 'USER_NOT_FOUND' },
          { status: 404 },
        );
      }
      throw err;
    }
  }

  const { state: displayState, frozenDays } = getStreakDisplayState(
    rawStreak?.lastCompletedAt ?? null,
    madridNow,
  );
  const bestStreakAt = rawStreak?.bestStreakAt ?? null;
  const bestStreakMonth = bestStreakAt ? new Date(bestStreakAt).getUTCMonth() + 1 : null;
  const bestStreakYear = bestStreakAt ? new Date(bestStreakAt).getUTCFullYear() : null;

  const needsLevelReset = shouldResetLevel(
    rawStreak?.lastCompletedAt ?? null,
    rawStreak?.levelResetAt ?? null,
    madridNow,
  );
  if (needsLevelReset) {
    try {
      await prisma.streak.upsert({
        where: { userId: session.user.id },
        update: { levelResetAt: madridNow },
        create: { userId: session.user.id, levelResetAt: madridNow },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return NextResponse.json(
          { success: false, error: 'user_not_found', code: 'USER_NOT_FOUND' },
          { status: 404 },
        );
      }
      throw err;
    }
  }
  const levelResetAt = needsLevelReset ? madridNow : (rawStreak?.levelResetAt ?? null);
  const levelDays = levelResetAt
    ? await prisma.userProgress.count({
        where: { userId: session.user.id, completed: true, date: { gte: levelResetAt } },
      })
    : allTimeCount;

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
      streak: {
        current: streakState.current,
        best: streakState.best,
        displayState,
        frozenDays,
        bestStreakMonth,
        bestStreakYear,
      },
      stats: {
        totalCompleted: allTimeCount,
        completedThisMonth,
        bestStreak: streakState.best,
        percentageMonth,
        levelDays,
      },
      last7Days,
    },
  });
}
