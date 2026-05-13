import { NextRequest } from 'next/server';
import { parseReference, type BibleReading } from '@/lib/bible-books';

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get('ref');
  if (!ref)
    return Response.json(
      { success: false, error: 'Falta ?ref=', code: 'MISSING_REF' },
      { status: 400 },
    );
  try {
    const { bookKey, bookName, chapters } = parseReference(ref);
    const data: BibleReading = { reference: ref, bookKey, bookName, chapters };
    return Response.json(
      { success: true, data },
      {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      },
    );
  } catch (e) {
    return Response.json(
      { success: false, error: (e as Error).message, code: 'PARSE_ERROR' },
      { status: 422 },
    );
  }
}
