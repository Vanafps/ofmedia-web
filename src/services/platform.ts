import { Capacitor } from '@capacitor/core';

/**
 * Platform Detection & Environment Separation
 * Eliminates ad-hoc runtime sniffing across the application.
 */

export const isStandalonePwa = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any)?.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const isMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Explicit build target override
  if (import.meta.env.VITE_TARGET === 'web') {
    return false;
  }
  if (import.meta.env.VITE_TARGET === 'mobile') {
    return true;
  }

  // 2. Runtime native Capacitor / Android bridge checks ONLY
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {}

  const anyWindow = window as any;
  if (
    anyWindow?.Capacitor?.isNativePlatform?.() ||
    anyWindow?.AndroidScreen?.isNative?.() ||
    window.location.protocol === 'capacitor:'
  ) {
    return true;
  }

  return false;
};

export const isWeb = (): boolean => !isMobileApp();

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const isTelegramMiniApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const anyWindow = window as any;
  return !!(
    anyWindow?.Telegram?.WebApp?.initData ||
    anyWindow?.TelegramWebviewProxy ||
    new URLSearchParams(window.location.search).has('tgWebAppData') ||
    window.location.hash.includes('tgWebAppData')
  );
};
