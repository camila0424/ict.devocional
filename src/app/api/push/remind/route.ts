import { NextRequest, NextResponse } from 'next/server';
import { sendReminders } from '@/lib/send-reminders';

function vapidConfigured() {
  return (
    process.env.VAPID_SUBJECT &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );
}

function parseTurno(value: string | null): 'mañana' | 'tarde' | 'noche' | null {
  if (value === 'mañana' || value === 'tarde' || value === 'noche') return value;
  return null;
}

// Called by Vercel cron jobs — GET with Authorization: Bearer CRON_SECRET
export async function GET(req: NextRequest) {
  if (!vapidConfigured()) {
    return NextResponse.json(
      { error: 'VAPID environment variables are not configured' },
      { status: 500 },
    );
  }

  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const turno = parseTurno(req.nextUrl.searchParams.get('turno'));
  if (!turno) {
    return NextResponse.json({ error: 'Invalid or missing turno' }, { status: 400 });
  }

  const result = await sendReminders(turno);
  return NextResponse.json(result);
}

// Called manually by admin — POST with X-Admin-Secret
export async function POST(req: NextRequest) {
  if (!vapidConfigured()) {
    return NextResponse.json(
      { error: 'VAPID environment variables are not configured' },
      { status: 500 },
    );
  }

  if (req.headers.get('X-Admin-Secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const turno = parseTurno(body?.turno);
  if (!turno) {
    return NextResponse.json({ error: 'Invalid turno' }, { status: 400 });
  }

  const result = await sendReminders(turno);
  return NextResponse.json(result);
}
