import { describe, it, expect } from 'vitest';
import { computeStreakOnComplete, refreshStreakOnLoad } from './streak-engine';

describe('streak-engine', () => {
  it('inicia en 1 si nunca completó', () => {
    const result = computeStreakOnComplete(
      { current: 0, best: 0, lastCompletedAt: null },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('suma 1 si completó ayer', () => {
    const result = computeStreakOnComplete(
      { current: 5, best: 10, lastCompletedAt: new Date('2026-05-04') },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(6);
  });

  it('es idempotente si ya completó hoy', () => {
    const state = { current: 5, best: 10, lastCompletedAt: new Date('2026-05-05T08:00:00') };
    const result = computeStreakOnComplete(state, new Date('2026-05-05T20:00:00'));
    expect(result.current).toBe(5);
  });

  it('reinicia a 1 si pasaron 2+ días', () => {
    const result = computeStreakOnComplete(
      { current: 7, best: 7, lastCompletedAt: new Date('2026-05-02') },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(1);
    expect(result.best).toBe(7);
  });

  it('mantiene best al reiniciar', () => {
    const result = computeStreakOnComplete(
      { current: 3, best: 15, lastCompletedAt: new Date('2026-05-01') },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(1);
    expect(result.best).toBe(15);
  });

  it('rompe la racha al cargar si pasaron 2+ días', () => {
    const result = refreshStreakOnLoad(
      { current: 7, best: 7, lastCompletedAt: new Date('2026-05-02') },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(0);
    expect(result.best).toBe(7);
  });

  it('mantiene racha si completó ayer al cargar', () => {
    const result = refreshStreakOnLoad(
      { current: 4, best: 10, lastCompletedAt: new Date('2026-05-04') },
      new Date('2026-05-05'),
    );
    expect(result.current).toBe(4);
  });
});
