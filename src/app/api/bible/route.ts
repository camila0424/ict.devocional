import { NextRequest, NextResponse } from 'next/server';
import { BOOK_MAP } from '@/lib/bible-api';

function parseRef(
  ref: string,
): { book: string; chapter: number; startVerse: number; endVerse: number } | null {
  const decoded = decodeURIComponent(ref).replace(/\+/g, ' ');
  const match = decoded.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const [, bookRaw, chapterStr, startStr, endStr] = match;
  if (!bookRaw || !chapterStr || !startStr) return null;
  const bookCode = BOOK_MAP[bookRaw.trim()] ?? bookRaw.trim().toUpperCase();
  return {
    book: bookCode,
    chapter: parseInt(chapterStr, 10),
    startVerse: parseInt(startStr, 10),
    endVerse: endStr ? parseInt(endStr, 10) : parseInt(startStr, 10),
  };
}

export async function GET(req: NextRequest) {
  const refParam = req.nextUrl.searchParams.get('ref');
  if (!refParam) {
    return NextResponse.json({ error: 'Falta parámetro ref' }, { status: 400 });
  }

  const parsed = parseRef(refParam);
  if (!parsed) {
    return NextResponse.json({ error: 'Referencia bíblica inválida' }, { status: 400 });
  }

  const { book, chapter, startVerse, endVerse } = parsed;
  const url = `https://bible.helloao.org/api/RVR1960/${book}/${chapter}.json`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: 'No se pudo cargar el texto bíblico' }, { status: 502 });
  }

  const data = (await res.json()) as {
    chapter?: { number: number };
    verses?: { number: number; text: string }[];
  };

  if (!data.verses) {
    return NextResponse.json({ error: 'Texto no disponible' }, { status: 502 });
  }

  const filtered = data.verses
    .filter((v) => v.number >= startVerse && v.number <= endVerse)
    .map((v) => v.text.trim())
    .join(' ');

  if (!filtered) {
    return NextResponse.json(
      { error: 'Versos no encontrados en el rango indicado' },
      { status: 404 },
    );
  }

  const reference = `${book} ${chapter}:${startVerse}${endVerse !== startVerse ? `-${endVerse}` : ''}`;
  return NextResponse.json({ text: filtered, reference });
}
