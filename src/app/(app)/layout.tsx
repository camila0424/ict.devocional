import { TabBar } from '@/components/navigation/TabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-20">
      <main className="flex-1">{children}</main>
      <TabBar />
    </div>
  );
}
