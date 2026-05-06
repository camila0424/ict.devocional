'use client';

import { useReducer, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/types/api';

export type ProgressData = {
  month: number;
  year: number;
  daysInMonth: number;
  completedDays: number[];
  streak: { current: number; best: number };
  stats: {
    totalCompleted: number;
    completedThisMonth: number;
    bestStreak: number;
    percentageMonth: number;
  };
  last7Days: Array<{ dayNumber: number; date: string; completed: boolean }>;
};

type State = {
  data: ProgressData | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: ProgressData }
  | { type: 'ERROR'; error: string };

const INIT: State = { data: null, isLoading: true, error: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SUCCESS':
      return { data: action.data, isLoading: false, error: null };
    case 'ERROR':
      return { ...state, isLoading: false, error: action.error };
    default:
      return state;
  }
}

export function useProgress(yearMonth: string) {
  const [state, dispatch] = useReducer(reducer, INIT);

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await fetch(`/api/progress/${yearMonth}`);
      const json = (await res.json()) as ApiResponse<ProgressData>;
      if (!json.success) {
        dispatch({ type: 'ERROR', error: json.error });
        return;
      }
      dispatch({ type: 'SUCCESS', data: json.data });
    } catch {
      dispatch({ type: 'ERROR', error: 'Error al cargar el progreso' });
    }
  }, [yearMonth]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  return { data: state.data, isLoading: state.isLoading, error: state.error, refetch: load };
}
