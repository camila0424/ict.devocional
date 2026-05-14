'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export function PushSubscribeButton() {
  const { status, errorMessage, subscribe, unsubscribe } = usePushSubscription();

  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
        <BellOff size={18} className="shrink-0" />
        <span>
          {errorMessage ?? 'Notificaciones bloqueadas — actívalas en ajustes de tu navegador'}
        </span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
        <BellOff size={18} className="shrink-0" />
        <span>{errorMessage ?? 'Error al activar notificaciones'}</span>
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
        <div className="flex items-center gap-3 text-sm font-medium text-green-700 dark:text-green-400">
          <Bell size={18} className="shrink-0" />
          <span>Notificaciones activas ✓</span>
        </div>
        <button
          onClick={unsubscribe}
          className="text-xs font-semibold text-green-700 underline underline-offset-2 hover:opacity-75 dark:text-green-400"
        >
          Desactivar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="border-primary-light bg-primary-light text-primary flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-colors hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
      {status === 'loading' ? 'Procesando...' : 'Activar recordatorios'}
    </button>
  );
}
