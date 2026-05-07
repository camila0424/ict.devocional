export const revalidate = 300;

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

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function titleMatchesDay(title: string, day: number, monthName: string): boolean {
  const t = title.toLowerCase();
  const m = monthName.toLowerCase();
  if (!t.includes(m)) return false;
  const padded = String(day).padStart(2, '0');
  // Accepts "07 mayo", "7 mayo", "7 de mayo", word-boundary match
  return t.includes(padded) || new RegExp(`\\b${day}\\b`).test(t);
}

export async function GET(request: Request) {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json({ success: false, error: 'Missing YOUTUBE_API_KEY' });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date')?.split('T')[0] ?? null;

    if (date) {
      const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return Response.json({ videoId: null });

      const [, , monthStr, dayStr] = match;
      if (!monthStr || !dayStr) return Response.json({ videoId: null });
      const day = parseInt(dayStr, 10);
      const monthName = MONTHS_ES[parseInt(monthStr, 10) - 1];
      if (!monthName) return Response.json({ videoId: null });

      // ICT publishes "N Mayo" the night before day N.
      // Use UTC methods to avoid server-timezone bugs.
      const baseMs = new Date(`${date}T00:00:00Z`).getTime();
      const after = isoDate(new Date(baseMs - 7 * 86400_000)) + 'T00:00:00Z';
      const before = isoDate(new Date(baseMs + 1 * 86400_000)) + 'T23:59:59Z';

      const q = encodeURIComponent(`${dayStr} ${monthName}`);
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet` +
        `&channelId=UC023hX0ppaxW8GflnfvNcTg` +
        `&maxResults=10` +
        `&order=date` +
        `&type=video` +
        `&q=${q}` +
        `&publishedAfter=${after}` +
        `&publishedBefore=${before}` +
        `&key=${process.env.YOUTUBE_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) return Response.json({ videoId: null });

      const data = await res.json();
      console.log('YouTube search result:', JSON.stringify(data));

      const items: {
        id: { videoId: string };
        snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } };
      }[] = data.items ?? [];

      const item = items.find(({ snippet: { title } }) => titleMatchesDay(title, day, monthName));

      if (!item) return Response.json({ videoId: null });

      return Response.json({
        videoId: item.id.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
      });
    }

    // Sin fecha: trae el más reciente
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=UC023hX0ppaxW8GflnfvNcTg` +
      `&maxResults=1` +
      `&order=date` +
      `&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return Response.json({ videoId: null });

    const data = await res.json();
    console.log('YouTube search result (no date):', JSON.stringify(data));
    const item = data.items?.[0];
    if (!item) return Response.json({ videoId: null });

    return Response.json({
      videoId: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    });
  } catch (err) {
    console.error('YouTube API error:', err);
    return Response.json({ videoId: null });
  }
}
