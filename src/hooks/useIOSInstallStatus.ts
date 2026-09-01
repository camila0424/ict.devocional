'use client';

import { useState } from 'react';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export function useIOSInstallStatus() {
  const [isIOS] = useState(
    () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent),
  );
  const [isStandalone] = useState(
    () =>
      typeof window !== 'undefined' &&
      (navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches),
  );

  return { isIOS, isStandalone };
}
