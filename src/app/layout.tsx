import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';
import { Strings } from '@/constants/strings';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: Strings.app.name,
  description: Strings.app.tagline,
  applicationName: 'ICT Devocional',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ICT',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/Logo_mobil_fondo_azul.png', sizes: '192x192' },
    ],
    apple: '/icons/Logo_mobil_fondo_azul.png',
  },
  openGraph: {
    title: Strings.app.name,
    description: Strings.app.tagline,
    siteName: 'ICT Devocional',
    images: [
      {
        url: '/icons/Logo_mobil_fondo_blanco.png',
        width: 512,
        height: 512,
        alt: 'ICT Devocional',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: Strings.app.name,
    description: Strings.app.tagline,
    images: ['/icons/Logo_mobil_fondo_blanco.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
