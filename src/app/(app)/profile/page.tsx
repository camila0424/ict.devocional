import { redirect } from 'next/navigation';
import { User } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ReminderPicker } from '@/components/profile/ReminderPicker';
import { PushSubscribeButton } from '@/components/profile/PushSubscribeButton';
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton';
import { SignOutButton } from '@/components/profile/SignOutButton';

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
      <SignOutButton />

      <DeleteAccountButton />
    </div>
  );
}
