'use client';
import dynamic from 'next/dynamic';

const IOSInstallBanner = dynamic(
  () => import('@/components/shared/IOSInstallBanner').then((m) => m.IOSInstallBanner),
  { ssr: false },
);

export function IOSInstallBannerClient() {
  return <IOSInstallBanner />;
}
