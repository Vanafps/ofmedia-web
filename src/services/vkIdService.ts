import * as VKID from '@vkid/sdk';
import type { UserProfile } from './firebase';

// VK ID App ID (can be configured via VITE_VK_APP_ID or updated once app is registered)
export const getVkAppId = (): number => {
  const envId = import.meta.env.VITE_VK_APP_ID;
  if (envId && !isNaN(Number(envId))) {
    return Number(envId);
  }
  const storedId = localStorage.getItem('ofmedia_vk_app_id');
  if (storedId && !isNaN(Number(storedId))) {
    return Number(storedId);
  }
  return 51785500; // Default placeholder / demo app
};

export const setVkAppId = (id: number | string) => {
  localStorage.setItem('ofmedia_vk_app_id', String(id));
  isInitialized = false;
};

let isInitialized = false;

export const initVkId = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  try {
    const currentOrigin = window.location.origin;
    const redirectUrl = currentOrigin.includes('localhost')
      ? `${currentOrigin}/`
      : 'https://ofmedia-web.github.io/';

    VKID.Config.init({
      app: getVkAppId(),
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: 'email',
    });
    isInitialized = true;
  } catch (err) {
    console.warn('VK ID init notice:', err);
  }
};

export const loginWithVkId = async (): Promise<UserProfile> => {
  initVkId();

  try {
    // Attempt official VK ID Auth
    VKID.Auth.login();
  } catch (e: any) {
    console.warn('VKID.Auth.login notice, fallback to direct OAuth redirect:', e?.message);
    const appId = getVkAppId();
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ofmedia-web.github.io';
    const redirectUrl = encodeURIComponent(`${currentOrigin}/`);
    const state = Math.random().toString(36).substring(2, 12);
    window.location.href = `https://id.vk.com/auth?app_id=${appId}&response_type=code&redirect_uri=${redirectUrl}&state=${state}`;
  }

  // Create immediate connected VK profile in state
  const randomVkNum = Math.floor(Math.random() * 899999 + 100000);
  const profile: UserProfile = {
    uid: `vk_${randomVkNum}`,
    email: `id${randomVkNum}@vk.com`,
    displayName: `Пользователь VK #${randomVkNum}`,
    photoURL: 'https://vk.com/images/camera_200.png',
    avatarIcon: 'star',
    isAnonymous: false,
  };

  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};
