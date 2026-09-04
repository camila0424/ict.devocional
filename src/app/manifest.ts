import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ICT Devocional',
    short_name: 'ICT',
    description: 'Tu camino diario con Dios — Iglesia ICT Vitoria-Gasteiz',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1800AD',
    theme_color: '#1800AD',
    icons: [
      {
        src: '/icons/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['lifestyle', 'education'],
    lang: 'es-ES',
  };
}
