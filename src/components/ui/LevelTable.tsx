'use client';

import { motion } from 'motion/react';
import { LEVELS, getCurrentLevel } from '@/lib/levels';

type Props = {
  totalDays: number;
};

export function LevelTable({ totalDays }: Props) {
  const currentLevel = getCurrentLevel(totalDays);
  const currentIndex = LEVELS.indexOf(currentLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className="border-border bg-surface overflow-hidden rounded-2xl border"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-border border-b bg-[var(--color-primary)]/5">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nivel</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-center font-semibold">Rango de días</th>
              <th className="px-4 py-3 text-center font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {LEVELS.map((level, idx) => {
              const isCurrentLevel = idx === currentIndex;
              const isPassed = totalDays > level.maxDays;

              return (
                <motion.tr
                  key={level.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.26 + idx * 0.02 }}
                  className={`${
                    isCurrentLevel ? 'bg-[var(--color-primary)]/5' : ''
                  } transition-colors hover:bg-[var(--color-primary)]/3`}
                >
                  <td className="px-4 py-3 text-xl">{level.emoji}</td>
                  <td className="px-4 py-3 font-medium">{level.name}</td>
                  <td className="text-muted px-4 py-3 text-center text-xs">
                    {level.minDays}-{level.maxDays === Infinity ? '∞' : level.maxDays}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCurrentLevel && (
                      <span className="inline-block rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
                        Tú aquí
                      </span>
                    )}
                    {isPassed && !isCurrentLevel && <span className="inline-block text-lg">✓</span>}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
