'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReminderPicker() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('07:00');

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell size={18} className="text-[var(--color-primary)]" />
          ) : (
            <BellOff size={18} className="text-muted" />
          )}
          <h2 className="font-bold">Recordatorio diario</h2>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors duration-200',
            enabled ? 'bg-[var(--color-primary)]' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
              enabled ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </button>
      </div>

      {enabled ? (
        <div className="mt-4">
          <p className="text-muted mb-2 text-xs">Hora del recordatorio</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border-border bg-background w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
          />
          <p className="text-muted mt-2 text-center text-xs">
            Recibirás un recordatorio a las {time} cada día
          </p>
        </div>
      ) : (
        <p className="text-muted mt-1 text-xs">
          Activa para recibir un recordatorio diario de tu devocional
        </p>
      )}
    </div>
  );
}
