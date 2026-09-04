/**
 * Pantallas de lanzamiento para iOS en modo standalone (PWA).
 * Reemplazan la pantalla nativa (icono sobre fondo oscuro) por el fondo
 * unificado de marca `#1800AD` con el logo ICT, para que el traspaso a la
 * animación de bienvenida (`SplashScreen`) sea sin cortes.
 *
 * Los PNG se generan con `scripts`/scratchpad y viven en `public/splash/ios/`.
 */
type StartupImage = { url: string; media: string };

const q = (dw: number, dh: number, ratio: number) =>
  `screen and (device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;

export const appleStartupImages: StartupImage[] = [
  { url: '/splash/ios/splash-1320x2868.png', media: q(440, 956, 3) },
  { url: '/splash/ios/splash-1290x2796.png', media: q(430, 932, 3) },
  { url: '/splash/ios/splash-1206x2622.png', media: q(402, 874, 3) },
  { url: '/splash/ios/splash-1284x2778.png', media: q(428, 926, 3) },
  { url: '/splash/ios/splash-1179x2556.png', media: q(393, 852, 3) },
  { url: '/splash/ios/splash-1170x2532.png', media: q(390, 844, 3) },
  { url: '/splash/ios/splash-1125x2436.png', media: q(375, 812, 3) },
  { url: '/splash/ios/splash-1242x2688.png', media: q(414, 896, 3) },
  { url: '/splash/ios/splash-828x1792.png', media: q(414, 896, 2) },
  { url: '/splash/ios/splash-1242x2208.png', media: q(414, 736, 3) },
  { url: '/splash/ios/splash-750x1334.png', media: q(375, 667, 2) },
];
