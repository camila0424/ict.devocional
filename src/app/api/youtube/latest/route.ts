export const revalidate = 3600;

export async function GET(request: Request) {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json({ success: false, error: 'Missing YOUTUBE_API_KEY' });
  }

  try {
    const { searchParams } = new URL(request.url);
    // Accept full ISO strings or YYYY-MM-DD; always work with just the date portion.
    const date = searchParams.get('date')?.split('T')[0] ?? null;

    const searchDate = async (targetDate: string) => {
      // ICT publica la noche anterior al día que corresponde.
      // Buscamos desde 2 días antes (00:00 UTC) hasta el día recibido (23:59 UTC).
      const publishedAfter = (() => {
        const d = new Date(`${targetDate}T00:00:00Z`);
        d.setDate(d.getDate() - 2);
        return (
          d
            .toISOString()
            .replace(/\.\d{3}Z$/, 'Z')
            .split('T')[0] + 'T00:00:00Z'
        );
      })();
      const publishedBefore = `${targetDate}T23:59:59Z`;

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
      const item = await searchDate(date);

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
