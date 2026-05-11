import { NextRequest, NextResponse } from 'next/server';
import { BOOK_MAP } from '@/lib/bible-api';

const VERSION_IDS: Record<string, number> = {
  rvr1960: 149,
  ntv: 127,
  tla: 176,
  blp: 210,
};

const BOOK_MAP_CI: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_MAP).map(([k, v]) => [k.toLowerCase(), v]),
);

function parseRef(ref: string): { bookCode: string; usfm: string } | null {
  const decoded = decodeURIComponent(ref).replace(/\+/g, ' ').trim();

  const matchVerse = decoded.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  const matchChRange = decoded.match(/^(.*?)\s+(\d+)-(\d+)$/);
  const matchChapter = decoded.match(/^(.*?)\s+(\d+)$/);

  let bookRaw: string, usfm: string;

  if (matchVerse) {
    bookRaw = matchVerse[1]!.trim();
    const ch = matchVerse[2];
    const vs = matchVerse[3];
    const ve = matchVerse[4];
    const book = BOOK_MAP[bookRaw] ?? BOOK_MAP_CI[bookRaw.toLowerCase()] ?? bookRaw.toUpperCase();
    usfm = ve ? `${book}.${ch}.${vs}-${book}.${ch}.${ve}` : `${book}.${ch}.${vs}`;
  } else if (matchChRange) {
    bookRaw = matchChRange[1]!.trim();
    const ch1 = matchChRange[2];
    const ch2 = matchChRange[3];
    const book = BOOK_MAP[bookRaw] ?? BOOK_MAP_CI[bookRaw.toLowerCase()] ?? bookRaw.toUpperCase();
    usfm = `${book}.${ch1}-${book}.${ch2}`;
  } else if (matchChapter) {
    bookRaw = matchChapter[1]!.trim();
    const ch = matchChapter[2];
    const book = BOOK_MAP[bookRaw] ?? BOOK_MAP_CI[bookRaw.toLowerCase()] ?? bookRaw.toUpperCase();
    usfm = `${book}.${ch}`;
  } else {
    return null;
  }

  const bookCode = BOOK_MAP[bookRaw] ?? BOOK_MAP_CI[bookRaw.toLowerCase()] ?? bookRaw.toUpperCase();
  return { bookCode, usfm };
}

export async function GET(req: NextRequest) {
  if (!process.env.YOUVERSION_API_KEY) {
    return NextResponse.json({ error: 'Missing YOUVERSION_API_KEY' }, { status: 500 });
  }

  const refParam = req.nextUrl.searchParams.get('ref');
  if (!refParam) {
    return NextResponse.json({ error: 'Falta parámetro ref' }, { status: 400 });
  }

  const versionParam = (req.nextUrl.searchParams.get('version') ?? 'rvr1960').toLowerCase();
  const bibleId = VERSION_IDS[versionParam] ?? VERSION_IDS['rvr1960']!;

  const parsed = parseRef(refParam);
  if (!parsed) {
    return NextResponse.json({ error: 'Referencia bíblica inválida' }, { status: 400 });
  }

  // Endpoint correcto según documentación oficial YouVersion
  const apiUrl = `https://api.youversion.com/v1/bibles/${bibleId}/passages/${encodeURIComponent(parsed.usfm)}?format=text&include_headings=false&include_notes=false`;

  const res = await fetch(apiUrl, {
    headers: { 'X-YVP-App-Key': process.env.YOUVERSION_API_KEY },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)');
    console.error('[bible] YouVersion error', res.status, parsed.usfm, errBody);
    return NextResponse.json(
      { error: `YouVersion ${res.status}`, detail: errBody },
      { status: 502 },
    );
  }

  // La API devuelve { id, content, reference }
  const data = (await res.json()) as { id: string; content: string; reference: string };

  if (!data.content) {
    return NextResponse.json({ error: 'Sin contenido' }, { status: 404 });
  }

  return NextResponse.json({ text: data.content, reference: data.reference });
}
