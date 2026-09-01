import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshStreakOnLoad, getStreakDisplayState } from '@/lib/streak-engine';
import { getMadridNow } from '@/lib/madrid-date';
import { HomeClient } from '@/components/home/HomeClient';

async function getHomeData(userId: string) {
  const now = getMadridNow();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();

  let streak: {
    current: number;
    best: number;
    displayState: 'alive' | 'frozen' | 'lost' | 'none';
    frozenDays: number;
    bestStreakMonth: number | null;
    bestStreakYear: number | null;
  } = {
    current: 0,
    best: 0,
    displayState: 'none',
    frozenDays: 0,
    bestStreakMonth: null,
    bestStreakYear: null,
  };
  let todayCompleted = false;
  let completedDays: number[] = [];
  let totalCompleted = 0;
  let visionTitle: string | null = null;
  let visionText: string | null = null;
  let strategyTitle: string | null = null;
  let strategyText: string | null = null;

  try {
    const [streakRaw, todayEntry, progressRows, totalCompletedRaw, plan] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),
      prisma.dailyEntry.findFirst({
        where: { plan: { month, year }, dayNumber: day },
        include: { responses: { where: { userId } } },
      }),
      prisma.userProgress.findMany({
        where: { userId, date: { gte: new Date(year, month - 1, 1) } },
        select: { date: true, completed: true },
      }),
      prisma.userProgress.count({
        where: { userId, completed: true },
      }),
      prisma.devotionalPlan.findUnique({
        where: { month_year: { month, year } },
        select: { visionTitle: true, visionText: true, strategyTitle: true, strategyText: true },
      }),
    ]);

    const streakState = {
      current: streakRaw?.current ?? 0,
      best: streakRaw?.best ?? 0,
      lastCompletedAt: streakRaw?.lastCompletedAt ?? null,
    };
    const refreshed = refreshStreakOnLoad(streakState, now);

    if (refreshed.current !== streakState.current) {
      await prisma.streak.upsert({
        where: { userId },
        update: { current: refreshed.current },
        create: { userId, current: refreshed.current, best: refreshed.best },
      });
    }

    const { state: displayState, frozenDays } = getStreakDisplayState(
      streakRaw?.lastCompletedAt ?? null,
      now,
    );
    const bestStreakAt = streakRaw?.bestStreakAt ?? null;
    streak = {
      current: refreshed.current,
      best: refreshed.best,
      displayState,
      frozenDays,
      bestStreakMonth: bestStreakAt ? new Date(bestStreakAt).getUTCMonth() + 1 : null,
      bestStreakYear: bestStreakAt ? new Date(bestStreakAt).getUTCFullYear() : null,
    };

    todayCompleted = (todayEntry?.responses[0]?.completedAt ?? null) !== null;
    completedDays = progressRows
      .filter((p) => p.completed)
      .map((p) => new Date(p.date).getUTCDate());
    totalCompleted = totalCompletedRaw;
    visionTitle = plan?.visionTitle ?? null;
    visionText = plan?.visionText ?? null;
    strategyTitle = plan?.strategyTitle ?? null;
    strategyText = plan?.strategyText ?? null;
  } catch {
    // DB unavailable — page renders with empty state
  }

  return {
    streak,
    day,
    todayCompleted,
    completedDays,
    month,
    year,
    totalCompleted,
    visionTitle,
    visionText,
    strategyTitle,
    strategyText,
  };
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getHomeData(session.user.id);
  const userName = session.user.name?.split(' ')[0] ?? 'amigo';

  return <HomeClient {...data} userName={userName} />;
}
