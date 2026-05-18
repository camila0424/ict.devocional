import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateStreak } from '@/lib/streak-recalc';
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

  // Marcar progreso del día — extraer componentes UTC para evitar offset de zona horaria
  const d = entry.date as Date;
  const dateOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  await prisma.userProgress.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    update: { completed: true },
    create: { userId, date: dateOnly, completed: true },
  });

  // Actualizar racha recalculando desde user_progress
  const newStreak = await recalculateStreak(userId);

  return NextResponse.json({ success: true, data: { streak: newStreak.current } });
}
