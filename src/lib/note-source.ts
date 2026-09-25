// Dónde se escribió una nota de versículo. Las del devocional se muestran también en la Biblia
// (y en "Guardados y notas") con un título que indica su origen.
export const NOTE_SOURCES = ['bible', 'devotional'] as const;

export type NoteSource = (typeof NOTE_SOURCES)[number];

export const DEVOTIONAL_NOTE_TITLE = 'Nota en el devocional';

// Las lecturas del devocional usan los archivos de RVR1960
export const DEVOTIONAL_VERSION_KEY = 'RVR1960';
