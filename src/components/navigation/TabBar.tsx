'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

const tabs = [
  { href: '/', label: Strings.tabs.home, icon: Home },
  { href: '/plan', label: Strings.tabs.plan, icon: BookOpen },
  { href: '/progress', label: Strings.tabs.progress, icon: BarChart3 },
  { href: '/profile', label: Strings.tabs.profile, icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <ul className="mx-auto flex max-w-md justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors',
                  active ? 'text-[var(--color-primary)]' : 'text-muted',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-2xl bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-dark)]/40"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={22} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
