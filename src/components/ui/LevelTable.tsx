'use client';

import { motion } from 'motion/react';
import { useTotalDays } from '@/hooks/useTotalDays';
import { LEVELS, getCurrentLevel } from '@/lib/levels';

export function LevelTable() {
  const { totalDays } = useTotalDays();

  if (totalDays === null) {
    return <div className="border-border bg-surface h-64 animate-pulse rounded-2xl border" />;
  }

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
          <thead className="border-border bg-primary/5 border-b">
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
                    isCurrentLevel ? 'bg-primary/5' : ''
                  } hover:bg-primary/3 transition-colors`}
                >
                  <td className="px-4 py-3 text-xl">{level.emoji}</td>
                  <td className="px-4 py-3 font-medium">{level.name}</td>
                  <td className="text-muted px-4 py-3 text-center text-xs">
                    {level.minDays}-{level.maxDays === Infinity ? '∞' : level.maxDays}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCurrentLevel && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-primary inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                          Tú aquí
                        </span>
                        <span className="text-muted text-xs">{totalDays} días completados</span>
                      </div>
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
