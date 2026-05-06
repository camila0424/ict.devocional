import { TabBar } from '@/components/navigation/TabBar';
import { Sidebar } from '@/components/navigation/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center md:bg-[#F1F5F9]">
      <Sidebar />
      <div className="bg-background flex min-h-dvh w-full max-w-md flex-col pb-20 md:pb-0 md:shadow-[0_0_48px_rgba(0,0,0,0.07)]">
        <main className="flex-1">{children}</main>
        <TabBar />
      </div>
    </div>
  );
}
