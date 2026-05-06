'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

const tabs = [
  { href: '/', label: Strings.tabs.home, icon: Home },
  { href: '/plan', label: Strings.tabs.plan, icon: BookOpen },
  { href: '/progress', label: Strings.tabs.progress, icon: BarChart3 },
  { href: '/profile', label: Strings.tabs.profile, icon: User },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-background sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-3 py-6 md:flex">
      <div className="mb-8 px-2">
        <p className="text-muted text-[10px] font-semibold tracking-widest uppercase">ICT</p>
        <h2 className="text-lg font-extrabold text-[var(--color-primary)]">Devocional</h2>
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
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-muted hover:bg-[var(--color-primary-light)]/60 hover:text-[var(--color-primary)]',
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
