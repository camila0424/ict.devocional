import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateReading } from '@/lib/bible-books';
import { splitReading } from '@/lib/bible-book-aliases';

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
  visionTitle?: string | null;
  visionText?: string | null;
  strategyTitle?: string | null;
  strategyText?: string | null;
  entries: EntryInput[];
};

// La imagen trae a veces las tres lecturas del día en un solo campo: "Ap 1 / Neh 1-2 / Sal 96"
function readingsOf(entry: EntryInput): string[] {
  return entry.readings
    .flatMap((r) => r.split('/'))
    .map((r) => r.trim())
    .filter(Boolean);
}

// Separa "He 14", "1 Sam 1:1-2:11", "Salm 42" en { bookAbbr, reference } (corrigiendo erratas
// como "Mar 4 1-20") para que DevotionalClient pueda recomponer "${bookAbbr} ${reference}".
function toReadingFields(raw: string): { bookAbbr: string; reference: string } {
  const split = splitReading(raw);
  return split
    ? { bookAbbr: split.book, reference: split.reference }
    : { bookAbbr: raw, reference: '' };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const body: Body = await req.json();
  const { month, year, visionTitle, visionText, strategyTitle, strategyText, entries } = body;

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

  // No se guarda nada si alguna lectura no se podría abrir en la app
  const invalid = entries.flatMap((e) =>
    readingsOf(e).flatMap((raw) => {
      const { bookAbbr, reference } = toReadingFields(raw);
      const error = validateReading(`${bookAbbr} ${reference}`.trim());
      return error ? [`Día ${e.day}: "${raw}" → ${error}`] : [];
    }),
  );
  if (invalid.length > 0) {
    return NextResponse.json(
      {
        error: `Hay ${invalid.length} lectura(s) que la app no puede abrir. Corrígelas y vuelve a subir:\n${invalid.join('\n')}`,
        invalid,
      },
      { status: 422, headers: CORS },
    );
  }

  const plan = await prisma.devotionalPlan.upsert({
    where: { month_year: { month, year } },
    update: {
      visionTitle: visionTitle ?? undefined,
      visionText: visionText ?? undefined,
      strategyTitle: strategyTitle ?? undefined,
      strategyText: strategyText ?? undefined,
    },
    create: {
      month,
      year,
      title: `Plan devocional ${month}/${year}`,
      visionTitle: visionTitle ?? undefined,
      visionText: visionText ?? undefined,
      strategyTitle: strategyTitle ?? undefined,
      strategyText: strategyText ?? undefined,
    },
  });

  for (const e of entries) {
    const date = new Date(year, month - 1, e.day);
    const readings = readingsOf(e);
    const rawReadings = readings.join(', ');

    const entry = await prisma.dailyEntry.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber: e.day } },
      update: { date, rawReadings },
      create: { planId: plan.id, dayNumber: e.day, date, rawReadings },
    });

    await prisma.reading.deleteMany({ where: { dailyEntryId: entry.id } });
    await prisma.reading.createMany({
      data: readings.map((ref, i) => {
        const { bookAbbr, reference } = toReadingFields(ref);
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
