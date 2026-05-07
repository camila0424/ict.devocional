'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Strings } from '@/constants/strings';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
    email: z.string().email('Correo inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    });

    const json: unknown = await res.json();

    if (!res.ok) {
      const error = json as { error?: string };
      toast.error(error.error ?? Strings.errors.generic);
      return;
    }

    const loginResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (loginResult?.error) {
      toast.error(
        'Cuenta creada, pero hubo un error al iniciar sesión. Inicia sesión manualmente.',
      );
      router.push('/login');
      return;
    }

    toast.success('¡Bienvenido a ICT Devocional! 🔥');
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
          src="/icons/android-chrome-192x192.png"
          width={80}
          height={80}
          style={{ borderRadius: '20px' }}
          alt="ICT"
        />
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          {Strings.auth.registerTitle}
        </h1>
        <p className="text-muted text-sm">Únete a la comunidad ICT</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nombre</label>
          <div className="relative">
            <User className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              {...register('name')}
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              className={cn(
                'bg-surface w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-colors outline-none',
                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
                errors.name ? 'border-[var(--color-error)]' : 'border-border',
              )}
            />
          </div>
          {errors.name && (
            <span className="text-xs text-[var(--color-error)]">{errors.name.message}</span>
          )}
        </div>

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
              autoComplete="new-password"
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                'bg-surface w-full rounded-xl border py-3 pr-4 pl-10 text-sm transition-colors outline-none',
                'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]',
                errors.confirmPassword ? 'border-[var(--color-error)]' : 'border-border',
              )}
            />
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
          {Strings.auth.registerButton}
        </motion.button>
      </form>

      <p className="text-muted mt-6 text-center text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </motion.div>
  );
}
