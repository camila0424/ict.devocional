'use client';

import { useReducer, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/types/api';

export type ProgressHistoryData = {
  months: Array<{
    month: number;
    year: number;
    label: string;
    totalDays: number;
    completedDays: number;
    isCurrent: boolean;
  }>;
};

type State = {
  data: ProgressHistoryData | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; data: ProgressHistoryData }
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

export function useProgressHistory() {
  const [state, dispatch] = useReducer(reducer, INIT);

  const load = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const res = await fetch('/api/progress/history');
      const json = (await res.json()) as ApiResponse<ProgressHistoryData>;
      if (!json.success) {
        dispatch({ type: 'ERROR', error: json.error });
        return;
      }
      dispatch({ type: 'SUCCESS', data: json.data });
    } catch {
      dispatch({ type: 'ERROR', error: 'Error al cargar el historial' });
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  return { data: state.data, isLoading: state.isLoading, error: state.error, refetch: load };
}
