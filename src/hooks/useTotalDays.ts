'use client';

import { useState, useEffect } from 'react';

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useTotalDays() {
  const [totalDays, setTotalDays] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTotalDays() {
      try {
        const res = await fetch(`/api/progress/${currentYearMonth()}`);
        const json = await res.json();
        if (!cancelled && json.success) setTotalDays(json.data.stats.totalCompleted as number);
      } catch {
        // retain previous value on error
      }
    }

    void fetchTotalDays();
    const handler = () => {
      void fetchTotalDays();
    };
    window.addEventListener('devotional-completed', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('devotional-completed', handler);
    };
  }, []);

  return { totalDays };
}
