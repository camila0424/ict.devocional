'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

type Props = {
  userName?: string;
  userInitial?: string;
};

const tabs = [
  { href: '/', label: Strings.tabs.home, icon: Home },
  { href: '/plan', label: Strings.tabs.plan, icon: BookOpen },
  { href: '/progress', label: Strings.tabs.progress, icon: BarChart3 },
  { href: '/profile', label: Strings.tabs.profile, icon: User },
] as const;

export function Sidebar({ userName, userInitial }: Props) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 flex-col bg-[#1E3A8A] px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img
          src="/icons/android-chrome-192x192.png"
          width={40}
          height={40}
          style={{ borderRadius: '10px' }}
          alt="ICT"
        />
        <h2 className="text-base font-extrabold text-white">ICT Devocional</h2>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {userName && (
        <div className="mt-auto flex items-center gap-3 px-2 pt-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {userInitial}
          </div>
          <span className="truncate text-sm font-medium text-blue-100">{userName}</span>
        </div>
      )}
    </aside>
  );
}
