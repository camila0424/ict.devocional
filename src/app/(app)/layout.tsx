import { auth } from '@/lib/auth';
import { TabBar } from '@/components/navigation/TabBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RightPanel } from '@/components/shared/RightPanel';
import { InstallBanner } from '@/components/shared/InstallBanner';
import { NotificationBannerClient } from '@/components/shared/NotificationBannerClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name?.split(' ')[0] ?? '';
  const userInitial = (session?.user?.name?.[0] ?? '?').toUpperCase();

  return (
    <div className="bg-background flex min-h-dvh md:bg-[#F8FAFF]">
      <InstallBanner />
      <NotificationBannerClient />
      <Sidebar userName={userName} userInitial={userInitial} />
      <div className="flex flex-1 justify-center">
        <div className="bg-background flex min-h-dvh w-full flex-col overflow-x-clip pb-20 md:max-w-170 md:pb-0 md:shadow-[0_0_48px_rgba(0,0,0,0.07)]">
          <main className="flex-1">{children}</main>
          <TabBar />
        </div>
      </div>
      <RightPanel />
    </div>
  );
}
