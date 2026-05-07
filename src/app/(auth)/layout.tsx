import { InstallBanner } from '@/components/shared/InstallBanner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6">
      <InstallBanner />
      {children}
    </div>
  );
}
