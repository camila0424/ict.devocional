'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ict:welcome-seen';
const CHANGE_EVENT = 'ict:welcome-seen-change';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function hasSeenWelcome() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true; // sin acceso a localStorage no podemos recordarlo: mejor no animar siempre
  }
}

// true mientras la persona no haya creado cuenta ni iniciado sesión en este dispositivo.
// En el servidor devuelve false para que el primer render coincida con el del cliente.
export function useFirstVisit() {
  const isFirstVisit = useSyncExternalStore(
    subscribe,
    () => !hasSeenWelcome(),
    () => false,
  );

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignorar: solo se pierde el recordatorio de la animación
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { isFirstVisit, markSeen };
}
