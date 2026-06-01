import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlanDayList } from './PlanDayList';

async function getPlanData(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const entries = await prisma.dailyEntry.findMany({
    where: { plan: { month, year } },
    include: {
      readings: { orderBy: { order: 'asc' } },
      responses: { where: { userId }, select: { completedAt: true } },
    },
    orderBy: { dayNumber: 'asc' },
  });

  return {
    today: now.getDate(),
    month,
    year,
    entries: entries.map((e) => ({
      dayNumber: e.dayNumber,
      rawReadings: e.rawReadings as string,
      readings: e.readings,
      completed: e.responses[0]?.completedAt != null,
    })),
  };
}

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { entries, today, month, year } = await getPlanData(session.user.id);
  const completedCount = entries.filter((e) => e.completed).length;

  const rawMonth = new Date(year, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold">
          Plan {monthLabel} {year}
        </h1>
        <p className="text-muted mt-0.5 text-sm">
          {completedCount} de {entries.length} días completados
        </p>
      </div>

      {/* Barra de progreso global */}
      <div className="bg-primary-light h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${(completedCount / (entries.length || 1)) * 100}%` }}
        />
      </div>

      <PlanDayList entries={entries} today={today} />
    </div>
  );
}
