'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Navegamos nosotros en vez de dejar que Auth.js redirija: su redirección usa AUTH_URL,
  // que puede apuntar a un despliegue que ya no existe y acabar en un 404.
  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      toast.success('Esperamos verte pronto 👋');
      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('No se pudo cerrar sesión');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98] disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
      Cerrar sesión
    </button>
  );
}
