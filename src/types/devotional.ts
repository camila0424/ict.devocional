export type ReadingData = {
  id: string;
  order: number;
  bookAbbr: string;
  bookFull: string;
  reference: string;
};

export type ResponseData = {
  message: string | null;
  promise: string | null;
  commandment: string | null;
  wrongAttitudes: string | null;
  teotherapy: string | null;
  petition: string | null;
  gratitude: string | null;
  pending: string | null;
  completedAt: Date | null;
};

export type DailyEntryData = {
  id: string;
  dayNumber: number;
  date: Date;
  rawReadings: string;
  readings: ReadingData[];
  response: ResponseData | null;
};

export const SECTION_KEYS = [
  'message',
  'promise',
  'commandment',
  'wrongAttitudes',
  'teotherapy',
  'petition',
  'gratitude',
  'pending',
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];
