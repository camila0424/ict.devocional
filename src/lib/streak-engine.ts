import { differenceInCalendarDays, startOfDay } from 'date-fns';

export interface StreakState {
  current: number;
  best: number;
  lastCompletedAt: Date | null;
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
 * Si pasaron 2+ días sin completar y current > 0, se rompe.
 */
export function refreshStreakOnLoad(state: StreakState, now: Date): StreakState {
  if (!state.lastCompletedAt || state.current === 0) return state;
  const today = startOfDay(now);
  const last = startOfDay(state.lastCompletedAt);
  const diff = differenceInCalendarDays(today, last);
  if (diff >= 2) return { ...state, current: 0 };
  return state;
}
