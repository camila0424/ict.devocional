'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelCard } from '@/components/ui/LevelCard';

type Props = {
  userName: string;
  day: number;
  month: number;
  year: number;
  streak: { current: number; best: number };
  todayCompleted: boolean;
  completedDays: number[];
  totalCompleted: number;
  missionText?: string | null;
};

const DAYS_IN_MAY = 31;
const WEEK_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
// 1 May 2026 = Friday → offset 4 (L=0)
const MAY_2026_OFFSET = 4;

export function HomeClient({
  userName,
  day,
  streak,
  todayCompleted,
  completedDays,
  totalCompleted,
  missionText,
}: Props) {
  const days = Array.from({ length: DAYS_IN_MAY }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-muted text-sm">Buenos días 👋</p>
        <h1 className="text-3xl font-extrabold">{userName}</h1>
      </motion.div>

      {/* Racha card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="rounded-2xl bg-[var(--color-primary)] p-6 text-white shadow-lg"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">Racha actual</p>
            <div className="flex items-end gap-1">
              <span className="text-6xl leading-none font-black">{streak.current}</span>
              <span className="mb-2 text-lg text-blue-200">días</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-blue-300">
              <Trophy size={14} />
              <span className="text-sm">Mejor racha: {streak.best} días</span>
            </div>
          </div>
          <div className="text-5xl" style={{ animation: 'var(--animate-flame)' }}>
            🔥
          </div>
        </div>
      </motion.div>

      {/* Nivel card */}
      <LevelCard totalDays={totalCompleted} />

      {/* CTA devocional */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Link href={`/devotional/${day}`}>
          <motion.div
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex items-center justify-between rounded-2xl p-5 shadow-sm transition-colors',
              todayCompleted
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-primary)] text-white',
            )}
          >
            <div>
              <p className="text-sm font-medium opacity-80">Día {day} de Mayo</p>
              <p className="text-base font-bold">
                {todayCompleted ? '✓ Devocional completado ✨' : 'Comenzar devocional de hoy'}
              </p>
            </div>
            {!todayCompleted && <ChevronRight size={22} />}
          </motion.div>
        </Link>
      </motion.div>

      {/* Misión de Mayo */}
      {missionText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="border-border bg-surface rounded-2xl border p-4"
        >
          <h2 className="mb-2 font-bold">🎯 Misión de Mayo</h2>
          <p className="text-sm leading-relaxed">{missionText}</p>
        </motion.div>
      )}

      {/* Calendario Mayo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="border-border bg-surface rounded-2xl border p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Mayo 2026</h2>
          <span className="text-muted text-sm">
            {completedDays.length}/{DAYS_IN_MAY}
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
          {/* Espaciado para el offset del mes */}
          {Array.from({ length: MAY_2026_OFFSET }).map((_, i) => (
            <div key={`offset-${i}`} />
          ))}
          {days.map((d) => {
            const done = completedDays.includes(d);
            const isToday = d === day;
            return (
              <Link key={d} href={`/devotional/${d}`} className="flex justify-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isToday && !done && 'bg-[var(--color-primary)] text-white',
                    done && 'bg-[var(--color-success)] text-white',
                    !isToday && !done && 'text-muted hover:bg-border',
                  )}
                >
                  {d}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
