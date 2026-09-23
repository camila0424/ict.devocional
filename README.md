This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ⚠️ Base de datos — leer antes de tocar el schema

`DATABASE_URL` en `.env.local` apunta **directo a la base de producción real en Neon** (Postgres). No hay una base separada para desarrollo local — cualquier comando que corras localmente afecta los datos reales de los usuarios.

**Regla:** para cualquier cambio de `prisma/schema.prisma`, usa siempre:

```bash
npx prisma db push
```

**Nunca** uses `npx prisma migrate dev` ni `npx prisma migrate reset` contra esta base. Este proyecto nunca adoptó el sistema de migraciones de Prisma (el historial en `_prisma_migrations` no está sincronizado con el estado real de la base), así que esos comandos detectan "drift" y ofrecen **resetear la base entera** (borrar y recrear todas las tablas) para poder aplicar una migración "inicial" limpia. Ya pasó una vez — se perdieron todos los usuarios y el contenido devocional hasta que se restauró desde un backup de Neon.

Si esto llega a pasar de nuevo: Neon guarda historial para restaurar (Backup & Restore → Restore from history), pero en el plan gratuito **solo cubre las últimas 6 horas** — hay que actuar rápido.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
