import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  customWorkerSrc: 'sw-custom.js',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true, // ← aquí
    clientsClaim: true, // ← aquí
  },
});

export default withPWA({
  reactStrictMode: true,
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'motion'],
  },
});
