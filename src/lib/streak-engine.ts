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

const DAY_MS = 24 * 60 * 60 * 1000;
const toDayIndex = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`) / DAY_MS;
const fromDayIndex = (idx: number) => new Date(idx * DAY_MS).toISOString().slice(0, 10);

/**
 * Días sin completar que no rompieron la racha ("congelados"), con la misma regla que
 * recalculateStreak: un hueco de hasta STREAK_GRACE_DAYS días entre dos días completados, o
 * los días ya pasados desde el último completado mientras la racha siga congelada.
 * Fechas en formato YYYY-MM-DD; `today` no se marca porque aún se puede completar.
 */
export function getFrozenDates(completedDates: string[], today: string): string[] {
  const days = [...new Set(completedDates)].map(toDayIndex).sort((a, b) => a - b);
  const todayIdx = toDayIndex(today);
  const frozen: string[] = [];

  const addRange = (from: number, to: number) => {
    for (let d = from; d <= to; d++) frozen.push(fromDayIndex(d));
  };

  for (let i = 1; i < days.length; i++) {
    const missed = days[i]! - days[i - 1]! - 1;
    if (missed > 0 && missed <= STREAK_GRACE_DAYS) addRange(days[i - 1]! + 1, days[i]! - 1);
  }

  const last = days[days.length - 1];
  if (last !== undefined && last < todayIdx && todayIdx - last <= STREAK_GRACE_DAYS) {
    addRange(last + 1, todayIdx - 1);
  }

  return frozen;
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
