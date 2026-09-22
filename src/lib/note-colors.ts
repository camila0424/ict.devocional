// Paleta de colores para notas de versículos — todos pasteles, sin negro ni café.
export const PASTEL_COLORS = [
  '#FDE68A',
  '#BBF7D0',
  '#BFDBFE',
  '#FBCFE8',
  '#E9D5FF',
  '#FED7AA',
  '#A7F3D0',
  '#C7D2FE',
] as const;

export type NoteColor = (typeof PASTEL_COLORS)[number];
