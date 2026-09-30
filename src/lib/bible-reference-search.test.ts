import { describe, expect, it } from 'vitest';
import { parseBibleReference, referenceHref, referenceLabel } from './bible-reference-search';

const books = [
  { key: 'genesis', nameEs: 'Génesis', chapterCount: 50 },
  { key: 'psalms', nameEs: 'Salmos', chapterCount: 150 },
  { key: 'john', nameEs: 'Juan', chapterCount: 21 },
  { key: '1john', nameEs: '1 Juan', chapterCount: 5 },
  { key: '1chronicles', nameEs: '1 Crónicas', chapterCount: 29 },
];

describe('parseBibleReference', () => {
  it('reconoce libro + capítulo', () => {
    const ref = parseBibleReference('salmos 145', books);
    expect(ref).toMatchObject({ bookKey: 'psalms', chapterIndex: 144, verseStart: null });
    expect(referenceHref(ref!)).toBe('/biblia/psalms/144');
    expect(referenceLabel(ref!)).toBe('Salmos 145');
  });

  it('reconoce versículo y rango con distintos separadores', () => {
    expect(parseBibleReference('Juan 3:16', books)).toMatchObject({
      bookKey: 'john',
      chapterIndex: 2,
      verseStart: 16,
      verseEnd: null,
    });
    expect(parseBibleReference('juan 3 16-18', books)).toMatchObject({
      verseStart: 16,
      verseEnd: 18,
    });
    const ref = parseBibleReference('Sal 23.1-3', books);
    expect(referenceHref(ref!)).toBe('/biblia/psalms/22?v=1-3');
    expect(referenceLabel(ref!)).toBe('Salmos 23:1-3');
  });

  it('distingue libros numerados y admite abreviaturas y tildes', () => {
    expect(parseBibleReference('1 juan 4:7', books)?.bookKey).toBe('1john');
    expect(parseBibleReference('1juan 4', books)?.bookKey).toBe('1john');
    expect(parseBibleReference('gen 1', books)?.bookKey).toBe('genesis');
    expect(parseBibleReference('1 crónicas 2', books)?.bookKey).toBe('1chronicles');
  });

  it('ignora texto que no es una referencia válida', () => {
    expect(parseBibleReference('salmos', books)).toBeNull();
    expect(parseBibleReference('amor 3', books)).toBeNull();
    expect(parseBibleReference('juan 22', books)).toBeNull();
    expect(parseBibleReference('juan 0', books)).toBeNull();
    expect(parseBibleReference('j 3', books)).toBeNull();
  });
});
