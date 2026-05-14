import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
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

  // @db.Date comes back as UTC midnight — extract UTC date components so that
  // timezone offsets don't shift the calendar day.
  const days = completedRows.map((r) => {
    const d = new Date(r.date as Date);
    return startOfDay(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  });

  const lastCompletedAt: Date = days[days.length - 1]!;

  // Current streak: walk backwards from today.
  // A gap of 2+ calendar days breaks the streak.
  const today = startOfDay(new Date());
  let current = 0;
  let cursor = today;

  for (let i = days.length - 1; i >= 0; i--) {
    const diff = differenceInCalendarDays(cursor, days[i]!);
    if (diff <= 1) {
      current++;
      cursor = subDays(days[i]!, 1);
    } else {
      break;
    }
  }

  // Best streak: longest consecutive run across all completed days.
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
