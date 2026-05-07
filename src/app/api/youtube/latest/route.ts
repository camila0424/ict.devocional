export const revalidate = 3600;

export async function GET(request: Request) {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json({ success: false, error: 'Missing YOUTUBE_API_KEY' });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const searchDate = async (targetDate: string) => {
      // ICT publica ~5am Colombia (UTC-5). Rango amplio: medianoche UTC-6 → fin de día UTC-4
      const publishedAfter = `${targetDate}T06:00:00Z`;
      const publishedBefore = (() => {
        const d = new Date(`${targetDate}T00:00:00Z`);
        d.setDate(d.getDate() + 1);
        return d.toISOString().replace('.000Z', 'Z').split('T')[0] + 'T05:59:59Z';
      })();

      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet` +
        `&channelId=UC023hX0ppaxW8GflnfvNcTg` +
        `&maxResults=1` +
        `&order=date` +
        `&type=video` +
        `&publishedAfter=${publishedAfter}` +
        `&publishedBefore=${publishedBefore}` +
        `&key=${process.env.YOUTUBE_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      console.log('YouTube search result:', JSON.stringify(data));
      return data.items?.[0] ?? null;
    };

    if (date) {
      let item = await searchDate(date);

      // Fallback: buscar el día anterior (a veces publican la noche antes)
      if (!item) {
        const prevDate = (() => {
          const d = new Date(`${date}T00:00:00Z`);
          d.setDate(d.getDate() - 1);
          return d.toISOString().split('T')[0];
        })();
        item = await searchDate(prevDate);
      }

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
