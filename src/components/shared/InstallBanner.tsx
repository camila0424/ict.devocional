'use client';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
  const { visible, install, dismiss } = useInstallPrompt();

  if (!visible) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-center gap-3 bg-white px-4 py-2 shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" width={32} height={32} alt="ICT" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-none font-bold text-gray-900">ICT Devocional</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">ict-devocional.vercel.app</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-md bg-[#1E40AF] px-3 py-1.5 text-xs font-semibold text-white"
      >
        Instalar
      </button>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}
