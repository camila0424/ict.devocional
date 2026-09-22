// Utilidades puras (sin fs) para representar selecciones de versículos en la URL,
// p. ej. ?v=6 | ?v=6-9 | ?v=2,5,7-9

export function parseVerseParam(param: string | null | undefined): number[] {
  if (!param) return [];
  const numbers = new Set<number>();
  for (const part of param.split(',')) {
    const trimmed = part.trim();
    const rangeMatch = /^(\d+)-(\d+)$/.exec(trimmed);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let n = Math.min(start, end); n <= Math.max(start, end); n++) numbers.add(n);
    } else if (/^\d+$/.test(trimmed)) {
      numbers.add(Number(trimmed));
    }
  }
  return [...numbers].sort((a, b) => a - b);
}

export function formatVerseParam(verseNumbers: number[]): string {
  const sorted = [...new Set(verseNumbers)].sort((a, b) => a - b);
  if (sorted.length === 0) return '';
  const groups: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    groups.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = current;
    prev = current;
  }
  groups.push(start === prev ? `${start}` : `${start}-${prev}`);

  return groups.join(',');
}
