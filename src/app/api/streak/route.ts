import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshStreakOnLoad } from '@/lib/streak-engine';
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

  const raw = await prisma.streak.findUnique({ where: { userId: session.user.id } });
  const state = {
    current: raw?.current ?? 0,
    best: raw?.best ?? 0,
    lastCompletedAt: raw?.lastCompletedAt ?? null,
  };

  const refreshed = refreshStreakOnLoad(state, new Date());

  // Persistir si la racha se rompió al cargar
  if (refreshed.current !== state.current && raw) {
    await prisma.streak.update({
      where: { userId: session.user.id },
      data: { current: refreshed.current },
    });
  }

  return NextResponse.json({ success: true, data: refreshed });
}
