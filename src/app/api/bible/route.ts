import { NextRequest, NextResponse } from 'next/server';
import { BOOK_MAP } from '@/lib/bible-api';

// YouVersion bible IDs — sourced from bible.com/versions/<id>
const VERSION_IDS: Record<string, number> = {
  rvr1960: 149,
  ntv: 127,
  tla: 176,
  blp: 210,
};

const BOOK_MAP_CI: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_MAP).map(([k, v]) => [k.toLowerCase(), v]),
);

function parseRef(ref: string): {
  bookCode: string;
  displayBook: string;
  chapter: number;
  startVerse: number;
  endVerse: number | null;
} | null {
  const decoded = decodeURIComponent(ref).replace(/\+/g, ' ');

  // "Book N:S-E" → single chapter, verse range
  const matchVerse = decoded.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  // "Book N-M" → multi-chapter whole
  const matchChapterRange = decoded.match(/^(.*?)\s+(\d+)-(\d+)$/);
  // "Book N" → whole chapter
  const matchChapter = decoded.match(/^(.*?)\s+(\d+)$/);

  let bookRaw: string;
  let chapter: number;
  let startVerse: number;
  let endVerse: number | null;

  if (matchVerse) {
    bookRaw = matchVerse[1]!;
    chapter = parseInt(matchVerse[2]!, 10);
    startVerse = parseInt(matchVerse[3]!, 10);
    endVerse = matchVerse[4] ? parseInt(matchVerse[4], 10) : startVerse;
  } else if (matchChapterRange) {
    // Multi-chapter: treat as chapter=first, full range
    bookRaw = matchChapterRange[1]!;
    chapter = parseInt(matchChapterRange[2]!, 10);
    startVerse = 1;
    endVerse = null;
  } else if (matchChapter) {
    bookRaw = matchChapter[1]!;
    chapter = parseInt(matchChapter[2]!, 10);
    startVerse = 1;
    endVerse = null;
  } else {
    return null;
  }

  const trimmedBook = bookRaw.trim();
  const bookCode =
    BOOK_MAP[trimmedBook] ?? BOOK_MAP_CI[trimmedBook.toLowerCase()] ?? trimmedBook.toUpperCase();

  return { bookCode, displayBook: trimmedBook, chapter, startVerse, endVerse };
}

function toUsfm(
  bookCode: string,
  chapter: number,
  startVerse: number,
  endVerse: number | null,
): string {
  const base = `${bookCode}.${chapter}`;
  if (endVerse === null) return base;
  if (endVerse === startVerse) return `${base}.${startVerse}`;
  return `${base}.${startVerse}-${bookCode}.${chapter}.${endVerse}`;
}

type YouVersionVerse = {
  usfm: string;
  text: string;
};

type YouVersionPassageResponse = {
  verses?: YouVersionVerse[];
  passage?: string;
  canonical?: string;
};

export async function GET(req: NextRequest) {
  if (!process.env.YOUVERSION_API_KEY) {
    return NextResponse.json({ error: 'Missing YOUVERSION_API_KEY' }, { status: 500 });
  }

  const refParam = req.nextUrl.searchParams.get('ref');
  if (!refParam) {
    return NextResponse.json({ error: 'Falta parámetro ref' }, { status: 400 });
  }

  const versionParam = (req.nextUrl.searchParams.get('version') ?? 'rvr1960').toLowerCase();
  const bibleId = VERSION_IDS[versionParam] ?? VERSION_IDS.rvr1960!;

  const parsed = parseRef(refParam);
  if (!parsed) {
    return NextResponse.json({ error: 'Referencia bíblica inválida' }, { status: 400 });
  }

  const { bookCode, displayBook, chapter, startVerse, endVerse } = parsed;
  const usfm = toUsfm(bookCode, chapter, startVerse, endVerse);

  const apiUrl = `https://api.youversion.com/v1/bibles/${bibleId}/passages/${encodeURIComponent(usfm)}`;

  const res = await fetch(apiUrl, {
    headers: { 'X-YVP-App-Key': process.env.YOUVERSION_API_KEY },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)');
    console.error('[bible] YouVersion error', res.status, usfm, errBody);
    return NextResponse.json(
      { error: `YouVersion API error ${res.status}`, detail: errBody },
      { status: 502 },
    );
  }

  const data = (await res.json()) as YouVersionPassageResponse;

  let text: string;

  if (data.verses && data.verses.length > 0) {
    text = data.verses
      .map((v) => {
        const verseNum = v.usfm.split('.')[2] ?? '';
        return verseNum ? `${verseNum} ${v.text.trim()}` : v.text.trim();
      })
      .join(' ');
  } else if (data.passage) {
    text = data.passage.trim();
  } else {
    return NextResponse.json({ error: 'Versos no encontrados' }, { status: 404 });
  }

  const reference =
    endVerse === null
      ? `${displayBook} ${chapter}`
      : endVerse === startVerse
        ? `${displayBook} ${chapter}:${startVerse}`
        : `${displayBook} ${chapter}:${startVerse}-${endVerse}`;

  return NextResponse.json({ text, reference });
}
