import { Capacitor } from '@capacitor/core';

/**
 * Platform Detection & Environment Separation
 * Eliminates ad-hoc runtime sniffing across the application.
 */

export const isMobileApp = (): boolean => {
  // 1. Check build target flag set via Vite mode (--mode mobile)
  if (import.meta.env.VITE_TARGET === 'mobile') {
    return true;
  }
  if (import.meta.env.VITE_TARGET === 'web') {
    return false;
  }

  // 2. Fallback runtime Capacitor check for native Android/iOS shell
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {}

  return (
    !!(window as any)?.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    ((window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.hostname === 'localhost' && !window.location.port)
  );
};

export const isWeb = (): boolean => !isMobileApp();

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
