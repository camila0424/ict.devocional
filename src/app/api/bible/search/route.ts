import { auth } from '@/lib/auth';
import { searchBible, type BibleVersion } from '@/lib/bible-reader';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: 'No autenticado', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const version: BibleVersion = searchParams.get('version') === 'NTV' ? 'NTV' : 'RVR1960';

  const results = searchBible(q, version);
  return Response.json({ success: true, data: results });
}
