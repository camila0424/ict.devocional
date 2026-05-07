import { NextRequest, NextResponse } from 'next/server';
import { sendReminders } from '@/lib/send-reminders';

// UTC hours → turno (Colombia = UTC-5)
// 12 UTC = 7am COL → mañana
// 18 UTC = 1pm COL → tarde
//  1 UTC = 8pm COL → noche
const HOUR_TO_TURNO: Record<number, 'mañana' | 'tarde' | 'noche'> = {
  12: 'mañana',
  18: 'tarde',
  1: 'noche',
};

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const turno = HOUR_TO_TURNO[new Date().getUTCHours()];
  if (!turno) {
    return NextResponse.json({ error: 'No turno for this hour' }, { status: 400 });
  }

  const result = await sendReminders(turno);
  return NextResponse.json(result);
}
