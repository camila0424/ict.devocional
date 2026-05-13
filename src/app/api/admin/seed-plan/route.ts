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
        const abbr = ref.split(' ')[0] || ref;
        return {
          dailyEntryId: entry.id,
          order: i + 1,
          reference: ref,
          bookAbbr: abbr,
          bookFull: abbr,
        };
      }),
    });
  }

  return NextResponse.json({ success: true, planId: plan.id }, { headers: CORS });
}
