export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=UC023hX0ppaxW8GflnfvNcTg` +
      `&maxResults=1` +
      `&order=date` +
      `&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

    if (date) {
      url += `&publishedAfter=${date}T00:00:00Z&publishedBefore=${date}T23:59:59Z`;
    }

    const res = await fetch(url);
    if (!res.ok) return Response.json({ videoId: null });

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return Response.json({ videoId: null });

    return Response.json({
      videoId: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    });
  } catch {
    return Response.json({ videoId: null });
  }
}
