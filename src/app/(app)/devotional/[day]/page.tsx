import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DevotionalClient } from '@/components/devotional/DevotionalClient';

async function getEntry(userId: string, dayNumber: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return prisma.dailyEntry.findFirst({
    where: { plan: { month, year }, dayNumber },
    include: {
      readings: { orderBy: { order: 'asc' } },
      responses: { where: { userId } },
    },
  });
}

export default async function DevotionalDayPage({ params }: { params: Promise<{ day: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { day } = await params;
  const dayNumber = parseInt(day, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) notFound();

  const entry = await getEntry(session.user.id, dayNumber);
  if (!entry) notFound();

  const response = entry.responses[0] ?? null;

  return (
    <DevotionalClient
      entry={{
        id: entry.id,
        dayNumber: entry.dayNumber,
        date: entry.date.toISOString(),
        readings: entry.readings,
      }}
      initialResponse={
        response
          ? {
              message: response.message ?? '',
              promise: response.promise ?? '',
              commandment: response.commandment ?? '',
              wrongAttitudes: response.wrongAttitudes ?? '',
              teotherapy: response.teotherapy ?? '',
              petition: response.petition ?? '',
              gratitude: response.gratitude ?? '',
              pending: response.pending ?? '',
              completedAt: response.completedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
