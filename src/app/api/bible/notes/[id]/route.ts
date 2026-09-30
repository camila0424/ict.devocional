import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { VerseNote } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PASTEL_COLORS } from '@/lib/note-colors';
import type { ApiResponse } from '@/types/api';

const updateSchema = z.object({
  noteText: z.string().trim().min(1),
  color: z.enum(PASTEL_COLORS),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<VerseNote>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.verseNote.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Nota no encontrada', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }

  const note = await prisma.verseNote.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: note });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<null>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { id } = await params;

  const result = await prisma.verseNote.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { success: false, error: 'Nota no encontrada', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: null });
}
