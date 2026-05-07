import { redirect } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { auth, signOut } from '@/lib/auth';
import { ReminderPicker } from '@/components/profile/ReminderPicker';
import { PushSubscribeButton } from '@/components/profile/PushSubscribeButton';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const name = session.user.name ?? 'Usuario';
  const email = session.user.email ?? '';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4 p-5 pb-8">
      <h1 className="text-2xl font-extrabold">Mi perfil</h1>

      {/* Card usuario */}
      <div className="border-border bg-surface flex items-center gap-4 rounded-2xl border p-5">
        <div className="bg-primary-light text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-black">
          {initials || <User size={24} />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{name}</p>
          <p className="text-muted truncate text-sm">{email}</p>
        </div>
      </div>

      {/* Recordatorio */}
      <ReminderPicker />

      {/* Notificaciones push */}
      <PushSubscribeButton />

      {/* Cerrar sesión */}
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98] dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
