import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';
import type { SavedVerse } from '@prisma/client';

const saveSchema = z.object({
  bookKey: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  versionKey: z.string().min(1),
});

export async function GET(): Promise<NextResponse<ApiResponse<SavedVerse[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const savedVerses = await prisma.savedVerse.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: savedVerses });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<SavedVerse>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { bookKey, chapter, verse, versionKey } = parsed.data;
  const userId = session.user.id;

  const savedVerse = await prisma.savedVerse.upsert({
    where: {
      userId_bookKey_chapter_verse_versionKey: { userId, bookKey, chapter, verse, versionKey },
    },
    update: {},
    create: { userId, bookKey, chapter, verse, versionKey },
  });

  return NextResponse.json({ success: true, data: savedVerse }, { status: 201 });
}
