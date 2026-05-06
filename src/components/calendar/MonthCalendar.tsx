'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Converts JS getDay() (0=Sun) to Monday-first offset (0=Mon…6=Sun)
function mondayOffset(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

type Props = {
  month: number;
  year: number;
  daysInMonth: number;
  completedDays: number[];
  currentDay?: number;
  withLinks?: boolean;
};

export function MonthCalendar({
  month,
  year,
  daysInMonth,
  completedDays,
  currentDay,
  withLinks = false,
}: Props) {
  const offset = mondayOffset(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthLabel = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
  const title = `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`;

  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <span className="text-muted text-sm">
          {completedDays.length}/{daysInMonth}
        </span>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center">
        {WEEK_LABELS.map((d) => (
          <span key={d} className="text-muted text-xs font-semibold">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`offset-${i}`} />
        ))}
        {days.map((d) => {
          const done = completedDays.includes(d);
          const isToday = d === currentDay;
          const cell = (
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-[var(--color-success)] text-white',
                isToday && !done && 'bg-[var(--color-primary)] text-white',
                !isToday && !done && 'text-muted hover:bg-border',
              )}
            >
              {d}
            </motion.div>
          );

          return (
            <div key={d} className="flex justify-center">
              {withLinks ? <Link href={`/devotional/${d}`}>{cell}</Link> : cell}
            </div>
          );
        })}
      </div>
    </div>
  );
}
