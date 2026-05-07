import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { getRecordatorio, FRASES_MOTIVACIONALES } from '@/constants/phrases';

export async function sendReminders(turno: 'mañana' | 'tarde' | 'noche') {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const subscriptions = await prisma.pushSubscription.findMany({ include: { user: true } });

  const completedToday = await prisma.userProgress.findMany({
    where: { date: today, completed: true, userId: { in: subscriptions.map((s) => s.userId) } },
    select: { userId: true },
  });

  const completedSet = new Set(completedToday.map((p) => p.userId));
  const pending = subscriptions.filter((s) => !completedSet.has(s.userId));
  const completed = subscriptions.filter((s) => completedSet.has(s.userId));

  const recordatorio = getRecordatorio(turno);
  const motivacional =
    FRASES_MOTIVACIONALES[Math.floor(Math.random() * FRASES_MOTIVACIONALES.length)]!;

  const send = (sub: (typeof subscriptions)[0], body: string) =>
    webpush
      .sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'ICT Devocional 🙏', body, icon: '/icons/icon-192.png' }),
      )
      .catch(async (err) => {
        if (err.statusCode === 410) await prisma.pushSubscription.delete({ where: { id: sub.id } });
        throw err;
      });

  const results = await Promise.allSettled([
    ...pending.map((s) => send(s, recordatorio)),
    ...completed.map((s) => send(s, motivacional)),
  ]);

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    total: subscriptions.length,
  };
}
