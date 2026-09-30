// Utilidades puras (sin fs) para reconocer el libro de una lectura escrita de cualquier forma:
// abreviaturas de la RVR1960 ("Gn", "Mr", "Stg"), de la NTV/Filament ("Jc", "Mi", "Tt"),
// las de las guías devocionales del ICT ("Salm", "Hchs", "Cró", "Apo") y nombres completos
// ("Jeremías", "1 San Pedro Apóstol"), con o sin tildes, mayúsculas o punto final.

// bookKey = nombre del archivo RVR1960 en public/bible (mismo orden canónico de 66 libros).
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

// Variantes aceptadas por libro, sin tildes, en minúsculas y SIN el número del libro
// (el número sale de la clave: '1_samuel' + 'sam' reconoce "1 Sam", "1Sam", "1 sam.").
// El nombre completo y cualquier comienzo de 4+ letras que sea único se aceptan aparte.
const BOOK_ALIASES: Record<string, string[]> = {
  genesis: ['gn', 'gen', 'ge'],
  exodo: ['ex', 'exo', 'exod'],
  levitico: ['lv', 'lev', 'le', 'leviticos'],
  numeros: ['nm', 'num', 'nu'],
  deuteronomio: ['dt', 'deut', 'deu', 'deutoronomio'],
  josue: ['jos'],
  jueces: ['jue', 'jc', 'jueces'],
  rut: ['rt', 'rut', 'ru'],
  '1_samuel': ['s', 'sa', 'sam', 'sm'],
  '2_samuel': ['s', 'sa', 'sam', 'sm'],
  '1_reyes': ['r', 're', 'rey', 'ry'],
  '2_reyes': ['r', 're', 'rey', 'ry'],
  '1_cronicas': ['cr', 'cro', 'cron', 'cronica'],
  '2_cronicas': ['cr', 'cro', 'cron', 'cronica'],
  esdras: ['esd'],
  nehemias: ['neh', 'ne'],
  ester: ['est', 'es'],
  job: ['job', 'jb'],
  salmos: ['sal', 'salm', 'salms', 'sl', 'slm', 'salmo'],
  proverbios: ['pr', 'prov', 'provs', 'pro', 'prv'],
  eclesiastes: ['ec', 'ecl', 'ecc', 'ecles'],
  cantares: ['cnt', 'cant', 'ct', 'cantar', 'cantar de los cantares', 'cantico de los canticos'],
  isaias: ['is', 'isa'],
  jeremias: ['jer', 'jr'],
  lamentaciones: ['lm', 'lam'],
  ezequiel: ['ez', 'eze', 'ezeq'],
  daniel: ['dn', 'dan', 'da'],
  oseas: ['os'],
  joel: ['jl'],
  amos: ['am'],
  abdias: ['abd', 'ab'],
  jonas: ['jon'],
  miqueas: ['miq', 'mi'],
  nahum: ['nah', 'na'],
  habacuc: ['hab', 'ha'],
  sofonias: ['sof', 'so'],
  hageo: ['hag', 'hg', 'ag'],
  zacarias: ['zac', 'zc', 'za'],
  malaquias: ['mal', 'ml'],
  mateo: ['mt', 'mat'],
  marcos: ['mr', 'mc', 'mar', 'marc', 'mrc'],
  lucas: ['lc', 'luc', 'lu'],
  juan: ['jn', 'jua'],
  hechos: ['hch', 'hchs', 'hech', 'hec', 'hc'],
  romanos: ['ro', 'rom', 'rm'],
  '1_corintios': ['co', 'cor'],
  '2_corintios': ['co', 'cor'],
  galatas: ['gl', 'gal', 'ga'],
  efesios: ['ef', 'efe'],
  filipenses: ['fil', 'flp', 'fili'],
  colosenses: ['col'],
  '1_tesalonicenses': ['ts', 'tes', 'tesa'],
  '2_tesalonicenses': ['ts', 'tes', 'tesa'],
  '1_timoteo': ['ti', 'tim', 'tm'],
  '2_timoteo': ['ti', 'tim', 'tm'],
  tito: ['tit', 'tt'],
  filemon: ['flm', 'filem', 'fm'],
  hebreos: ['heb', 'hb'],
  santiago: ['stg', 'st', 'sant', 'stgo'],
  '1_pedro': ['p', 'pe', 'ped'],
  '2_pedro': ['p', 'pe', 'ped'],
  '1_juan': ['jn', 'jua'],
  '2_juan': ['jn', 'jua'],
  '3_juan': ['jn', 'jua'],
  judas: ['jud', 'jds'],
  apocalipsis: ['ap', 'apo', 'apoc'],
};

// Hebreos tiene 13 capítulos. Las guías del ICT usan "He" para Hebreos (feb. 2026) y para
// Hechos (mayo 2026, capítulos 14-28), así que "He" con capítulo > 13 es Hechos.
const HEBREWS_CHAPTERS = 13;

// Minúsculas, sin tildes, sin puntos y con el número del libro separado: "1Sam." -> "1 sam".
function normalizeBookName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.]/g, ' ')
    .replace(/^([1-3])\s*/, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(\d )?(?:san |el |la )/, '$1') // "San Juan", "1 San Pedro", "El Apocalipsis"
    .replace(/ apostol$/, ''); // "1 San Pedro Apóstol"
}

function splitNumber(key: string): { number: string; base: string } {
  const m = /^([1-3])_(.+)$/.exec(key);
  return m ? { number: `${m[1]} `, base: m[2]! } : { number: '', base: key };
}

let aliasMap: Map<string, string> | null = null;

function getAliasMap(): Map<string, string> {
  if (aliasMap) return aliasMap;
  const map = new Map<string, string>();
  for (const [key, name] of Object.entries(KEY_TO_NAME)) {
    const { number } = splitNumber(key);
    map.set(normalizeBookName(name), key);
    for (const alias of BOOK_ALIASES[key] ?? []) map.set(`${number}${alias}`, key);
  }
  // "Re 1" sin número: el plan de 2024 lo usa para 1 Reyes
  map.set('re', '1_reyes');
  aliasMap = map;
  return map;
}

// Devuelve el bookKey (archivo RVR1960) o undefined si no se reconoce.
// `chapter` solo se usa para desambiguar "He" (Hebreos/Hechos).
export function resolveBookKey(name: string, chapter?: number): string | undefined {
  const normalized = normalizeBookName(name);
  if (!normalized) return undefined;

  if (normalized === 'he') {
    return chapter && chapter > HEBREWS_CHAPTERS ? 'hechos' : 'hebreos';
  }

  const exact = getAliasMap().get(normalized);
  if (exact) return exact;

  // Comienzo único del nombre completo ("jerem", "ezeq") o palabra con letras de más o
  // una errata al final ("salmoss", "levíticos"): se prueba recortando hasta 4 letras.
  const bookNumber = /^\d /.test(normalized) ? normalized.slice(0, 2) : '';
  const word = normalized.slice(bookNumber.length).replace(/ /g, '');
  for (let len = word.length; len >= 4; len--) {
    const prefix = word.slice(0, len);
    const matches = Object.keys(KEY_TO_NAME).filter((key) => {
      const { number, base } = splitNumber(key);
      return number === bookNumber && base.replace(/_/g, '').startsWith(prefix);
    });
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return undefined;
  }
  return undefined;
}

// Corrige erratas de formato habituales en la parte capítulo:versículo de una lectura:
// "4 1-20" -> "4:1-20", "12 :1-27" -> "12:1-27", "15) 21-47" -> "15:21-47", "1–5" -> "1-5".
export function normalizeChapterVerse(ref: string): string {
  return ref
    .replace(/[‐-―−]/g, '-')
    .replace(/(\d)\s*[).;,]\s*(\d)/g, '$1:$2')
    .replace(/\s*([:-])\s*/g, '$1')
    .replace(/^(\d+)\s+(\d+)/, '$1:$2')
    .replace(/\s+/g, '')
    .trim();
}

// Separa "1 Sam17:55-18:30", "Jeremías1-2", "Cantar de los Cantares 2" o "Abd" en libro y
// referencia. La referencia queda vacía cuando se lee el libro entero.
export function splitReading(raw: string): { book: string; reference: string } | null {
  const text = raw
    .trim()
    .replace(/^([1-3])(?=[A-Za-zÀ-ÿ])/, '$1 ') // "1Sam 3" -> "1 Sam 3"
    .replace(/([A-Za-zÀ-ÿ.])(\d)/, '$1 $2'); // "Salm119" -> "Salm 119"
  const match = /^((?:[1-3]\s+)?[A-Za-zÀ-ÿ.]+(?:\s+[A-Za-zÀ-ÿ.]+)*)\s*(.*)$/.exec(text);
  if (!match) return null;
  return { book: match[1]!.trim(), reference: normalizeChapterVerse(match[2] ?? '') };
}
