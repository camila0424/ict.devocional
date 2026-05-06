'use client';

import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

type Props = {
  current: number;
  best: number;
};

export function StreakCard({ current, best }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="rounded-2xl p-6 text-white shadow-lg"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-blue-200">Racha actual</p>
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
          <div className="mt-2 flex items-center gap-1 text-blue-300">
            <Trophy size={14} />
            <span className="text-sm">Mejor racha: {best} días</span>
          </div>
        </div>

        <div className="text-6xl select-none" style={{ animation: 'var(--animate-flame)' }}>
          🔥
        </div>
      </div>
    </motion.div>
  );
}
