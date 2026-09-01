import { differenceInCalendarDays, startOfDay } from 'date-fns';

export const STREAK_GRACE_DAYS = 2;

export interface StreakState {
  current: number;
  best: number;
  lastCompletedAt: Date | null;
}

export type StreakDisplayState = 'alive' | 'frozen' | 'lost' | 'none';

/**
 * Estado visual de la racha para la UI (independiente de si ya se persistió
 * el reseteo en la base de datos). Gracia de STREAK_GRACE_DAYS días: se
 * "congela" mientras faltan 1-2 días, se pierde al llegar al 3ro.
 */
export function getStreakDisplayState(
  lastCompletedAt: Date | string | null,
  now: Date,
): { state: StreakDisplayState; frozenDays: number } {
  if (!lastCompletedAt) return { state: 'none', frozenDays: 0 };
  const diff = differenceInCalendarDays(startOfDay(now), startOfDay(new Date(lastCompletedAt)));
  if (diff <= 0) return { state: 'alive', frozenDays: 0 };
  if (diff <= STREAK_GRACE_DAYS) return { state: 'frozen', frozenDays: diff };
  return { state: 'lost', frozenDays: 0 };
}

/**
 * Calcula el nuevo estado de racha cuando el usuario completa el devocional.
 * Reglas MVP (gracia de UN día):
 * - Sin historial → empieza en 1
 * - Completó ayer → +1
 * - Completó hoy mismo → idempotente (sin cambio)
 * - 2+ días sin completar → reinicia a 1
 */
export function computeStreakOnComplete(state: StreakState, now: Date): StreakState {
  const today = startOfDay(now);

  if (!state.lastCompletedAt) {
    return { current: 1, best: Math.max(state.best, 1), lastCompletedAt: today };
  }

  const last = startOfDay(state.lastCompletedAt);
  const diff = differenceInCalendarDays(today, last);

  if (diff === 0) return state;
  if (diff === 1) {
    const next = state.current + 1;
    return { current: next, best: Math.max(state.best, next), lastCompletedAt: today };
  }
  return { current: 1, best: state.best, lastCompletedAt: today };
}

/**
 * Verifica al cargar la app si la racha sigue viva.
 * Con gracia de STREAK_GRACE_DAYS días: se rompe solo al superarla.
 */
export function refreshStreakOnLoad(state: StreakState, now: Date): StreakState {
  if (!state.lastCompletedAt || state.current === 0) return state;
  const today = startOfDay(now);
  const last = startOfDay(state.lastCompletedAt);
  const diff = differenceInCalendarDays(today, last);
  if (diff > STREAK_GRACE_DAYS) return { ...state, current: 0 };
  return state;
}
