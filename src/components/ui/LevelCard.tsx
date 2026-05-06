'use client';

import { motion } from 'motion/react';
import {
  getCurrentLevel,
  getNextLevel,
  getDaysUntilNextLevel,
  getLevelProgress,
} from '@/lib/levels';

type Props = {
  totalDays: number;
};

export function LevelCard({ totalDays }: Props) {
  const currentLevel = getCurrentLevel(totalDays);
  const nextLevel = getNextLevel(totalDays);
  const daysUntilNext = getDaysUntilNextLevel(totalDays);
  const { current, max } = getLevelProgress(totalDays);
  const progressPercent = (current / max) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="border-border bg-surface rounded-2xl border p-5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{currentLevel.emoji}</span>
          <div>
            <p className="text-muted text-sm">Tu nivel</p>
            <p className="text-xl font-bold">{currentLevel.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-muted text-xs">Días totales</p>
          <p className="text-2xl font-black">{totalDays}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            {currentLevel.minDays}-{currentLevel.maxDays === Infinity ? '∞' : currentLevel.maxDays}{' '}
            días
          </span>
          {nextLevel && <span className="text-muted">Próximo: {nextLevel.name}</span>}
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-primary)]/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-[var(--color-primary)]"
          />
        </div>

        {nextLevel && (
          <p className="text-muted pt-1 text-center text-xs">
            {daysUntilNext} días para {nextLevel.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}
