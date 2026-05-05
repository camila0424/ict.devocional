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

  const [streakRaw, todayEntry, progressRows] = await Promise.all([
    prisma.streak.findUnique({ where: { userId } }),
    prisma.dailyEntry.findFirst({
      where: { plan: { month, year }, dayNumber: day },
      include: { responses: { where: { userId } } },
    }),
    prisma.userProgress.findMany({
      where: { userId, date: { gte: new Date(year, month - 1, 1) } },
      select: { date: true, completed: true },
    }),
  ]);

  const streakState = {
    current: streakRaw?.current ?? 0,
    best: streakRaw?.best ?? 0,
    lastCompletedAt: streakRaw?.lastCompletedAt ?? null,
  };
  const streak = refreshStreakOnLoad(streakState, now);

  const todayCompleted = (todayEntry?.responses[0]?.completedAt ?? null) !== null;
  const completedDays = progressRows
    .filter((p) => p.completed)
    .map((p) => new Date(p.date).getDate());

  return { streak, day, todayCompleted, completedDays, month, year };
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getHomeData(session.user.id);
  const userName = session.user.name?.split(' ')[0] ?? 'amigo';

  return <HomeClient {...data} userName={userName} />;
}
