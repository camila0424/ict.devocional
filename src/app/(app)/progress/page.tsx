'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { BookOpen, Calendar, CheckCircle2, Circle, Percent, Trophy } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { StreakCard } from '@/components/streak/StreakCard';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { LevelTable } from '@/components/ui/LevelTable';

const NOW = new Date();
const YEAR_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
const TODAY = NOW.getDate();
const CURRENT_MONTH = NOW.getMonth() + 1;
const CURRENT_YEAR = NOW.getFullYear();

export default function ProgressPage() {
  const { data, isLoading, error } = useProgress(YEAR_MONTH);

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
        <StreakCard current={data.streak.current} best={data.streak.best} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.04, duration: 0.25 }}
            className="bg-surface border-border rounded-2xl border p-4"
          >
            <Icon size={20} className={color} />
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="text-muted text-xs">{label}</p>
          </motion.div>
        ))}
      </motion.div>

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
