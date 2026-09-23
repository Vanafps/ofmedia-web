import * as VKID from '@vkid/sdk';
import type { UserProfile } from './firebase';

export const VK_APP_ID_WEB = 54781535;
export const VK_APP_ID_ANDROID = 54781536;
export const VK_CLIENT_SECRET = 'onvGud3EPvBipAvPz7AK';
export const VK_SERVICE_TOKEN = '74427b5e74427b5e74427b5e0277019d3e7744274427b5e1ef273586bfcddc4a9f3a85e';

import { isMobileApp } from './platform';

export const isNativeAndroid = isMobileApp;

export const getVkAppId = (): number => {
  const envId = import.meta.env.VITE_VK_APP_ID;
  if (envId && !isNaN(Number(envId))) {
    return Number(envId);
  }
  const storedId = localStorage.getItem('ofmedia_vk_app_id');
  if (storedId && !isNaN(Number(storedId))) {
    return Number(storedId);
  }
  return isMobileApp() ? VK_APP_ID_ANDROID : VK_APP_ID_WEB;
};

export const setVkAppId = (id: number | string) => {
  localStorage.setItem('ofmedia_vk_app_id', String(id));
  isInitialized = false;
};

/**
 * The redirect URL registered in the VK ID Console.
 */
export const getRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://ofmedia.vercel.app/';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return isMobileApp() ? 'https://ofmedia.vercel.app/' : `${window.location.origin}/`;
    }
  }
  return 'https://ofmedia-web.github.io/';
};

let isInitialized = false;

export const initVkId = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  try {
    const appId = getVkAppId();
    const redirectUrl = getRedirectUrl();
    const isMobile = isMobileApp() || (typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window));

    VKID.Config.init({
      app: appId,
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      mode: isMobile ? VKID.ConfigAuthMode.Redirect : VKID.ConfigAuthMode.InNewWindow,
      scope: '',
    });
    isInitialized = true;
  } catch (err) {
    console.warn('VK ID init notice:', err);
  }
};

/**
 * Fetch real user profile from VK API using service token with permanent access
 */
export const fetchVkUserProfile = async (
  userId: string | number
): Promise<{ displayName: string; photoURL: string | null; firstName: string; lastName: string; username?: string } | null> => {
  if (!userId) return null;

  // 1. Client JSONP (works directly with VK API using permanent service token without CORS)
  const jsonpPromise = new Promise<{ displayName: string; photoURL: string | null; firstName: string; lastName: string; username?: string } | null>((resolve) => {
    if (typeof document === 'undefined') return resolve(null);
    const callbackName = `vk_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      try {
        delete (window as any)[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      } catch {}
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
        const firstName = u.first_name || '';
        const lastName = u.last_name || '';
        const displayName = `${firstName} ${lastName}`.trim();
        const photo = u.photo_200 || u.photo_max || null;
        const username = u.domain || u.screen_name || '';
        resolve({
          displayName: displayName || (username ? `@${username}` : `id${userId}`),
          photoURL: photo,
          firstName,
          lastName,
          username,
        });
      } else {
        resolve(null);
      }
    };

    script.src = `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=photo_200,photo_max,first_name,last_name,domain,screen_name&access_token=${VK_SERVICE_TOKEN}&v=5.131&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(null);
    };
    document.head.appendChild(script);
  });

  const jsonpData = await jsonpPromise;
  if (jsonpData && (jsonpData.displayName || jsonpData.photoURL)) {
    return jsonpData;
  }

  // 2. Serverless proxy fallback
  try {
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const apiUrl = isVercel
      ? `/api/vk-user?user_id=${encodeURIComponent(userId)}`
      : `https://ofmedia.vercel.app/api/vk-user?user_id=${encodeURIComponent(userId)}`;

    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.displayName || data.firstName || data.photo)) {
        return {
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          photoURL: data.photo || null,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
        };
      }
    }
  } catch (e) {
    console.warn('Vercel VK API proxy notice:', e);
  }

  return null;
};

export const handleVkAuthPayload = async (payload: any): Promise<UserProfile> => {
  const user = payload?.user || payload;
  let rawId = user?.user_id || user?.id || payload?.user_id || payload?.userId;

  let firstName = user?.first_name || '';
  let lastName = user?.last_name || '';
  let photo = user?.avatar || user?.photo_200 || null;
  let username = user?.domain || user?.screen_name || '';
  let email = user?.email || payload?.email || '';

  // 1. Safely decode JWT id_token if present (extracts real numeric VK ID from sub)
  try {
    const idToken = payload?.id_token || user?.id_token || payload?.token?.id_token;
    if (idToken && typeof idToken === 'string' && idToken.includes('.')) {
      const parts = idToken.split('.');
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const jsonStr = decodeURIComponent(
          atob(padded)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const parsed = JSON.parse(jsonStr);
        if (!rawId) {
          rawId = parsed.sub || parsed.user_id;
        }
        firstName = firstName || parsed.first_name || parsed.given_name || '';
        lastName = lastName || parsed.last_name || parsed.family_name || '';
        photo = photo || parsed.avatar || parsed.picture || parsed.photo_200 || null;
        if (parsed.email) email = parsed.email;
      }
    }
  } catch (e) {
    console.warn('id_token decode notice:', e);
  }

  // 2. If access token is available, attempt SDK userInfo call
  if ((!firstName || !photo) && payload?.access_token) {
    try {
      const uInfo = await VKID.Auth.userInfo(payload.access_token);
      if (uInfo?.user) {
        if (!rawId && uInfo.user.user_id) rawId = uInfo.user.user_id;
        if (uInfo.user.first_name) firstName = uInfo.user.first_name;
        if (uInfo.user.last_name) lastName = uInfo.user.last_name;
        if (uInfo.user.avatar) photo = uInfo.user.avatar;
        if (uInfo.user.email) email = uInfo.user.email;
      }
    } catch (e) {
      console.warn('VKID userInfo notice:', e);
    }
  }

  // 3. Always fetch real user profile directly from VK API if user ID exists
  if (rawId) {
    try {
      const realProfile = await fetchVkUserProfile(rawId);
      if (realProfile) {
        if (realProfile.firstName) firstName = realProfile.firstName;
        if (realProfile.lastName) lastName = realProfile.lastName;
        if (realProfile.photoURL) photo = realProfile.photoURL;
        if (realProfile.username) username = realProfile.username;
      }
    } catch (e) {
      console.warn('fetchVkUserProfile notice:', e);
    }
  }

  const vkId = rawId ? String(rawId) : `${Date.now()}`;
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || (username ? (username.startsWith('@') ? username : `@${username}`) : (rawId ? `Пользователь VK` : 'Пользователь'));
  const finalEmail = email || (username ? `${username.replace(/^@/, '')}@vk.com` : (rawId ? `id${rawId}@vk.com` : 'vk_user@vk.com'));

  const profile: UserProfile = {
    uid: `vk_${vkId}`,
    email: finalEmail,
    displayName,
    photoURL: photo,
    avatarIcon: photo ? null : 'popcorn',
    username: username ? (username.startsWith('@') ? username : `@${username}`) : null,
    isAnonymous: false,
  };

  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

/**
 * Robust code exchanger: tries SDK client exchange first, then falls back to serverless /api/vk-exchange
 */
export const exchangeVkCodeSecurely = async (code: string, deviceId?: string): Promise<any> => {
  if (!code) return null;
  // 1. Try SDK exchangeCode
  try {
    const data = await VKID.Auth.exchangeCode(code, deviceId || '');
    if (data) return data;
  } catch (sdkErr) {
    console.warn('SDK exchangeCode notice, falling back to serverless:', sdkErr);
  }

  // 2. Try serverless exchange endpoint
  try {
    const redirectUri = getRedirectUrl();
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const apiUrl = isVercel ? '/api/vk-exchange' : 'https://ofmedia.vercel.app/api/vk-exchange';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        device_id: deviceId || '',
        redirect_uri: redirectUri,
      }),
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && !serverData.error) {
        return serverData;
      }
    }
  } catch (srvErr) {
    console.warn('Server exchange error:', srvErr);
  }

  return null;
};

/**
 * Official VK ID OneTap widget (for modals)
 */
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
        oauthList: [VKID.OAuthName.OK, VKID.OAuthName.MAIL],
        styles: {
          height: 48,
          borderRadius: 16,
        },
      })
      .on(VKID.WidgetEvents.ERROR, (err: any) => {
        console.warn('VK ID OneTap error:', err);
        if (onError) onError(err);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        try {
          const code = payload?.code;
          const deviceId = payload?.device_id;
          let authResult = payload;
          if (code) {
            const data = await exchangeVkCodeSecurely(code, deviceId);
            if (data) {
              authResult = { ...payload, ...data };
            }
          }
          const user = await handleVkAuthPayload(authResult);
          onSuccess(user);
        } catch (err) {
          console.error('VK OneTap process error:', err);
          if (onError) onError(err);
        }
      });
    return oneTap;
  } catch (err) {
    console.warn('OneTap render error:', err);
    return null;
  }
};

/**
 * Official VK ID FloatingOneTap widget («Шторка авторизации»)
 */
export const renderVkFloatingOneTap = (
  onSuccess: (user: UserProfile) => void,
  onError?: (err: any) => void
) => {
  initVkId();
  try {
    const floating = new VKID.FloatingOneTap();
    floating
      .render({
        scheme: VKID.Scheme.DARK,
        showAlternativeLogin: true,
        oauthList: [VKID.OAuthName.OK, VKID.OAuthName.MAIL],
        contentId: VKID.FloatingOneTapContentId.SIGN_IN_TO_SERVICE,
        appName: 'OFMEDIA',
        indent: {
          bottom: 74,
          right: 20,
          top: 20,
        },
      })
      .on(VKID.WidgetEvents.ERROR, (err: any) => {
        console.warn('VK ID FloatingOneTap error:', err);
        if (onError) onError(err);
      })
      .on(VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        const code = payload?.code;
        const deviceId = payload?.device_id;
        let authResult = payload;
        if (code) {
          const data = await exchangeVkCodeSecurely(code, deviceId);
          if (data) {
            authResult = { ...payload, ...data };
          }
        }
        const user = await handleVkAuthPayload(authResult);
        onSuccess(user);
      });
    return floating;
  } catch (err) {
    console.warn('FloatingOneTap render error:', err);
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
    console.warn('VKID.Auth.login notice:', e?.message);
    const appId = getVkAppId();
    const redirectUri = encodeURIComponent(getRedirectUrl());
    const state = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
    window.location.href = `https://oauth.vk.com/authorize?client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&display=mobile&scope=&state=${state}`;
  }
};

/**
 * Handle URL parameters after returning from VK ID redirect
 */
export const checkAndHandleVkRedirect = async (): Promise<UserProfile | null> => {
  if (typeof window === 'undefined') return null;

  // 0. Check Hash for transferred session: #vk_session=...
  if (window.location.hash && window.location.hash.includes('vk_session=')) {
    try {
      const hashContent = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
      const params = new URLSearchParams(hashContent);
      const rawSession = params.get('vk_session');
      if (rawSession) {
        const user = JSON.parse(decodeURIComponent(rawSession));
        if (user && user.uid) {
          localStorage.setItem('ofmedia_user', JSON.stringify(user));
          window.dispatchEvent(new Event('ofmedia_user_updated'));
          window.history.replaceState({}, document.title, window.location.pathname);
          return user;
        }
      }
    } catch (e) {
      console.warn('vk_session parse notice:', e);
    }
  }

  // 1. Check Search: ?code=...&device_id=...
  if (window.location.search && window.location.search.includes('code=')) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const deviceId = params.get('device_id') || params.get('deviceId') || '';
    const state = params.get('state');

    if (code) {
      initVkId();
      try {
        const data = await exchangeVkCodeSecurely(code, deviceId);
        const user = await handleVkAuthPayload(data || { code, device_id: deviceId });

        // If returned from external origin (e.g. Vercel), forward with secure session hash
        if (state) {
          try {
            const returnUrl = decodeURIComponent(state);
            if (returnUrl.startsWith('http') && !returnUrl.includes(window.location.host)) {
              const sessionPayload = encodeURIComponent(JSON.stringify(user));
              window.location.href = `${returnUrl.split('#')[0]}#vk_session=${sessionPayload}`;
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

