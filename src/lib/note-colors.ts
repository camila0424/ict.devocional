// Paleta de colores para notas de versículos — todos pasteles, sin negro ni café,
// elegidos para que cada tono se distinga claramente de los demás.
export const PASTEL_COLORS = [
  '#FDE68A', // amarillo
  '#FCA5A5', // rojo/coral
  '#FED7AA', // naranja
  '#BBF7D0', // verde
  '#99F6E4', // turquesa
  '#BFDBFE', // azul
  '#E9D5FF', // lila
  '#FBCFE8', // rosa
] as const;

export type NoteColor = (typeof PASTEL_COLORS)[number];
