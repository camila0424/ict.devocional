import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BOOK_MAP } from '@/lib/bible-api';

type BibleData = {
  books: Record<string, Record<string, Record<string, string>>>;
};

const CODE_TO_JSON_KEY: Record<string, string> = {
  GEN: 'genesis',
  EXO: 'exodo',
  LEV: 'levitico',
  NUM: 'numeros',
  DEU: 'deuteronomio',
  JOS: 'josue',
  JDG: 'jueces',
  RUT: 'rut',
  '1SA': '1samuel',
  '2SA': '2samuel',
  '1KI': '1reyes',
  '2KI': '2reyes',
  '1CH': '1cronicas',
  '2CH': '2cronicas',
  EZR: 'esdras',
  NEH: 'nehemias',
  EST: 'ester',
  JOB: 'job',
  PSA: 'salmos',
  PRO: 'proverbios',
  ECC: 'eclesiastes',
  SNG: 'cantares',
  ISA: 'isaias',
  JER: 'jeremias',
  LAM: 'lamentaciones',
  EZK: 'ezequiel',
  DAN: 'daniel',
  HOS: 'oseas',
  JOL: 'joel',
  AMO: 'amos',
  OBA: 'abdias',
  JON: 'jonas',
  MIC: 'miqueas',
  NAM: 'nahum',
  HAB: 'habacuc',
  ZEP: 'sofonias',
  HAG: 'hageo',
  ZEC: 'zacarias',
  MAL: 'malaquias',
  MAT: 'mateo',
  MRK: 'marcos',
  LUK: 'lucas',
  JHN: 'juan',
  ACT: 'hechos',
  ROM: 'romanos',
  '1CO': '1corintios',
  '2CO': '2corintios',
  GAL: 'galatas',
  EPH: 'efesios',
  PHP: 'filipenses',
  COL: 'colosenses',
  '1TH': '1tesalonicenses',
  '2TH': '2tesalonicenses',
  '1TI': '1timoteo',
  '2TI': '2timoteo',
  TIT: 'tito',
  PHM: 'filemon',
  HEB: 'hebreos',
  JAS: 'santiago',
  '1PE': '1pedro',
  '2PE': '2pedro',
  '1JN': '1juan',
  '2JN': '2juan',
  '3JN': '3juan',
  JUD: 'judas',
  REV: 'apocalipsis',
};

let bibleCache: BibleData | null = null;

function getBibleData(): BibleData {
  if (!bibleCache) {
    const filePath = join(process.cwd(), 'public', 'bible.json');
    bibleCache = JSON.parse(readFileSync(filePath, 'utf-8')) as BibleData;
  }
  return bibleCache;
}

function parseRef(
  ref: string,
): {
  jsonKey: string;
  displayBook: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
} | null {
  const decoded = decodeURIComponent(ref).replace(/\+/g, ' ');
  const match = decoded.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const [, bookRaw, chapterStr, startStr, endStr] = match;
  if (!bookRaw || !chapterStr || !startStr) return null;

  const trimmedBook = bookRaw.trim();
  const code = BOOK_MAP[trimmedBook] ?? trimmedBook.toUpperCase();
  const jsonKey = CODE_TO_JSON_KEY[code] ?? trimmedBook.toLowerCase();

  return {
    jsonKey,
    displayBook: trimmedBook,
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

  const { jsonKey, displayBook, chapter, startVerse, endVerse } = parsed;

  try {
    const data = getBibleData();
    const bookData = data.books[jsonKey];
    if (!bookData) {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 });
    }

    const chapterData = bookData[String(chapter)];
    if (!chapterData) {
      return NextResponse.json({ error: 'Capítulo no encontrado' }, { status: 404 });
    }

    const parts: string[] = [];
    for (let v = startVerse; v <= endVerse; v++) {
      const text = chapterData[String(v)];
      if (text) parts.push(`${v} ${text.trim()}`);
    }

    if (parts.length === 0) {
      return NextResponse.json(
        { error: 'Versos no encontrados en el rango indicado' },
        { status: 404 },
      );
    }

    const reference = `${displayBook} ${chapter}:${startVerse}${endVerse !== startVerse ? `-${endVerse}` : ''}`;
    return NextResponse.json({ text: parts.join(' '), reference });
  } catch {
    return NextResponse.json({ error: 'Error al leer la Biblia' }, { status: 500 });
  }
}
