import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BIBLE_NAMES: Record<string, string> = {
  He: 'Hechos',
  Jos: 'Josué',
  Job: 'Job',
  Jue: 'Jueces',
  Salm: 'Salmos',
  Rut: 'Rut',
  Rom: 'Romanos',
  '1 Sam': '1 Samuel',
  '2 Sam': '2 Samuel',
  '1 Rey': '1 Reyes',
  '2 Rey': '2 Reyes',
};

const MAY_PLAN = [
  { day: 1, r1: 'He 14', r2: 'Jos 22', r3: 'Job 31' },
  { day: 2, r1: 'He 15:1-21', r2: 'Jos 23-24', r3: 'Job 32' },
  { day: 3, r1: 'He 15:22-41', r2: 'Jue 1', r3: 'Job 33' },
  { day: 4, r1: 'He 16:1-15', r2: 'Jue 2-3', r3: 'Job 34' },
  { day: 5, r1: 'He 16:16-40', r2: 'Jue 4-5', r3: 'Job 35' },
  { day: 6, r1: 'He 17:1-15', r2: 'Jue 6', r3: 'Job 36' },
  { day: 7, r1: 'He 17:16-34', r2: 'Jue 7-8', r3: 'Job 37' },
  { day: 8, r1: 'He 18', r2: 'Jue 9', r3: 'Job 38' },
  { day: 9, r1: 'He 19:1-20', r2: 'Jue 10:1-11:33', r3: 'Job 39' },
  { day: 10, r1: 'He 19:21-41', r2: 'Jue 11:34-12:15', r3: 'Job 40' },
  { day: 11, r1: 'He 20:1-16', r2: 'Jue 13', r3: 'Job 41' },
  { day: 12, r1: 'He 20:17-38', r2: 'Jue 14-15', r3: 'Job 42' },
  { day: 13, r1: 'He 21:1-36', r2: 'Jue 16', r3: 'Salm 42' },
  { day: 14, r1: 'He 21:37-22:29', r2: 'Jue 17-18', r3: 'Salm 43' },
  { day: 15, r1: 'He 22:30-23:22', r2: 'Jue 19', r3: 'Salm 44' },
  { day: 16, r1: 'He 23:23-24:9', r2: 'Jue 20', r3: 'Salm 45' },
  { day: 17, r1: 'He 24:10-27', r2: 'Jue 21', r3: 'Salm 46' },
  { day: 18, r1: 'He 25', r2: 'Rut 1-2', r3: 'Salm 47' },
  { day: 19, r1: 'He 26:1-18', r2: 'Rut 3-4', r3: 'Salm 48' },
  { day: 20, r1: 'He 26:19-32', r2: '1 Sam 1:1-2:11', r3: 'Salm 49' },
  { day: 21, r1: 'He 27:1-12', r2: '1 Sam 2:12-36', r3: 'Salm 50' },
  { day: 22, r1: 'He 27:13-44', r2: '1 Sam 3', r3: 'Salm 51' },
  { day: 23, r1: 'He 28:1-15', r2: '1 Sam 4-5', r3: 'Salm 52' },
  { day: 24, r1: 'He 28:16-31', r2: '1 Sam 6-7', r3: 'Salm 53' },
  { day: 25, r1: 'Rom 1:1-15', r2: '1 Sam 8', r3: 'Salm 54' },
  { day: 26, r1: 'Rom 1:16-32', r2: '1 Sam 9:1-10:16', r3: 'Salm 55' },
  { day: 27, r1: 'Rom 2:1-3:8', r2: '1 Sam 10:17-11:15', r3: 'Salm 56' },
  { day: 28, r1: 'Rom 3:9-31', r2: '1 Sam 12', r3: 'Salm 57' },
  { day: 29, r1: 'Rom 4', r2: '1 Sam 13', r3: 'Salm 58' },
  { day: 30, r1: 'Rom 5', r2: '1 Sam 14', r3: 'Salm 59' },
  { day: 31, r1: 'Rom 6', r2: '1 Sam 15', r3: 'Salm 60' },
];

function parseReading(raw: string, order: number) {
  const trimmed = raw.trim();
  const parts = trimmed.split(' ');
  let bookAbbr: string;
  let reference: string;

  // Maneja abreviaturas con número prefijo: "1 Sam", "2 Sam", etc.
  if (parts[0] && /^\d$/.test(parts[0])) {
    bookAbbr = `${parts[0]} ${parts[1] ?? ''}`.trim();
    reference = parts.slice(2).join(' ');
  } else {
    bookAbbr = parts[0] ?? '';
    reference = parts.slice(1).join(' ');
  }

  const bookFull = BIBLE_NAMES[bookAbbr] ?? bookAbbr;
  return { order, bookAbbr, bookFull, reference };
}

async function main() {
  const plan = await prisma.devotionalPlan.upsert({
    where: { month_year: { month: 5, year: 2026 } },
    update: {},
    create: { month: 5, year: 2026, title: 'Mayo 2026 — Guía devocional ICT' },
  });

  for (const { day, r1, r2, r3 } of MAY_PLAN) {
    const date = new Date(2026, 4, day); // mes 4 = Mayo (0-indexed)
    const rawReadings = `${r1} / ${r2} / ${r3}`;

    await prisma.dailyEntry.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber: day } },
      update: {},
      create: {
        planId: plan.id,
        dayNumber: day,
        date,
        rawReadings,
        readings: {
          create: [parseReading(r1, 1), parseReading(r2, 2), parseReading(r3, 3)],
        },
      },
    });
  }

  console.log(`✅ Seed completado: Plan Mayo 2026 con ${MAY_PLAN.length} días`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
