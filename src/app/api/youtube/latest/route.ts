export const dynamic = 'force-dynamic';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// El canal de ICT. La lista de subidas es el mismo id con "UC" -> "UU".
const CHANNEL_ID = 'UC023hX0ppaxW8GflnfvNcTg';
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2);

type Video = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
};

// Cache en memoria: evita consumir cuota de la API de YouTube en cada visita.
// La lista de subidas incluye los estrenos ("premieres") programados aún no emitidos.
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; videos: Video[] } | null = null;

async function getRecentUploads(): Promise<Video[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.videos;

  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet,contentDetails&playlistId=${UPLOADS_PLAYLIST_ID}` +
    `&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('YouTube playlistItems error:', res.status, await res.text().catch(() => ''));
    // Si falla la API, servimos la última lista conocida antes que nada.
    return cache?.videos ?? [];
  }

  const data = (await res.json()) as {
    items?: {
      contentDetails: { videoId: string; videoPublishedAt?: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails?: { medium?: { url: string } };
      };
    }[];
  };

  const videos: Video[] = (data.items ?? []).map((i) => ({
    videoId: i.contentDetails.videoId,
    title: i.snippet.title,
    publishedAt: i.contentDetails.videoPublishedAt ?? i.snippet.publishedAt,
    thumbnail: i.snippet.thumbnails?.medium?.url ?? null,
  }));

  cache = { at: Date.now(), videos };
  return videos;
}

// Acepta "03 Septiembre", "3 Septiembre", "3 de Septiembre", "Jueves 03 Septiembre | ..."
function titleMatchesDay(title: string, day: number, monthName: string): boolean {
  const t = title.toLowerCase();
  const m = monthName.toLowerCase();
  if (!t.includes(m)) return false;
  const plain = String(day);
  const padded = plain.padStart(2, '0');
  return new RegExp(`\\b0?${plain}\\b(?:\\s+de)?\\s+${m}`).test(t) || t.includes(`${padded} ${m}`);
}

export async function GET(request: Request) {
  if (!process.env.YOUTUBE_API_KEY)
    return Response.json({ success: false, error: 'Missing YOUTUBE_API_KEY' });

  try {
    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get('day');
    const monthParam = searchParams.get('month');

    const videos = await getRecentUploads();

    if (dayParam && monthParam) {
      const day = parseInt(dayParam, 10);
      const month = parseInt(monthParam, 10);
      const monthName = MONTHS_ES[month - 1];
      if (!monthName || isNaN(day)) return Response.json({ videoId: null });

      const item = videos.find((v) => titleMatchesDay(v.title, day, monthName));
      if (!item) return Response.json({ videoId: null });

      return Response.json(item);
    }

    // Sin parámetros: último video
    const item = videos[0];
    if (!item) return Response.json({ videoId: null });
    return Response.json(item);
  } catch (err) {
    console.error('YouTube API error:', err);
    return Response.json({ videoId: null });
  }
}
