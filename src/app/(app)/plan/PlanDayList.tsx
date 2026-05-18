'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Reading = { bookFull: string; reference: string };

type Entry = {
  dayNumber: number;
  rawReadings: string;
  readings: Reading[];
  completed: boolean;
};

type Props = {
  entries: Entry[];
  today: number;
};

export function PlanDayList({ entries, today }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => {
        const isToday = entry.dayNumber === today;
        const isFuture = entry.dayNumber > today;
        const readingLabel =
          entry.rawReadings ||
          entry.readings.map((r) => `${r.bookFull} ${r.reference}`).join(' · ');

        const card = (
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
              isFuture
                ? 'border-border bg-surface opacity-40'
                : entry.completed
                  ? 'border-success/30 bg-success/5 active:scale-[0.99]'
                  : isToday
                    ? 'border-primary bg-primary-light active:scale-[0.99]'
                    : 'border-border bg-surface active:scale-[0.99]',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black',
                entry.completed
                  ? 'bg-success text-white'
                  : isToday
                    ? 'bg-primary text-white'
                    : 'bg-border text-muted',
              )}
            >
              {entry.completed ? <CheckCircle2 size={18} /> : entry.dayNumber}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isToday && !entry.completed && 'text-primary',
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
              <Circle size={16} className="text-success shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-muted shrink-0" />
            )}
          </div>
        );

        return (
          <li key={entry.dayNumber}>
            {isFuture ? (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => toast('Este día aún no ha llegado 🔒')}
              >
                {card}
              </button>
            ) : (
              <Link href={`/devotional/${entry.dayNumber}`} className="block">
                {card}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
