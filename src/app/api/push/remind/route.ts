import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { getRecordatorio } from '@/constants/phrases';

export async function POST(req: NextRequest) {
  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: 'VAPID environment variables are not configured' },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  if (req.headers.get('X-Admin-Secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const turno = body?.turno as 'mañana' | 'tarde' | 'noche';
  if (!['mañana', 'tarde', 'noche'].includes(turno)) {
    return NextResponse.json({ error: 'Invalid turno' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: true },
  });

  const completedToday = await prisma.userProgress.findMany({
    where: {
      date: today,
      completed: true,
      userId: { in: subscriptions.map((s) => s.userId) },
    },
    select: { userId: true },
  });

  const completedSet = new Set(completedToday.map((p) => p.userId));
  const pending = subscriptions.filter((s) => !completedSet.has(s.userId));

  const frase = getRecordatorio(turno);
  const payload = JSON.stringify({
    title: 'ICT Devocional 🙏',
    body: frase,
    icon: '/icons/icon-192.png',
  });

  const results = await Promise.allSettled(
    pending.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        .catch(async (err) => {
          if (err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          throw err;
        }),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: pending.length });
}
