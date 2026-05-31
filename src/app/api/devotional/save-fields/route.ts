import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { dailyEntryId, ...fields } = parsed.data;
  const userId = session.user.id;

  await prisma.devotionalResponse.upsert({
    where: { userId_dailyEntryId: { userId, dailyEntryId } },
    update: fields,
    create: { userId, dailyEntryId, ...fields },
  });

  return NextResponse.json({ success: true });
}
