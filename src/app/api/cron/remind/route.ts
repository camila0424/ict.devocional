import { NextRequest, NextResponse } from 'next/server';
import { sendReminders } from '@/lib/send-reminders';

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendReminders();
  return NextResponse.json(result);
}
