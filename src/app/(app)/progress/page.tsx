'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Percent,
  Trophy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useProgressHistory } from '@/hooks/useProgressHistory';
import { StreakCard } from '@/components/streak/StreakCard';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { LevelTable } from '@/components/ui/LevelTable';
import { cn } from '@/lib/utils';

const NOW = new Date();
const YEAR_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
const TODAY = NOW.getDate();
const CURRENT_MONTH = NOW.getMonth() + 1;
const CURRENT_YEAR = NOW.getFullYear();

export default function ProgressPage() {
  const { data, isLoading, error } = useProgress(YEAR_MONTH);
  const { data: history } = useProgressHistory();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-4xl">😕</p>
        <p className="font-bold">No se pudo cargar tu progreso</p>
        <p className="text-muted text-sm">Revisa tu conexión e intenta de nuevo</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Días totales',
      value: data.stats.totalCompleted,
      icon: BookOpen,
      color: 'text-[var(--color-primary)]',
    },
    {
      label: 'Este mes',
      value: data.stats.completedThisMonth,
      icon: Calendar,
      color: 'text-[var(--color-accent)]',
    },
    {
      label: 'Mejor racha',
      value: data.stats.bestStreak,
      icon: Trophy,
      color: 'text-[var(--color-star)]',
    },
    {
      label: '% del mes',
      value: `${data.stats.percentageMonth}%`,
      icon: Percent,
      color: 'text-[var(--color-success)]',
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-2xl font-extrabold"
      >
        Mi progreso
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <StreakCard
          current={data.streak.current}
          best={data.streak.best}
          displayState={data.streak.displayState}
          frozenDays={data.streak.frozenDays}
          bestStreakMonth={data.streak.bestStreakMonth}
          bestStreakYear={data.streak.bestStreakYear}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        {stats.map(({ label, value, icon: Icon, color }, i) => {
          const isTotalDays = label === 'Días totales';
          const content = (
            <>
              <div className="flex items-center justify-between">
                <Icon size={20} className={color} />
                {isTotalDays && (
                  <ChevronDown
                    size={16}
                    className={cn('text-muted transition-transform', showBreakdown && 'rotate-180')}
                  />
                )}
              </div>
              <p className="mt-2 text-2xl font-black">{value}</p>
              <p className="text-muted text-xs">{label}</p>
            </>
          );
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.04, duration: 0.25 }}
              className="bg-surface border-border rounded-2xl border p-4"
            >
              {isTotalDays ? (
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="block w-full text-left"
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {showBreakdown && history && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface border-border overflow-hidden rounded-2xl border"
          >
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold">Desglose por mes</p>
              <ul className="flex flex-col gap-1.5">
                {history.months.map((m) => (
                  <li
                    key={`${m.year}-${m.month}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {m.label}
                      {m.isCurrent ? ' (actual)' : ''}
                    </span>
                    <span className="text-muted">{m.completedDays} días</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
      >
        <MonthCalendar
          month={CURRENT_MONTH}
          year={CURRENT_YEAR}
          daysInMonth={data.daysInMonth}
          completedDays={data.completedDays}
          currentDay={TODAY}
          withLinks
        />
      </motion.div>

      {history && history.months.some((m) => !m.isCurrent) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-surface border-border overflow-hidden rounded-2xl border"
        >
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center justify-between p-4"
          >
            <h2 className="font-bold">📅 Meses anteriores</h2>
            <ChevronDown
              size={18}
              className={cn('text-muted transition-transform', showHistory && 'rotate-180')}
            />
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ul className="border-border flex flex-col divide-y divide-(--color-border) border-t">
                  {history.months
                    .filter((m) => !m.isCurrent)
                    .map((m) => (
                      <li key={`${m.year}-${m.month}`}>
                        <Link
                          href={`/plan?month=${m.month}&year=${m.year}`}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <span className="font-medium">{m.label}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-muted">
                              {m.completedDays}/{m.totalDays} días
                            </span>
                            <ChevronRight size={16} className="text-muted" />
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <LevelTable />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.23, duration: 0.3 }}
        className="bg-surface border-border rounded-2xl border p-4"
      >
        <h2 className="mb-3 font-bold">Últimos 7 días</h2>
        <ul className="flex flex-col gap-2">
          {data.last7Days.map(({ date, completed }) => (
            <li key={date} className="flex items-center justify-between">
              <span className="text-sm capitalize">
                {format(new Date(`${date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
              </span>
              {completed ? (
                <CheckCircle2 size={20} className="shrink-0 text-[var(--color-success)]" />
              ) : (
                <Circle size={20} className="text-muted shrink-0" />
              )}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
