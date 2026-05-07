'use client';

import { StreakCard } from '@/components/streak/StreakCard';
import { LevelCard } from '@/components/ui/LevelCard';
import { getFraseDelDia } from '@/constants/phrases';
import { useProgress } from '@/hooks/useProgress';

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function RightPanel() {
  const { data } = useProgress(currentYearMonth());
  const frase = getFraseDelDia();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 flex-col gap-4 overflow-y-auto bg-white px-4 py-6 shadow-[-1px_0_0_0_#e2e8f0] md:flex">
      {data ? (
        <StreakCard current={data.streak.current} best={data.streak.best} />
      ) : (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      )}

      <div
        className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)' }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-sm font-bold text-blue-900">Frase del día</h2>
        </div>
        <p className="text-xs leading-relaxed text-blue-800 italic">{frase}</p>
      </div>

      <LevelCard />
    </aside>
  );
}
