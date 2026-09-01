import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { STREAK_GRACE_DAYS } from '@/lib/streak-engine';
import { getMadridNow } from '@/lib/madrid-date';

export type StreakResult = {
  current: number;
  best: number;
  bestStreakAt: Date | null;
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
      update: { current: 0, best: 0, bestStreakAt: null, lastCompletedAt: null },
      create: { userId, current: 0, best: 0, bestStreakAt: null, lastCompletedAt: null },
    });
    return { current: 0, best: 0, bestStreakAt: null, lastCompletedAt: null };
  }

  // @db.Date comes back as UTC midnight — extract UTC date components so that
  // timezone offsets don't shift the calendar day.
  const days = completedRows.map((r) => {
    const d = new Date(r.date as Date);
    return startOfDay(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  });

  const lastCompletedAt: Date = days[days.length - 1]!;

  // Current streak: walk backwards from today.
  // A gap of more than STREAK_GRACE_DAYS calendar days breaks the streak.
  const today = startOfDay(getMadridNow());
  let current = 0;
  let cursor = today;

  for (let i = days.length - 1; i >= 0; i--) {
    const diff = differenceInCalendarDays(cursor, days[i]!);
    if (diff <= STREAK_GRACE_DAYS) {
      current++;
      cursor = subDays(days[i]!, 1);
    } else {
      break;
    }
  }

  // Best streak: longest run tolerating gaps of up to STREAK_GRACE_DAYS,
  // tracking the last day of whichever run turns out to be the best.
  let best = 0;
  let bestEndDate: Date = days[0]!;
  let run = 1;
  let runEndDate: Date = days[0]!;

  for (let i = 1; i < days.length; i++) {
    if (differenceInCalendarDays(days[i]!, days[i - 1]!) <= STREAK_GRACE_DAYS) {
      run++;
      runEndDate = days[i]!;
    } else {
      run = 1;
      runEndDate = days[i]!;
    }
    if (run > best) {
      best = run;
      bestEndDate = runEndDate;
    }
  }

  let bestStreakAt: Date = bestEndDate;
  if (current >= best) {
    best = Math.max(current, best);
    bestStreakAt = lastCompletedAt;
  }

  await prisma.streak.upsert({
    where: { userId },
    update: { current, best, bestStreakAt, lastCompletedAt },
    create: { userId, current, best, bestStreakAt, lastCompletedAt },
  });

  return { current, best, bestStreakAt, lastCompletedAt };
}
