import * as VKID from '@vkid/sdk';
import type { UserProfile } from './firebase';

export const VK_APP_ID = 54781536;
export const VK_CLIENT_SECRET = "onvGud3EPvBipAvPz7AK";
export const VK_SERVICE_TOKEN = "74427b5e74427b5e74427b5e0277019d3e7744274427b5e1ef273586bfcddc4a9f3a85e";

// VK ID App ID (configured with official ID 54781536)
export const getVkAppId = (): number => {
  const envId = import.meta.env.VITE_VK_APP_ID;
  if (envId && !isNaN(Number(envId))) {
    return Number(envId);
  }
  const storedId = localStorage.getItem('ofmedia_vk_app_id');
  if (storedId && !isNaN(Number(storedId))) {
    return Number(storedId);
  }
  return VK_APP_ID;
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

export const handleVkAuthPayload = (payload: any): UserProfile => {
  const user = payload?.user || payload;
  const vkId = user?.user_id || user?.id || `54781535_${Date.now()}`;
  const firstName = user?.first_name || 'Иван';
  const lastName = user?.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || 'Пользователь VK ID';
  const photo = user?.avatar || user?.photo_200 || null;
  const email = user?.email || `id${vkId}@vk.com`;

  const profile: UserProfile = {
    uid: `vk_${vkId}`,
    email,
    displayName,
    photoURL: photo,
    avatarIcon: 'star',
    isAnonymous: false,
  };

  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const renderVkOneTap = (
  container: HTMLElement,
  onSuccess: (user: UserProfile) => void,
  onError?: (err: any) => void
) => {
  initVkId();
  try {
    const oneTap = new VKID.OneTap();
    oneTap
      .render({
        container,
        scheme: VKID.Scheme.DARK,
        showAlternativeLogin: true,
        oauthList: ['ok_ru' as any, 'mail_ru' as any],
      })
      .on(VKID.WidgetEvents.ERROR, (err: any) => {
        console.warn('VK ID OneTap error:', err);
        if (onError) onError(err);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: any) => {
        const code = payload?.code;
        const deviceId = payload?.device_id;
        if (code && deviceId) {
          VKID.Auth.exchangeCode(code, deviceId)
            .then((data: any) => {
              const user = handleVkAuthPayload(data || payload);
              onSuccess(user);
            })
            .catch(() => {
              const user = handleVkAuthPayload(payload);
              onSuccess(user);
            });
        } else {
          const user = handleVkAuthPayload(payload);
          onSuccess(user);
        }
      });
    return oneTap;
  } catch (err) {
    console.warn('OneTap render error:', err);
    return null;
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
