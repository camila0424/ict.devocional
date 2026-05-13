import path from 'path';
import { readFileSync } from 'fs';

export interface BibleVerse {
  number: number;
  text: string;
}
export interface BibleChapter {
  number: number;
  verses: BibleVerse[];
}
export interface BibleReading {
  reference: string;
  bookKey: string;
  bookName: string;
  chapters: BibleChapter[];
}

// Abreviaturas ICT → key del JSON
// Las únicas que difieren del índice estándar son las 6 primeras
export const ICT_TO_KEY: Record<string, string> = {
  He: 'hechos', // ICT usa "He",    índice usa "Hch"
  Salm: 'salmos', // ICT usa "Salm",  índice usa "Sal"
  Rom: 'romanos', // ICT usa "Rom",   índice usa "Ro"
  Rut: 'rut', // ICT usa "Rut",   índice usa "Rt"
  '1 Sam': '1_samuel', // ICT usa "1 Sam", índice usa "1 S"
  '2 Sam': '2_samuel', // ICT usa "2 Sam", índice usa "2 S"
  // Resto coincide con el índice
  Gn: 'genesis',
  Ex: 'exodo',
  Lv: 'levitico',
  Nm: 'numeros',
  Dt: 'deuteronomio',
  Jos: 'josue',
  Jue: 'jueces',
  '1 S': '1_samuel',
  '2 S': '2_samuel',
  '1 R': '1_reyes',
  '2 R': '2_reyes',
  '1 Cr': '1_cronicas',
  '2 Cr': '2_cronicas',
  Esd: 'esdras',
  Neh: 'nehemias',
  Est: 'ester',
  Job: 'job',
  Sal: 'salmos',
  Pr: 'proverbios',
  Ec: 'eclesiastes',
  Cnt: 'cantares',
  Is: 'isaias',
  Jer: 'jeremias',
  Lm: 'lamentaciones',
  Ez: 'ezequiel',
  Dn: 'daniel',
  Os: 'oseas',
  Jl: 'joel',
  Am: 'amos',
  Abd: 'abdias',
  Jon: 'jonas',
  Miq: 'miqueas',
  Nah: 'nahum',
  Hab: 'habacuc',
  Sof: 'sofonias',
  Hg: 'hageo',
  Zac: 'zacarias',
  Mal: 'malaquias',
  Mt: 'mateo',
  Mc: 'marcos',
  Lc: 'lucas',
  Jn: 'juan',
  Hch: 'hechos',
  Ro: 'romanos',
  '1 Co': '1_corintios',
  '2 Co': '2_corintios',
  Gl: 'galatas',
  Ef: 'efesios',
  Flp: 'filipenses',
  Col: 'colosenses',
  '1 Ts': '1_tesalonicenses',
  '2 Ts': '2_tesalonicenses',
  '1 Ti': '1_timoteo',
  '2 Ti': '2_timoteo',
  Tit: 'tito',
  Flm: 'filemon',
  Heb: 'hebreos',
  Stg: 'santiago',
  '1 P': '1_pedro',
  '2 P': '2_pedro',
  '1 Jn': '1_juan',
  '2 Jn': '2_juan',
  '3 Jn': '3_juan',
  Jud: 'judas',
  Ap: 'apocalipsis',
};

export const KEY_TO_NAME: Record<string, string> = {
  genesis: 'Génesis',
  exodo: 'Éxodo',
  levitico: 'Levítico',
  numeros: 'Números',
  deuteronomio: 'Deuteronomio',
  josue: 'Josué',
  jueces: 'Jueces',
  rut: 'Rut',
  '1_samuel': '1 Samuel',
  '2_samuel': '2 Samuel',
  '1_reyes': '1 Reyes',
  '2_reyes': '2 Reyes',
  '1_cronicas': '1 Crónicas',
  '2_cronicas': '2 Crónicas',
  esdras: 'Esdras',
  nehemias: 'Nehemías',
  ester: 'Ester',
  job: 'Job',
  salmos: 'Salmos',
  proverbios: 'Proverbios',
  eclesiastes: 'Eclesiastés',
  cantares: 'Cantares',
  isaias: 'Isaías',
  jeremias: 'Jeremías',
  lamentaciones: 'Lamentaciones',
  ezequiel: 'Ezequiel',
  daniel: 'Daniel',
  oseas: 'Oseas',
  joel: 'Joel',
  amos: 'Amós',
  abdias: 'Abdías',
  jonas: 'Jonás',
  miqueas: 'Miqueas',
  nahum: 'Nahúm',
  habacuc: 'Habacuc',
  sofonias: 'Sofonías',
  hageo: 'Hageo',
  zacarias: 'Zacarías',
  malaquias: 'Malaquías',
  mateo: 'Mateo',
  marcos: 'Marcos',
  lucas: 'Lucas',
  juan: 'Juan',
  hechos: 'Hechos',
  romanos: 'Romanos',
  '1_corintios': '1 Corintios',
  '2_corintios': '2 Corintios',
  galatas: 'Gálatas',
  efesios: 'Efesios',
  filipenses: 'Filipenses',
  colosenses: 'Colosenses',
  '1_tesalonicenses': '1 Tesalonicenses',
  '2_tesalonicenses': '2 Tesalonicenses',
  '1_timoteo': '1 Timoteo',
  '2_timoteo': '2 Timoteo',
  tito: 'Tito',
  filemon: 'Filemón',
  hebreos: 'Hebreos',
  santiago: 'Santiago',
  '1_pedro': '1 Pedro',
  '2_pedro': '2 Pedro',
  '1_juan': '1 Juan',
  '2_juan': '2 Juan',
  '3_juan': '3 Juan',
  judas: 'Judas',
  apocalipsis: 'Apocalipsis',
};

// Parsea "He 14", "He 15:1-21", "Jos 23-24", "Jue 10:1-11:33", "1 Sam 1:1-2:11"
export function parseReference(fullRef: string): {
  bookKey: string;
  bookName: string;
  chapters: BibleChapter[];
} {
  const match = fullRef.trim().match(/^(\d+\s+\w+|\w+)\s+(.+)$/);
  if (!match) throw new Error(`Referencia inválida: "${fullRef}"`);
  const [, abbr, ref] = match;
  const bookKey = ICT_TO_KEY[abbr!];
  if (!bookKey) throw new Error(`Abreviatura no reconocida: "${abbr}"`);
  const bookName = KEY_TO_NAME[bookKey] ?? bookKey;
  const bookData = loadBook(bookKey);
  const chapters = buildSegments(ref!).map((seg) => ({
    number: seg.c,
    verses: extractVerses(bookData, seg),
  }));
  return { bookKey, bookName, chapters };
}

interface Seg {
  c: number;
  v1: number;
  v2: number | null;
}

function buildSegments(ref: string): Seg[] {
  // "10:1-11:33"
  const cc = ref.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
  if (cc) {
    const [, c1, v1, c2, v2] = cc.map(Number);
    return Array.from({ length: c2! - c1! + 1 }, (_, i) => ({
      c: c1! + i,
      v1: c1! + i === c1 ? v1! : 1,
      v2: c1! + i === c2 ? v2! : null,
    }));
  }
  // "15:1-21"
  const cv = ref.match(/^(\d+):(\d+)-(\d+)$/);
  if (cv) {
    const [, c, v1, v2] = cv.map(Number);
    return [{ c: c!, v1: v1!, v2: v2! }];
  }
  // "23-24"
  const mc = ref.match(/^(\d+)-(\d+)$/);
  if (mc) {
    const [, c1, c2] = mc.map(Number);
    return Array.from({ length: c2! - c1! + 1 }, (_, i) => ({ c: c1! + i, v1: 1, v2: null }));
  }
  // "42:1" — single chapter with start verse, reads to end of chapter
  const sv = ref.match(/^(\d+):(\d+)$/);
  if (sv) {
    const [, c, v1] = sv.map(Number);
    return [{ c: c!, v1: v1!, v2: null }];
  }
  // "14"
  const sc = ref.match(/^(\d+)$/);
  if (sc) return [{ c: +sc[1]!, v1: 1, v2: null }];
  throw new Error(`Formato no reconocido: "${ref}"`);
}

function extractVerses(data: string[][], seg: Seg): BibleVerse[] {
  const ch = data[seg.c - 1];
  if (!ch) return [];
  const start = seg.v1 - 1;
  const end = seg.v2 ?? ch.length;
  return ch.slice(start, end).map((text, i) => ({ number: start + i + 1, text: text.trim() }));
}

// Caché en memoria — no releer disco en cada request
const cache = new Map<string, string[][]>();
function loadBook(key: string): string[][] {
  if (cache.has(key)) return cache.get(key)!;
  const p = path.join(process.cwd(), 'public', 'bible', `${key}.json`);
  const data = JSON.parse(readFileSync(p, 'utf-8')) as string[][];
  cache.set(key, data);
  return data;
}
