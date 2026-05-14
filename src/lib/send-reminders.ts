import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { getRecordatorio, getFraseDelDia } from '@/constants/phrases';

export async function sendReminders() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const nowSpain = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const todaySpain = new Date(nowSpain.getFullYear(), nowSpain.getMonth(), nowSpain.getDate());

  const hourSpain = nowSpain.getHours();
  const turno: 'mañana' | 'tarde' | 'noche' =
    hourSpain < 12 ? 'mañana' : hourSpain < 17 ? 'tarde' : 'noche';

  const todayEntry = await prisma.dailyEntry.findFirst({
    where: { date: todaySpain },
    select: { dayNumber: true },
  });
  const devotionalUrl = todayEntry ? `/devotional/${todayEntry.dayNumber}` : '/';

  const subscriptions = await prisma.pushSubscription.findMany({ include: { user: true } });

  const completedToday = await prisma.userProgress.findMany({
    where: {
      date: todaySpain,
      completed: true,
      userId: { in: subscriptions.map((s) => s.userId) },
    },
    select: { userId: true },
  });

  const completedSet = new Set(completedToday.map((p) => p.userId));
  const pending = subscriptions.filter((s) => !completedSet.has(s.userId));
  const completed = subscriptions.filter((s) => completedSet.has(s.userId));

  const recordatorio = getRecordatorio(turno);
  const fraseDelDia = getFraseDelDia(nowSpain);

  const send = (sub: (typeof subscriptions)[0], title: string, body: string, url: string) =>
    webpush
      .sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title,
          body,
          url,
          urgency: 'high',
          requireInteraction: true,
          vibrate: [200, 100, 200],
          badge: '/icons/icon-192.png',
          icon: '/icons/icon-192.png',
        }),
      )
      .catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      });

  const results = await Promise.allSettled([
    ...pending.map((s) => send(s, 'ICT Devocional 🙏', recordatorio, devotionalUrl)),
    ...completed.map((s) => send(s, 'ICT Devocional ✨', fraseDelDia, '/')),
  ]);

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    total: subscriptions.length,
  };
}
