import { describe, expect, it } from 'vitest';
import { KEY_TO_NAME, normalizeChapterVerse, resolveBookKey } from './bible-book-aliases';
import { parseReference, validateReading } from './bible-books';

const BOOK_KEYS = Object.keys(KEY_TO_NAME);

// Abreviaturas de la RVR1960 (índice impreso) y de la NTV/Filament, en orden canónico
const RVR = [
  'Gn',
  'Ex',
  'Lv',
  'Nm',
  'Dt',
  'Jos',
  'Jue',
  'Rt',
  '1 S',
  '2 S',
  '1 R',
  '2 R',
  '1 Cr',
  '2 Cr',
  'Esd',
  'Neh',
  'Est',
  'Job',
  'Sal',
  'Pr',
  'Ec',
  'Cnt',
  'Is',
  'Jer',
  'Lm',
  'Ez',
  'Dn',
  'Os',
  'Jl',
  'Am',
  'Abd',
  'Jon',
  'Miq',
  'Nah',
  'Hab',
  'Sof',
  'Hag',
  'Zac',
  'Mal',
  'Mt',
  'Mr',
  'Lc',
  'Jn',
  'Hch',
  'Ro',
  '1 Co',
  '2 Co',
  'Gl',
  'Ef',
  'Fil',
  'Col',
  '1 Ts',
  '2 Ts',
  '1 Ti',
  '2 Ti',
  'Tit',
  'Flm',
  'He',
  'Stg',
  '1 P',
  '2 P',
  '1 Jn',
  '2 Jn',
  '3 Jn',
  'Jud',
  'Ap',
];
const FILAMENT = [
  'Gn',
  'Ex',
  'Lv',
  'Nm',
  'Dt',
  'Jos',
  'Jc',
  'Rt',
  '1 Sm',
  '2 Sm',
  '1 Re',
  '2 Re',
  '1 Cr',
  '2 Cr',
  'Esd',
  'Ne',
  'Est',
  'Jb',
  'Sal',
  'Pr',
  'Ecl',
  'Ct',
  'Is',
  'Jr',
  'Lm',
  'Ez',
  'Dn',
  'Os',
  'Jl',
  'Am',
  'Ab',
  'Jon',
  'Mi',
  'Na',
  'Ha',
  'So',
  'Hag',
  'Za',
  'Ml',
  'Mt',
  'Mc',
  'Lc',
  'Jn',
  'Hch',
  'Rm',
  '1 Co',
  '2 Co',
  'Ga',
  'Ef',
  'Flp',
  'Col',
  '1 Ts',
  '2 Ts',
  '1 Tm',
  '2 Tm',
  'Tt',
  'Flm',
  'Hb',
  'St',
  '1 P',
  '2 P',
  '1 Jn',
  '2 Jn',
  '3 Jn',
  'Jds',
  'Ap',
];

describe('resolveBookKey', () => {
  it.each([
    ['RVR1960', RVR],
    ['NTV/Filament', FILAMENT],
  ])('reconoce las 66 abreviaturas de la %s', (_, abbrs) => {
    expect(abbrs.map((a) => resolveBookKey(a))).toEqual(BOOK_KEYS);
  });

  it('reconoce los 66 nombres completos, con y sin tildes', () => {
    const names = Object.values(KEY_TO_NAME);
    expect(names.map((n) => resolveBookKey(n))).toEqual(BOOK_KEYS);
    expect(names.map((n) => resolveBookKey(n.normalize('NFD').replace(/[̀-ͯ]/g, '')))).toEqual(
      BOOK_KEYS,
    );
  });

  it.each([
    // Guías devocionales ICT (leyendas de cada mes)
    ['Salm', 'salmos'],
    ['Provs', 'proverbios'],
    ['Levíticos', 'levitico'],
    ['Deutoronomio', 'deuteronomio'],
    ['Hchs', 'hechos'],
    ['Apo', 'apocalipsis'],
    ['2 Crón', '2_cronicas'],
    ['1 Cró', '1_cronicas'],
    ['Zc', 'zacarias'],
    ['Ag', 'hageo'],
    ['Na', 'nahum'],
    ['Mar', 'marcos'],
    ['Luc', 'lucas'],
    ['Gén', 'genesis'],
    ['Éx', 'exodo'],
    ['Núm', 'numeros'],
    ['Cant', 'cantares'],
    ['1 Tes', '1_tesalonicenses'],
    ['1 Ti', '1_timoteo'],
    ['2 Tim', '2_timoteo'],
    ['1 Cor', '1_corintios'],
    ['Rom', 'romanos'],
    ['Dan', 'daniel'],
    ['1 Sam', '1_samuel'],
    ['Re', '1_reyes'],
    ['Juan', 'juan'],
    ['Lam', 'lamentaciones'],
    ['Gal', 'galatas'],
    ['Tito', 'tito'],
    ['Filemón', 'filemon'],
    ['Santiago', 'santiago'],
    ['1 Pedro', '1_pedro'],
    // Otras formas de escribirlos
    ['1Sam', '1_samuel'],
    ['1 sam.', '1_samuel'],
    ['Gn.', 'genesis'],
    ['SALMOS', 'salmos'],
    ['San Juan', 'juan'],
    ['1 San Pedro Apóstol', '1_pedro'],
    ['El Apocalipsis', 'apocalipsis'],
    ['San Judas Apóstol', 'judas'],
    ['Cantar de los Cantares', 'cantares'],
    ['Jerem', 'jeremias'],
    ['Ezeq', 'ezequiel'],
    ['Filem', 'filemon'],
  ])('"%s" → %s', (abbr, key) => {
    expect(resolveBookKey(abbr)).toBe(key);
  });

  it('"He" es Hebreos hasta el capítulo 13 y Hechos a partir del 14', () => {
    expect(resolveBookKey('He', 1)).toBe('hebreos');
    expect(resolveBookKey('He', 13)).toBe('hebreos');
    expect(resolveBookKey('He', 14)).toBe('hechos');
    expect(resolveBookKey('He', 28)).toBe('hechos');
  });

  it('no inventa libros para texto que no lo es', () => {
    expect(resolveBookKey('Xyz')).toBeUndefined();
    expect(resolveBookKey('Jo')).toBeUndefined();
    expect(resolveBookKey('4 Juan')).toBeUndefined();
  });
});

describe('normalizeChapterVerse', () => {
  it.each([
    ['4 1-20', '4:1-20'],
    ['12 :1-27', '12:1-27'],
    ['15) 21-47', '15:21-47'],
    ['3 : 1 - 4 : 13', '3:1-4:13'],
    ['1–5', '1-5'],
    ['23.1', '23:1'],
    ['89:1-18', '89:1-18'],
  ])('"%s" → "%s"', (raw, expected) => {
    expect(normalizeChapterVerse(raw)).toBe(expected);
  });
});

// Lecturas copiadas tal cual de las guías de enero a diciembre, erratas incluidas
const READINGS_FROM_GUIDES = [
  'Luc 5:27-39',
  'Gén 27:46-28:22',
  'Gén 29:31-30:43',
  'Sal 1',
  'Gén 45:1-46:27',
  'He 4:14-6:12',
  'He 9:23-10:18',
  'Éx 5:1-6:27',
  'Prov 6:1-7:5',
  'Provs 8',
  'Lev 1-2',
  'Ecl1:12-2:26',
  'Núm3-4',
  'Ecl9:1-12',
  'Cant 1:1-2:7',
  'Núm 23:27-24:25',
  'Deut  3-4',
  'Hchs 7:23-8:1',
  'Jos 5:2-6:27',
  'Job 30',
  'He 14',
  'He 21:37-22:29',
  'He 28:16-31',
  'Jue 10:1-11:33',
  'Rut 1-2',
  '1 Sam 10:17-11:15',
  '1 Sam17:55-18:30',
  'Mar 4 1-20',
  '2 Sam16',
  'Dan 11 21-45',
  '2 Sam20-21',
  'Os 1:1-2:1',
  'Mar 12 :1-27',
  'Mar 15) 21-47',
  '1 Re 12:32-13:34',
  'Jl 2:12-32',
  'Abd',
  '2 Re 6:1-7:2',
  '1 Cor 16',
  '2 Re 23:35-24:20',
  'Ag 1-2',
  'Zc  2',
  '1 Cró 20-22:1',
  'Juan 1:1-18',
  '2 Crón  33',
  'Mal 2:17-3:18',
  '2 Jn',
  '3 Jn',
  'Jud',
  'Jn 18:28-19:16',
  'Apo 16',
  'Neh 9:38-10:39',
  'Est 6:14-8:17',
  '1 Tes 2:17-3:13',
  '1 Ti 2',
  'Sal 119:65-96',
  'Jeremías1-2',
  'Salm119:145-176',
  'Filemón',
  'Gálatas 3:21-4:20',
  'Lam 3-4',
  '1 Tim 5:21-6:21',
  'Lm 5',
  'Col1:24-2:19',
  'Flp 2:12-30',
  'Lc 1:57-80',
  'Is 66',
];

describe('lecturas de las guías del año', () => {
  it.each(READINGS_FROM_GUIDES)('"%s" se puede abrir', (reading) => {
    expect(validateReading(reading)).toBeNull();
  });

  it('carga los versículos correctos en los formatos con erratas', () => {
    const mar = parseReference('Mar 15) 21-47');
    expect(mar.bookKey).toBe('marcos');
    expect(mar.chapters[0]!.number).toBe(15);
    expect(mar.chapters[0]!.verses[0]!.number).toBe(21);
    expect(mar.chapters[0]!.verses.at(-1)!.number).toBe(47);
    expect(parseReference('He 14').bookName).toBe('Hechos');
    expect(parseReference('He 13').bookName).toBe('Hebreos');
  });

  it('marca como inválidas las erratas que no se pueden adivinar', () => {
    expect(validateReading('Jl 31')).toMatch(/Joel no tiene/); // julio: Joel tiene 3 capítulos
    expect(validateReading('Sal 23:10')).toMatch(/Salmos no tiene/);
    expect(validateReading('1-4:13')).not.toBeNull(); // febrero: "He 3 / 1-4:13"
    expect(validateReading('Xyz 3')).toMatch(/no reconocida/);
  });
});
