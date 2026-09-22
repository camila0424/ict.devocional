import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PASTEL_COLORS } from '@/lib/note-colors';
import type { ApiResponse } from '@/types/api';
import type { VerseNote } from '@prisma/client';

const noteSchema = z.object({
  bookKey: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  versionKey: z.string().min(1),
  noteText: z.string().min(1),
  color: z.enum(PASTEL_COLORS).default(PASTEL_COLORS[0]),
});

export async function GET(request: Request): Promise<NextResponse<ApiResponse<VerseNote[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const bookKey = searchParams.get('bookKey');

  const notes = await prisma.verseNote.findMany({
    where: { userId: session.user.id, ...(bookKey ? { bookKey } : {}) },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: notes });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<VerseNote>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { bookKey, chapter, verse, versionKey, noteText, color } = parsed.data;
  const userId = session.user.id;

  const note = await prisma.verseNote.create({
    data: { userId, bookKey, chapter, verse, versionKey, noteText, color },
  });

  return NextResponse.json({ success: true, data: note }, { status: 201 });
}
