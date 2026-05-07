export const revalidate = 3600;

export async function GET() {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&channelId=UC023hX0ppaxW8GflnfvNcTg` +
      `&maxResults=1` +
      `&order=date` +
      `&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return Response.json({ success: false });

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return Response.json({ success: false });

    return Response.json({
      videoId: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    });
  } catch {
    return Response.json({ success: false });
  }
}
