'use client';

import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type Props = {
  current: number;
  best: number;
  displayState?: 'alive' | 'frozen' | 'lost' | 'none';
  frozenDays?: number;
  bestStreakMonth?: number | null;
  bestStreakYear?: number | null;
};

export function StreakCard({
  current,
  best,
  displayState = 'alive',
  frozenDays = 0,
  bestStreakMonth,
  bestStreakYear,
}: Props) {
  const isLost = displayState === 'lost';
  const isFrozen = displayState === 'frozen';
  const bestLabel =
    bestStreakMonth && bestStreakYear
      ? ` · ${MONTH_NAMES[bestStreakMonth - 1]} ${bestStreakYear}`
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="rounded-2xl p-6 text-white shadow-lg"
      style={{
        background: isLost
          ? 'linear-gradient(135deg, #475569, #64748b)'
          : 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-blue-200">
            {isLost ? 'Racha perdida' : 'Racha actual'}
          </p>
          <div className="flex items-end gap-1">
            <motion.span
              key={current}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="text-7xl leading-none font-black"
            >
              {current}
            </motion.span>
            <span className="mb-2 text-xl text-blue-200">días</span>
          </div>

          {isFrozen && (
            <div className="mt-2 flex items-center gap-1.5 text-blue-100">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-300" />
              <span className="text-sm">
                ❄️ Racha congelada · {frozenDays} día{frozenDays === 1 ? '' : 's'}
              </span>
            </div>
          )}
          {isLost && <p className="mt-2 text-sm text-blue-100">Empecemos de nuevo 🌱</p>}

          <div className="mt-2 flex items-center gap-1 text-blue-300">
            <Trophy size={14} />
            <span className="text-sm">
              Mejor racha: {best} días{bestLabel}
            </span>
          </div>
        </div>

        <div
          className="text-6xl select-none"
          style={isLost ? {} : { animation: 'var(--animate-flame)' }}
        >
          {isLost ? '🥀' : '🔥'}
        </div>
      </div>
    </motion.div>
  );
}
