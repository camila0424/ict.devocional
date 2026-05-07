import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeStreakOnComplete } from '@/lib/streak-engine';
import type { ApiResponse } from '@/types/api';

const completeSchema = z.object({
  dailyEntryId: z.string(),
  message: z.string().optional(),
  promise: z.string().optional(),
  commandment: z.string().optional(),
  wrongAttitudes: z.string().optional(),
  teotherapy: z.string().optional(),
  petition: z.string().optional(),
  gratitude: z.string().optional(),
  pending: z.string().optional(),
});

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<{ streak: number }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { dailyEntryId, ...sections } = parsed.data;
  const userId = session.user.id;
  const now = new Date();

  // Verificar que la entrada existe
  const entry = await prisma.dailyEntry.findUnique({ where: { id: dailyEntryId } });
  if (!entry) {
    return NextResponse.json(
      { success: false, error: 'Día no encontrado', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }

  // Guardar respuestas
  await prisma.devotionalResponse.upsert({
    where: { userId_dailyEntryId: { userId, dailyEntryId } },
    update: { ...sections, completedAt: now },
    create: { userId, dailyEntryId, ...sections, completedAt: now },
  });

  // Marcar progreso del día
  const dateOnly = new Date(entry.date);
  dateOnly.setHours(0, 0, 0, 0);

  await prisma.userProgress.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    update: { completed: true },
    create: { userId, date: dateOnly, completed: true },
  });

  // Actualizar racha
  const current = await prisma.streak.findUnique({ where: { userId } });
  const streakState = {
    current: current?.current ?? 0,
    best: current?.best ?? 0,
    lastCompletedAt: current?.lastCompletedAt ?? null,
  };

  const newStreak = computeStreakOnComplete(streakState, now);

  await prisma.streak.upsert({
    where: { userId },
    update: {
      current: newStreak.current,
      best: newStreak.best,
      lastCompletedAt: newStreak.lastCompletedAt,
    },
    create: {
      userId,
      current: newStreak.current,
      best: newStreak.best,
      lastCompletedAt: newStreak.lastCompletedAt,
    },
  });

  return NextResponse.json({ success: true, data: { streak: newStreak.current } });
}
