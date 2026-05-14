import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { prisma } from '@/lib/prisma';

export type StreakResult = {
  current: number;
  best: number;
  lastCompletedAt: Date | null;
};

export async function recalculateStreak(userId: string): Promise<StreakResult> {
  const completedRows = await prisma.userProgress.findMany({
    where: { userId, completed: true },
    orderBy: { date: 'asc' },
    select: { date: true },
  });

  if (completedRows.length === 0) {
    await prisma.streak.upsert({
      where: { userId },
      update: { current: 0, best: 0, lastCompletedAt: null },
      create: { userId, current: 0, best: 0, lastCompletedAt: null },
    });
    return { current: 0, best: 0, lastCompletedAt: null };
  }

  const days = completedRows.map((r) => startOfDay(new Date(r.date as Date)));
  const lastCompletedAt: Date = days[days.length - 1]!;

  // Current streak: walk backwards from today.
  // diff===1 on the first step is the "today not yet completed" grace window.
  // After that, only exact matches (diff===0) are consecutive.
  const today = startOfDay(new Date());
  let current = 0;
  let cursor = today;
  let firstStep = true;

  for (let i = days.length - 1; i >= 0; i--) {
    const diff = differenceInCalendarDays(cursor, days[i]!);
    if (diff === 0 || (diff === 1 && firstStep)) {
      current++;
      cursor = new Date(days[i]!.getTime() - 86400000);
      firstStep = false;
    } else {
      break;
    }
  }

  // Best streak: iterate all days in order, track longest consecutive run.
  let best = 0;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (differenceInCalendarDays(days[i]!, days[i - 1]!) === 1) {
      run++;
    } else {
      if (run > best) best = run;
      run = 1;
    }
  }
  if (run > best) best = run;
  if (current > best) best = current;

  await prisma.streak.upsert({
    where: { userId },
    update: { current, best, lastCompletedAt },
    create: { userId, current, best, lastCompletedAt },
  });

  return { current, best, lastCompletedAt };
}
