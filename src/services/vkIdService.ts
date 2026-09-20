import * as VKID from '@vkid/sdk';
import type { UserProfile } from './firebase';

export const VK_APP_ID_WEB = 54781535;
export const VK_APP_ID_ANDROID = 54781536;
export const VK_CLIENT_SECRET = 'onvGud3EPvBipAvPz7AK';
export const VK_SERVICE_TOKEN = '74427b5e74427b5e74427b5e0277019d3e7744274427b5e1ef273586bfcddc4a9f3a85e';

export const isNativeAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any)?.Capacitor?.isNativePlatform?.();
};

export const getVkAppId = (): number => {
  const envId = import.meta.env.VITE_VK_APP_ID;
  if (envId && !isNaN(Number(envId))) {
    return Number(envId);
  }
  const storedId = localStorage.getItem('ofmedia_vk_app_id');
  if (storedId && !isNaN(Number(storedId))) {
    return Number(storedId);
  }
  return isNativeAndroid() ? VK_APP_ID_ANDROID : VK_APP_ID_WEB;
};

export const setVkAppId = (id: number | string) => {
  localStorage.setItem('ofmedia_vk_app_id', String(id));
  isInitialized = false;
};

/**
 * The redirect URL registered in the VK ID Console for App 54781535.
 * Must match exactly to prevent VK "Ошибка загрузки" domain verification failure.
 */
export const getRedirectUrl = (): string => {
  return 'https://ofmedia-web.github.io/';
};

let isInitialized = false;

export const initVkId = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  try {
    const appId = getVkAppId();
    const redirectUrl = getRedirectUrl();

    VKID.Config.init({
      app: appId,
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      mode: VKID.ConfigAuthMode.Redirect,
      scope: '',
    });
    isInitialized = true;
  } catch (err) {
    console.warn('VK ID init notice:', err);
  }
};

/**
 * Fetch real user profile from VK API using service token or user token
 */
export const fetchVkUserProfile = async (
  userId: string | number,
  userAccessToken?: string
): Promise<{ displayName: string; photoURL: string | null; firstName: string; lastName: string } | null> => {
  if (!userId) return null;

  // 1. Try Vercel Serverless proxy first
  try {
    const res = await fetch(`/api/vk-user?user_id=${encodeURIComponent(userId)}&token=${encodeURIComponent(userAccessToken || '')}`);
    if (res.ok) {
      const data = await res.json();
      if (data.displayName || data.firstName) {
        return {
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          photoURL: data.photo || null,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        };
      }
    }
  } catch {
    // Fallback to JSONP
  }

  // 2. Client JSONP fallback (works in all browsers without CORS restrictions)
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const callbackName = `vk_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4500);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timer);
      cleanup();
      if (data && data.response && data.response[0]) {
        const u = data.response[0];
        const displayName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        resolve({
          displayName: displayName || `Пользователь VK (${userId})`,
          photoURL: u.photo_200 || null,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
        });
      } else {
        resolve(null);
      }
    };

    const tokenToUse = userAccessToken || VK_SERVICE_TOKEN;
    script.src = `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,first_name,last_name&access_token=${encodeURIComponent(tokenToUse)}&v=5.131&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(null);
    };
    document.head.appendChild(script);
  });
};

export const handleVkAuthPayload = async (payload: any): Promise<UserProfile> => {
  const user = payload?.user || payload;
  const rawId = user?.user_id || user?.id || payload?.user_id;
  const vkId = rawId || `${Date.now()}`;
  const accessToken = payload?.access_token || user?.access_token;

  let firstName = user?.first_name || '';
  let lastName = user?.last_name || '';
  let photo = user?.avatar || user?.photo_200 || null;

  // If name or photo missing, query VK API for real user data
  if ((!firstName || !photo) && rawId) {
    const realProfile = await fetchVkUserProfile(rawId, accessToken);
    if (realProfile) {
      firstName = realProfile.firstName || firstName;
      lastName = realProfile.lastName || lastName;
      photo = realProfile.photoURL || photo;
    }
  }

  const displayName = `${firstName} ${lastName}`.trim() || `Пользователь VK ID (${vkId})`;
  const email = user?.email || payload?.email || `id${vkId}@vk.com`;

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
        skin: VKID.OneTapSkin.Primary,
        showAlternativeLogin: true,
        oauthList: ['ok_ru' as any, 'mail_ru' as any],
        styles: {
          height: 44,
          borderRadius: 12,
        },
      })
      .on(VKID.WidgetEvents.ERROR, (err: any) => {
        console.warn('VK ID OneTap error:', err);
        if (onError) onError(err);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        const code = payload?.code;
        const deviceId = payload?.device_id;
        if (code && deviceId) {
          try {
            const data = await VKID.Auth.exchangeCode(code, deviceId);
            const user = await handleVkAuthPayload(data || payload);
            onSuccess(user);
            return;
          } catch (e) {
            console.warn('exchangeCode fallback to payload:', e);
          }
        }
        const user = await handleVkAuthPayload(payload);
        onSuccess(user);
      });
    return oneTap;
  } catch (err) {
    console.warn('OneTap render error:', err);
    return null;
  }
};

/**
 * Direct VK ID 2.0 Auth flow using official SDK PKCE redirect
 */
export const loginWithVkId = async (): Promise<void> => {
  initVkId();

  try {
    await VKID.Auth.login();
  } catch (e: any) {
    console.warn('VKID.Auth.login error:', e?.message);
  }
};

/**
 * Handle URL parameters after returning from VK ID redirect
 */
export const checkAndHandleVkRedirect = async (): Promise<UserProfile | null> => {
  if (typeof window === 'undefined') return null;

  // 1. Check Search: ?code=...&device_id=...
  if (window.location.search && window.location.search.includes('code=')) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const deviceId = params.get('device_id') || params.get('deviceId') || '';
    const state = params.get('state');

    if (code) {
      initVkId();
      try {
        const data = await VKID.Auth.exchangeCode(code, deviceId);
        const user = await handleVkAuthPayload(data);

        // If returned from external origin (e.g. Vercel), redirect back
        if (state) {
          try {
            const returnUrl = decodeURIComponent(state);
            if (returnUrl.startsWith('http') && !returnUrl.includes(window.location.host)) {
              window.location.href = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}vk_auth=success`;
              return user;
            }
          } catch {}
        }

        window.history.replaceState({}, document.title, window.location.pathname);
        return user;
      } catch (e) {
        console.warn('Code exchange from URL failed:', e);
      }
    }
  }

  // 2. Check Hash: #access_token=...&user_id=...
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    const userId = params.get('user_id');
    const email = params.get('email');

    if (token && userId) {
      const user = await handleVkAuthPayload({
        access_token: token,
        user_id: userId,
        email,
      });

      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return user;
    }
  }

  return null;
};
