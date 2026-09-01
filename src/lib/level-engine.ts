import { differenceInCalendarDays } from 'date-fns';

export const LEVEL_RESET_GRACE_DAYS = 15;

/**
 * El nivel (Semilla, Brote, Bambú...) se basa normalmente en el total de días
 * completados de toda la vida. Si pasan más de LEVEL_RESET_GRACE_DAYS días sin
 * completar un devocional, ese progreso vuelve a cero (Semilla) — el conteo de
 * "Días totales" de por vida no se toca, solo el punto desde el que se cuenta
 * para el nivel.
 */
export function shouldResetLevel(
  lastCompletedAt: Date | string | null,
  levelResetAt: Date | string | null,
  now: Date,
): boolean {
  if (!lastCompletedAt) return false;
  const last = new Date(lastCompletedAt);
  const diff = differenceInCalendarDays(now, last);
  if (diff <= LEVEL_RESET_GRACE_DAYS) return false;
  // Ya se contabilizó este hueco de inactividad (no hubo un nuevo completado desde entonces).
  if (levelResetAt && new Date(levelResetAt) >= last) return false;
  return true;
}
