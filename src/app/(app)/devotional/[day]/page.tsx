import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DevotionalClient } from '@/components/devotional/DevotionalClient';

async function getEntry(userId: string, dayNumber: number) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
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

async function getPlanExists(): Promise<boolean> {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const plan = await prisma.devotionalPlan.findUnique({
    where: { month_year: { month, year } },
    select: { id: true },
  });
  return plan !== null;
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

  const nowSpain = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const todaySpain = new Date(nowSpain.getFullYear(), nowSpain.getMonth(), nowSpain.getDate());

  const [entry, initialStreak] = await Promise.all([
    getEntry(session.user.id, dayNumber),
    getStreak(session.user.id),
  ]);

  if (!entry) {
    const planExists = await getPlanExists();
    if (!planExists) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="bg-surface border-border rounded-2xl border p-6">
            <p className="text-4xl">📖</p>
            <p className="text-muted mt-3 text-sm">
              Aún no hemos subido el devocional de este mes. ¡Pronto estará disponible para ti!
            </p>
          </div>
        </div>
      );
    }
    notFound();
  }

  const entryDate = new Date(entry.date);
  if (entryDate > todaySpain) {
    const dateStr = entryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
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
