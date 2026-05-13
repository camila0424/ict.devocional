import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ICT Devocional',
    short_name: 'ICT',
    description: 'Tu camino diario con Dios — Iglesia ICT Vitoria-Gasteiz',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0F172A',
    theme_color: '#1E40AF',
    icons: [
      {
        src: '/icons/Logo_mobil_fondo_blanco.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/Logo_mobil_fondo_blanco.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['lifestyle', 'education'],
    lang: 'es-ES',
  };
}
