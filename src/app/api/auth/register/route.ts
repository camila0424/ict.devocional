import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  console.log('DB URL:', process.env.DATABASE_URL?.slice(0, 50));
  const body: unknown = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El correo ya está registrado', code: 'EMAIL_TAKEN' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });

    await prisma.streak.create({
      data: { userId: user.id, current: 0, best: 0, lastCompletedAt: null },
    });

    return NextResponse.json({ success: true, data: { id: user.id } }, { status: 201 });
  } catch (error) {
    console.error('[register]', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
