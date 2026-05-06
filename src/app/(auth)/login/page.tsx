'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error('Correo o contraseña incorrectos');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-8 flex flex-col items-center gap-2">
        <img
          src="/icons/icon-192.png"
          width={80}
          height={80}
          className="mx-auto mb-4 rounded-2xl"
        />
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          {Strings.auth.loginTitle}
        </h1>
        <p className="text-muted text-sm">Tu camino diario con Dios te espera</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{Strings.auth.emailLabel}</label>
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{Strings.auth.passwordLabel}</label>
          <div className="relative">
            <Lock className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'bg-surface w-full rounded-xl border py-3 pr-10 pl-10 text-sm transition-colors outline-none',
                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
                errors.password ? 'border-[var(--color-error)]' : 'border-border',
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
          {errors.password && (
            <span className="text-xs text-[var(--color-error)]">{errors.password.message}</span>
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
          {Strings.auth.loginButton}
        </motion.button>
      </form>

      <p className="text-muted mt-6 text-center text-sm">
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-semibold text-[var(--color-primary)] hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </motion.div>
  );
}
