import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
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

async function getStreak(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  return streak?.current ?? 0;
}

export default async function DevotionalDayPage({ params }: { params: Promise<{ day: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { day } = await params;
  const dayNumber = parseInt(day, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) notFound();

  const today = new Date().getDate();

  if (dayNumber > today) {
    const entry = await getEntry(session.user.id, dayNumber);
    const entryDate = entry ? new Date(entry.date) : null;
    const dateStr = entryDate
      ? entryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      : `el día ${dayNumber}`;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
        <span className="text-5xl">🔒</span>
        <div>
          <h1 className="text-xl font-bold">Este devocional aún no está disponible</h1>
          <p className="text-muted mt-1 text-sm">Estará disponible el {dateStr}</p>
        </div>
        <Link
          href="/plan"
          className="bg-primary rounded-2xl px-6 py-3 text-sm font-semibold text-white"
        >
          Volver
        </Link>
      </div>
    );
  }

  const [entry, initialStreak] = await Promise.all([
    getEntry(session.user.id, dayNumber),
    getStreak(session.user.id),
  ]);
  if (!entry) notFound();

  const response = entry.responses[0] ?? null;

  return (
    <DevotionalClient
      entry={{
        id: entry.id,
        dayNumber: entry.dayNumber,
        date: entry.date.toISOString(),
        readings: entry.readings,
        youtubeVideoId: entry.youtubeVideoId ?? null,
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
      initialStreak={initialStreak}
    />
  );
}
