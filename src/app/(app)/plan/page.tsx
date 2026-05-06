import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';

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

  const { entries, today } = await getPlanData(session.user.id);
  const completedCount = entries.filter((e) => e.completed).length;

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold">Plan Mayo 2026</h1>
        <p className="text-muted mt-0.5 text-sm">
          {completedCount} de {entries.length} días completados
        </p>
      </div>

      {/* Barra de progreso global */}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-primary-light)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${(completedCount / (entries.length || 1)) * 100}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => {
          const isToday = entry.dayNumber === today;
          const readingLabel =
            entry.rawReadings ||
            entry.readings.map((r) => `${r.bookFull} ${r.reference}`).join(' · ');

          const isFuture = entry.dayNumber > today;

          const card = (
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
                isFuture
                  ? 'border-border bg-surface opacity-40'
                  : entry.completed
                    ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5 active:scale-[0.99]'
                    : isToday
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] active:scale-[0.99]'
                      : 'border-border bg-surface active:scale-[0.99]',
              )}
            >
              {/* Número / check */}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black',
                  entry.completed
                    ? 'bg-[var(--color-success)] text-white'
                    : isToday
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-border text-muted',
                )}
              >
                {entry.completed ? <CheckCircle2 size={18} /> : entry.dayNumber}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isToday && !entry.completed && 'text-[var(--color-primary)]',
                    entry.completed && 'text-muted',
                  )}
                >
                  {isToday && !entry.completed ? 'Hoy · ' : ''}Día {entry.dayNumber}
                </p>
                <p className="text-muted truncate text-xs">{readingLabel}</p>
              </div>

              {isFuture ? (
                <span className="shrink-0 text-base">🔒</span>
              ) : entry.completed ? (
                <Circle size={16} className="shrink-0 text-[var(--color-success)]" />
              ) : (
                <ChevronRight size={16} className="text-muted shrink-0" />
              )}
            </div>
          );

          return (
            <li key={entry.dayNumber}>
              {isFuture ? (
                <div className="cursor-default">{card}</div>
              ) : (
                <Link href={`/devotional/${entry.dayNumber}`}>{card}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
