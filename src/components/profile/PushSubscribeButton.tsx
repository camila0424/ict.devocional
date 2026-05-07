'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export function PushSubscribeButton() {
  const { status, subscribe, unsubscribe } = usePushSubscription();

  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  if (status === 'denied') {
    return (
      <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-4 text-sm text-(--color-muted)">
        <BellOff size={18} />
        <span>Notificaciones bloqueadas. Actívalas desde ajustes del navegador.</span>
      </div>
    );
  }

  const isSubscribed = status === 'subscribed';
  const isLoading = status === 'loading';

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="border-primary-light bg-primary-light text-primary flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-colors hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isSubscribed ? (
        <BellOff size={18} />
      ) : (
        <Bell size={18} />
      )}
      {isLoading
        ? 'Procesando...'
        : isSubscribed
          ? 'Desactivar recordatorios'
          : 'Activar recordatorios'}
    </button>
  );
}
