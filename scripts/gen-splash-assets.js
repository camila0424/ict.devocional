// One-off generator for the brand-blue PWA icons and iOS startup images that
// make the native OS launch frame match frame 0 of SplashScreen.tsx exactly.
// Run with: node scripts/gen-splash-assets.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BRAND = '#1800AD';
const LOGO = path.join(__dirname, '..', 'public', 'splash', 'ict-logo-white.png');

async function makeIcon(size, logoWidth, outPath) {
  const logoHeight = Math.round((409 / 1005) * logoWidth);
  const logo = await sharp(LOGO).resize(logoWidth, logoHeight).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

async function makeStartup(w, h, outPath) {
  await sharp({ create: { width: w, height: h, channels: 4, background: BRAND } })
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

async function main() {
  // Android manifest icons — logo kept inside the maskable safe zone (~80%
  // centered circle) so Chrome's adaptive-icon mask never clips it.
  fs.mkdirSync(path.join(__dirname, '..', 'public', 'icons'), { recursive: true });
  await makeIcon(512, 340, path.join(__dirname, '..', 'public', 'icons', 'pwa-512.png'));
  await makeIcon(192, 128, path.join(__dirname, '..', 'public', 'icons', 'pwa-192.png'));
  await makeIcon(
    512,
    340,
    path.join(__dirname, '..', 'public', 'icons', 'pwa-maskable-512.png')
  );

  // iOS startup images — flat brand-blue, matching frame 0 of SplashScreen.tsx
  // (no logo: the real logo is still clip-hidden at t=0).
  const outDir = path.join(__dirname, '..', 'public', 'splash', 'ios');
  fs.mkdirSync(outDir, { recursive: true });
  const sizes = [
    [1320, 2868], [1290, 2796], [1206, 2622], [1284, 2778], [1179, 2556],
    [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792], [1242, 2208], [750, 1334],
  ];
  for (const [w, h] of sizes) {
    await makeStartup(w, h, path.join(outDir, `splash-${w}x${h}.png`));
  }
}

main();
