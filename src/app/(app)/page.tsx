import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshStreakOnLoad } from '@/lib/streak-engine';
import { HomeClient } from '@/components/home/HomeClient';

async function getHomeData(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const day = now.getDate();

  let streak = { current: 0, best: 0 };
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
    streak = refreshStreakOnLoad(streakState, now);

    if (streak.current !== streakState.current) {
      await prisma.streak.upsert({
        where: { userId },
        update: { current: streak.current },
        create: { userId, current: streak.current, best: streak.best },
      });
    }

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
