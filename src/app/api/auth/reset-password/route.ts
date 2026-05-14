import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request): Promise<NextResponse<ApiResponse<null>>> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ success: true, data: null });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'ICT Devocional <noreply@ict-devocional.vercel.app>',
    to: email,
    subject: 'Recupera tu contraseña — ICT Devocional',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6d28d9">Recupera tu contraseña</h2>
        <p>Hola ${user.name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Cambiar contraseña
        </a>
        <p style="color:#6b7280;font-size:14px">Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, data: null });
}
