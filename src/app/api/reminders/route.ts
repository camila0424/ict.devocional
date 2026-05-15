import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reminder = await prisma.reminder.findUnique({
    where: { userId: session.user.id },
  });

  if (!reminder) {
    return NextResponse.json({ enabled: false, time: '07:00' });
  }

  const hour = String(reminder.hour).padStart(2, '0');
  const minute = String(reminder.minute).padStart(2, '0');
  return NextResponse.json({ enabled: reminder.enabled, time: `${hour}:${minute}` });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enabled, time } = await req.json();
  const [hour, minute] = (time as string).split(':').map(Number);

  await prisma.reminder.upsert({
    where: { userId: session.user.id },
    update: { enabled, hour, minute },
    create: { userId: session.user.id, enabled, hour, minute },
  });

  return NextResponse.json({ success: true });
}
