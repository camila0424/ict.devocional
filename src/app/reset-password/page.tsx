'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const requestSchema = z.object({
  email: z.string().email('Correo inválido'),
});

const confirmSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RequestForm = z.infer<typeof requestSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

function RequestResetForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (data: RequestForm) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error('Algo salió mal. Intenta de nuevo.');
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-sm">
          Si ese correo está registrado, recibirás un enlace en breve. Revisa tu bandeja de entrada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Correo electrónico</label>
        <div className="relative">
          <Mail className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className={cn(
              'bg-surface w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-colors outline-none',
              'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
              errors.email ? 'border-[var(--color-error)]' : 'border-border',
            )}
          />
        </div>
        {errors.email && (
          <span className="text-xs text-[var(--color-error)]">{errors.email.message}</span>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'mt-2 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-colors',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]',
          isSubmitting && 'opacity-70',
        )}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar instrucciones
      </motion.button>
    </form>
  );
}

function ConfirmResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) });

  const onSubmit = async (data: ConfirmForm) => {
    const res = await fetch('/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: data.newPassword }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      toast.error(json.error ?? 'Token inválido o expirado.');
      return;
    }

    toast.success('Contraseña actualizada. Inicia sesión.');
    router.push('/login');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nueva contraseña</label>
        <div className="relative">
          <Lock className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            {...register('newPassword')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn(
              'bg-surface w-full rounded-xl border py-3 pr-10 pl-10 text-sm transition-colors outline-none',
              'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
              errors.newPassword ? 'border-[var(--color-error)]' : 'border-border',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="text-muted absolute top-1/2 right-3 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <span className="text-xs text-[var(--color-error)]">{errors.newPassword.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Confirmar contraseña</label>
        <div className="relative">
          <Lock className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            {...register('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn(
              'bg-surface w-full rounded-xl border py-3 pr-10 pl-10 text-sm transition-colors outline-none',
              'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
              errors.confirmPassword ? 'border-[var(--color-error)]' : 'border-border',
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="text-muted absolute top-1/2 right-3 -translate-y-1/2"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="text-xs text-[var(--color-error)]">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'mt-2 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-colors',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]',
          isSubmitting && 'opacity-70',
        )}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Cambiar contraseña
      </motion.button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-surface w-full max-w-sm rounded-2xl p-8 shadow-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-2">
          <div
            style={{
              background: 'white',
              borderRadius: '50%',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              flexShrink: 0,
            }}
          >
            <img
              src="/icons/icon-192.png"
              width={36}
              height={36}
              style={{ borderRadius: '50%' }}
              alt="ICT"
            />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            {token ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h1>
          <p className="text-muted text-center text-sm">
            {token
              ? 'Elige una contraseña nueva para tu cuenta'
              : 'Te enviaremos un enlace para restablecer tu contraseña'}
          </p>
        </div>

        {token ? <ConfirmResetForm token={token} /> : <RequestResetForm />}
      </motion.div>
    </div>
  );
}
