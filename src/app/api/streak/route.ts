import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { recalculateStreak } from '@/lib/streak-recalc';
import type { ApiResponse } from '@/types/api';

type StreakData = { current: number; best: number; lastCompletedAt: Date | null };

export async function GET(): Promise<NextResponse<ApiResponse<StreakData>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const data = await recalculateStreak(session.user.id);
  return NextResponse.json({ success: true, data });
}
