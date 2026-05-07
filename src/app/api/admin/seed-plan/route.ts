import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type DayInput = {
  day: number;
  date: string;
  readings: { order: number; bookAbbr: string; bookFull: string; reference: string }[];
  youtubeVideoId?: string;
};

type Body = {
  month: number;
  year: number;
  title: string;
  missionText?: string;
  days: DayInput[];
};

export async function POST(req: NextRequest) {
  const body: Body = await req.json();
  const { month, year, title, missionText, days } = body;

  const plan = await prisma.devotionalPlan.upsert({
    where: { month_year: { month, year } },
    update: { title, missionText },
    create: { month, year, title, missionText },
  });

  for (const d of days) {
    const entry = await prisma.dailyEntry.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber: d.day } },
      update: {
        date: new Date(d.date),
        rawReadings: d.readings.map((r) => r.reference).join(', '),
        youtubeVideoId: d.youtubeVideoId ?? null,
      },
      create: {
        planId: plan.id,
        dayNumber: d.day,
        date: new Date(d.date),
        rawReadings: d.readings.map((r) => r.reference).join(', '),
        youtubeVideoId: d.youtubeVideoId ?? null,
      },
    });

    await prisma.reading.deleteMany({ where: { dailyEntryId: entry.id } });
    await prisma.reading.createMany({
      data: d.readings.map((r) => ({ ...r, dailyEntryId: entry.id })),
    });
  }

  return NextResponse.json({ ok: true, planId: plan.id });
}
