'use client';

import { useState } from 'react';
import { useIOSInstallStatus } from '@/hooks/useIOSInstallStatus';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function IOSInstallBanner() {
  const { isIOS, isStandalone } = useIOSInstallStatus();
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('ict-ios-install-dismissed-date') === todayKey(),
  );

  if (!isIOS || isStandalone || dismissed) return null;

  function handleDismiss() {
    localStorage.setItem('ict-ios-install-dismissed-date', todayKey());
    setDismissed(true);
  }

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-start gap-3 bg-white px-4 py-3 shadow-md">
      <span className="text-xl">📲</span>
      <p className="flex-1 text-xs leading-relaxed text-gray-700">
        Para recibir notificaciones en iPhone: toca <strong>Compartir</strong> ⬆️ en Safari, elige{' '}
        <strong>&quot;Añadir a pantalla de inicio&quot;</strong>, y abre ICT Devocional desde ese
        ícono para activarlas.
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Cerrar"
        className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}
