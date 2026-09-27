import type { UserProfile } from './firebase';

/**
 * Telegram WebApp API Integration Service
 * Provides typed helpers for running OFMEDIA inside Telegram Mini Apps.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export function getTelegramWebApp(): any | null {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  return anyWindow?.Telegram?.WebApp || null;
}

export function isTelegramWebApp(): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;
  return Boolean(
    tg.initData ||
    (window as any)?.TelegramWebviewProxy ||
    new URLSearchParams(window.location.search).has('tgWebAppData') ||
    window.location.hash.includes('tgWebAppData')
  );
}

/**
 * Initialize Telegram WebApp runtime
 * Configures full expansion, brand colors, closing confirmation, and full screen
 */
export function initTelegramWebApp(): void {
  if (typeof window === 'undefined') return;
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();

    // Set dark obsidian header & background matching OFMEDIA aesthetic
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#070709');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#070709');
    }

    // Prevent accidental swipe-down closure while watching videos
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }

    // Telegram 8.0+ Fullscreen support
    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen();
    }
  } catch (err) {
    console.warn('[Telegram WebApp] Initialization notice:', err);
  }
}

/**
 * Extract authenticated Telegram user profile from initDataUnsafe
 */
export function getTelegramUser(): UserProfile | null {
  const tg = getTelegramWebApp();
  if (!tg || !tg.initDataUnsafe?.user) return null;

  const user: TelegramUser = tg.initDataUnsafe.user;
  const nameParts = [user.first_name, user.last_name].filter(Boolean);
  const displayName = nameParts.length > 0 ? nameParts.join(' ') : (user.username || 'Пользователь Telegram');

  return {
    uid: `tg_${user.id}`,
    email: null,
    displayName,
    username: user.username ? `@${user.username}` : null,
    photoURL: user.photo_url || null,
    isAnonymous: false
  };
}

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Trigger native Telegram haptic feedback
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  const tg = getTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;

  try {
    if (style === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (style === 'success' || style === 'warning' || style === 'error') {
      tg.HapticFeedback.notificationOccurred(style);
    } else {
      tg.HapticFeedback.impactOccurred(style);
    }
  } catch {
    // Ignore environments where haptic is unsupported
  }
}

let activeBackHandler: (() => void) | null = null;

/**
 * Bind callback to native Telegram hardware/header BackButton
 */
export function setupTelegramBackButton(onBack: () => void): void {
  const tg = getTelegramWebApp();
  if (!tg || !tg.BackButton) return;

  try {
    if (activeBackHandler) {
      tg.BackButton.offClick(activeBackHandler);
    }
    activeBackHandler = onBack;
    tg.BackButton.onClick(activeBackHandler);
    tg.BackButton.show();
  } catch {}
}

/**
 * Hide Telegram BackButton when at root level
 */
export function hideTelegramBackButton(): void {
  const tg = getTelegramWebApp();
  if (!tg || !tg.BackButton) return;

  try {
    if (activeBackHandler) {
      tg.BackButton.offClick(activeBackHandler);
      activeBackHandler = null;
    }
    tg.BackButton.hide();
  } catch {}
}

/**
 * Open external URL or Telegram link
 */
export function openTelegramLink(url: string): void {
  const tg = getTelegramWebApp();
  if (tg) {
    if (url.startsWith('https://t.me/') && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(url);
      return;
    }
    if (typeof tg.openLink === 'function') {
      tg.openLink(url);
      return;
    }
  }
  window.open(url, '_blank');
}
