import { NextRequest, NextResponse } from 'next/server';
import { sendReminders } from '@/lib/send-reminders';

export async function POST(req: NextRequest) {
  if (
    !process.env.VAPID_SUBJECT ||
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  ) {
    return NextResponse.json(
      { error: 'VAPID environment variables are not configured' },
      { status: 500 },
    );
  }

  if (req.headers.get('X-Admin-Secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const turno = body?.turno as 'mañana' | 'tarde' | 'noche';
  if (!['mañana', 'tarde', 'noche'].includes(turno)) {
    return NextResponse.json({ error: 'Invalid turno' }, { status: 400 });
  }

  const result = await sendReminders(turno);
  return NextResponse.json(result);
}
