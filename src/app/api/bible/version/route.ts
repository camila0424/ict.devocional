import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  version: z.enum(['RVR1960', 'NTV']),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bibleVersion: true },
  });

  return Response.json({ success: true, data: { bibleVersion: user?.bibleVersion ?? 'RVR1960' } });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { success: false, error: 'Datos inválidos', code: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { bibleVersion: parsed.data.version },
    select: { bibleVersion: true },
  });

  return Response.json({ success: true, data: { bibleVersion: user.bibleVersion } });
}
