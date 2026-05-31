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

  // Determine which hours fall in the current turno (based on user's stored local hour)
  function matchesTurno(reminderHour: number): boolean {
    if (turno === 'mañana') return reminderHour >= 4 && reminderHour < 12;
    if (turno === 'tarde') return reminderHour >= 12 && reminderHour < 17;
    return reminderHour >= 17 || reminderHour < 4; // noche
  }

  const todayEntry = await prisma.dailyEntry.findFirst({
    where: { date: todaySpain },
    select: { id: true },
  });
  const devotionalUrl = todayEntry ? '/#inicio' : '/';

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { include: { reminder: true } } },
  });

  // Only notify users whose reminder is enabled (or unset) and whose preferred time
  // falls in the current turno so each user receives at most one notification per day.
  const eligible = subscriptions.filter((s) => {
    const r = s.user.reminder;
    if (r === null) return turno === 'mañana'; // default: morning if no preference set
    if (!r.enabled) return false;
    return matchesTurno(r.hour);
  });

  const completedToday = await prisma.userProgress.findMany({
    where: {
      date: todaySpain,
      completed: true,
      userId: { in: eligible.map((s) => s.userId) },
    },
    select: { userId: true },
  });

  const completedSet = new Set(completedToday.map((p) => p.userId));
  const pending = eligible.filter((s) => !completedSet.has(s.userId));
  const completed = eligible.filter((s) => completedSet.has(s.userId));

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
          requireInteraction: true,
          vibrate: [200, 100, 200],
          badge: '/icons/icon-192.png',
          icon: '/icons/icon-192.png',
        }),
        { urgency: 'high' },
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
