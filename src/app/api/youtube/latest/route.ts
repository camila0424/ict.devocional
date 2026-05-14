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

function titleMatchesDay(title: string, day: number): boolean {
  const t = title.toLowerCase();
  const dayPadded = String(day).padStart(2, '0');
  const dayPlain = String(day);
  return (
    t.includes(dayPadded) ||
    t.includes(` ${dayPlain} `) ||
    t.includes(`| ${dayPlain} `) ||
    t.includes(` ${dayPlain}|`) ||
    t.startsWith(`${dayPlain} `)
  );
}

export async function GET(request: Request) {
  if (!process.env.YOUTUBE_API_KEY)
    return Response.json({ success: false, error: 'Missing YOUTUBE_API_KEY' });

  try {
    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get('day');
    const monthParam = searchParams.get('month');

    if (dayParam && monthParam) {
      const day = parseInt(dayParam, 10);
      const month = parseInt(monthParam, 10);
      const monthName = MONTHS_ES[month - 1];
      if (!monthName || isNaN(day)) return Response.json({ videoId: null });

      const dayPadded = String(day).padStart(2, '0');
      const q = encodeURIComponent(`${dayPadded} ${monthName}`);
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&channelId=UC023hX0ppaxW8GflnfvNcTg` +
        `&maxResults=10&order=date&type=video&q=${q}` +
        `&key=${process.env.YOUTUBE_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) return Response.json({ videoId: null });

      const data = (await res.json()) as {
        items?: {
          id: { videoId: string };
          snippet: {
            title: string;
            publishedAt: string;
            thumbnails?: { medium?: { url: string } };
          };
        }[];
      };
      console.log(
        'YouTube day',
        day,
        monthName,
        '→',
        data.items?.map((i) => i.snippet.title),
      );

      const item = (data.items ?? []).find(({ snippet: { title } }) => titleMatchesDay(title, day));
      if (!item) return Response.json({ videoId: null });

      return Response.json({
        videoId: item.id.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
      });
    }

    // Sin parámetros: último video
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&channelId=UC023hX0ppaxW8GflnfvNcTg` +
      `&maxResults=1&order=date&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return Response.json({ videoId: null });
    const data = (await res.json()) as {
      items?: {
        id: { videoId: string };
        snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } };
      }[];
    };
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
