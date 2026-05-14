'use client';
import dynamic from 'next/dynamic';

const NotificationBanner = dynamic(
  () => import('@/components/shared/NotificationBanner').then((m) => m.NotificationBanner),
  { ssr: false },
);

export function NotificationBannerClient() {
  return <NotificationBanner />;
}
