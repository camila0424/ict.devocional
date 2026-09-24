import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { getRecordatorio, getFraseDelDia } from '@/constants/phrases';

const CUSTOM_TIME_WINDOW_MINUTES = 8;

function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function sendReminders() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const nowSpain = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const todaySpain = new Date(nowSpain.getFullYear(), nowSpain.getMonth(), nowSpain.getDate());
  const dateKey = dateKeyOf(nowSpain);

  // De madrugada no hay turno: antes las horas 0–5 contaban como "mañana", así que el primer
  // cron tras la medianoche mandaba el recordatorio a las 00:00 y el de las 6:00 quedaba deduplicado.
  const hourSpain = nowSpain.getHours();
  const turno: 'mañana' | 'tarde' | 'noche' | null =
    hourSpain < 6 ? null : hourSpain < 14 ? 'mañana' : hourSpain < 19 ? 'tarde' : 'noche';

  // Determine which hours fall in the current turno (based on user's stored local hour)
  function matchesTurno(reminderHour: number): boolean {
    if (turno === 'mañana') return reminderHour >= 4 && reminderHour < 12;
    if (turno === 'tarde') return reminderHour >= 12 && reminderHour < 17;
    return reminderHour >= 17 || reminderHour < 4; // noche
  }

  // True if `nowSpain` falls within CUSTOM_TIME_WINDOW_MINUTES of the user's exact chosen time.
  function matchesExactTime(hour: number, minute: number): boolean {
    const target = new Date(nowSpain);
    target.setHours(hour, minute, 0, 0);
    const diffMs = Math.abs(nowSpain.getTime() - target.getTime());
    return diffMs <= CUSTOM_TIME_WINDOW_MINUTES * 60 * 1000;
  }

  const todayEntry = await prisma.dailyEntry.findFirst({
    where: { date: todaySpain },
    select: { id: true },
  });
  const devotionalUrl = todayEntry ? '/#inicio' : '/';

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { include: { reminder: true } } },
  });

  const alreadySent = await prisma.notificationLog.findMany({
    where: { dateKey, subscriptionId: { in: subscriptions.map((s) => s.id) } },
    select: { subscriptionId: true, slot: true },
  });
  const sentSet = new Set(alreadySent.map((n) => `${n.subscriptionId}:${n.slot}`));

  // Recordatorio ligado a los cron jobs (mañana/tarde/noche), como antes — pero deduplicado
  // para que no se repita si más de un cron cae en la misma ventana el mismo día.
  const turnoEligible = subscriptions.filter((s) => {
    if (turno === null) return false;
    const r = s.user.reminder;
    const isElegible = r === null ? turno === 'mañana' : r.enabled && matchesTurno(r.hour);
    return isElegible && !sentSet.has(`${s.id}:${turno}`);
  });

  // Recordatorio a la hora exacta que el usuario eligió (además del de turno, no en su lugar).
  const customEligible = subscriptions.filter((s) => {
    const r = s.user.reminder;
    if (!r?.enabled) return false;
    return matchesExactTime(r.hour, r.minute) && !sentSet.has(`${s.id}:custom`);
  });

  const toNotify = [
    ...turnoEligible.map((s) => ({ sub: s, slot: turno as string })),
    ...customEligible.map((s) => ({ sub: s, slot: 'custom' })),
  ];

  const completedToday = await prisma.userProgress.findMany({
    where: {
      date: todaySpain,
      completed: true,
      userId: { in: toNotify.map(({ sub }) => sub.userId) },
    },
    select: { userId: true },
  });

  const completedSet = new Set(completedToday.map((p) => p.userId));
  // Los avisos a hora exacta de madrugada usan el texto de la noche
  const recordatorio = getRecordatorio(turno ?? 'noche');
  const fraseDelDia = getFraseDelDia(nowSpain);

  const send = (
    sub: (typeof subscriptions)[0],
    slot: string,
    title: string,
    body: string,
    url: string,
  ) =>
    webpush
      .sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title,
          body,
          url,
          requireInteraction: true,
          vibrate: [300, 150, 300, 150, 300],
          badge: '/icons/icon-192.png',
          icon: '/icons/icon-192.png',
          tag: `ict-${slot}`,
          renotify: true,
          silent: false,
          actions: [{ action: 'open', title: 'Abrir devocional' }],
        }),
        { urgency: 'high' },
      )
      .then(() =>
        prisma.notificationLog.upsert({
          where: { subscriptionId_slot_dateKey: { subscriptionId: sub.id, slot, dateKey } },
          update: {},
          create: { subscriptionId: sub.id, slot, dateKey },
        }),
      )
      .catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      });

  const results = await Promise.allSettled(
    toNotify.map(({ sub, slot }) => {
      const isCompleted = completedSet.has(sub.userId);
      return isCompleted
        ? send(sub, slot, 'ICT Devocional ✨', fraseDelDia, '/')
        : send(sub, slot, 'ICT Devocional 🙏', recordatorio, devotionalUrl);
    }),
  );

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
    total: subscriptions.length,
  };
}
