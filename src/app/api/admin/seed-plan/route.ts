import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type EntryInput = {
  day: number;
  readings: string[];
};

type Body = {
  month: number;
  year: number;
  visionText?: string | null;
  strategyText?: string | null;
  entries: EntryInput[];
};

// Splits "He 14", "1 Sam 1:1-2:11", "Salm 42" into { bookAbbr, reference }
// so DevotionalClient can reassemble "${bookAbbr} ${reference}" correctly.
function splitReading(raw: string): { bookAbbr: string; reference: string } {
  const parts = raw.trim().split(' ');
  if (parts[0] && /^\d$/.test(parts[0])) {
    return {
      bookAbbr: `${parts[0]} ${parts[1] ?? ''}`.trim(),
      reference: parts.slice(2).join(' '),
    };
  }
  return {
    bookAbbr: parts[0] ?? '',
    reference: parts.slice(1).join(' '),
  };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const body: Body = await req.json();
  const { month, year, visionText, strategyText, entries } = body;

  if (!month || !year) {
    return NextResponse.json(
      { error: 'month y year son requeridos' },
      { status: 400, headers: CORS },
    );
  }
  if (!Array.isArray(entries)) {
    return NextResponse.json(
      { error: 'entries debe ser un array' },
      { status: 400, headers: CORS },
    );
  }

  const plan = await prisma.devotionalPlan.upsert({
    where: { month_year: { month, year } },
    update: { visionText: visionText ?? undefined, strategyText: strategyText ?? undefined },
    create: {
      month,
      year,
      title: `Plan devocional ${month}/${year}`,
      visionText: visionText ?? undefined,
      strategyText: strategyText ?? undefined,
    },
  });

  for (const e of entries) {
    const date = new Date(year, month - 1, e.day);
    const rawReadings = e.readings.join(', ');

    const entry = await prisma.dailyEntry.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber: e.day } },
      update: { date, rawReadings },
      create: { planId: plan.id, dayNumber: e.day, date, rawReadings },
    });

    await prisma.reading.deleteMany({ where: { dailyEntryId: entry.id } });
    await prisma.reading.createMany({
      data: e.readings.map((ref, i) => {
        const { bookAbbr, reference } = splitReading(ref);
        return {
          dailyEntryId: entry.id,
          order: i + 1,
          reference,
          bookAbbr,
          bookFull: bookAbbr,
        };
      }),
    });
  }

  return NextResponse.json({ success: true, planId: plan.id }, { headers: CORS });
}
