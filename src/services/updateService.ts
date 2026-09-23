import { isMobileApp } from './platform';

export interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  minVersionCode: number;
  apkUrl: string;
  apkDirectUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

export const CURRENT_APP_VERSION = '1.0.5';
export const CURRENT_APP_CODE = 6;

export const checkForAppUpdate = async (): Promise<{
  updateAvailable: boolean;
  latestVersion?: AppVersionInfo;
}> => {
  // CRITICAL: NEVER check for updates or show update prompts on website!
  // Only check inside the native Android Capacitor application shell.
  if (typeof window === 'undefined' || !isMobileApp()) {
    return { updateAvailable: false };
  }

  try {
    let installedBuildCode = CURRENT_APP_CODE;
    try {
      const { App: CapApp } = await import('@capacitor/app');
      const info = await CapApp.getInfo();
      if (info?.build) {
        installedBuildCode = parseInt(info.build, 10) || CURRENT_APP_CODE;
      }
    } catch {}

    const res = await fetch('https://ofmedia.vercel.app/version.json?_t=' + Date.now());
    if (!res.ok) return { updateAvailable: false };
    const latest: AppVersionInfo = await res.json();

    if (latest.versionCode > installedBuildCode) {
      return { updateAvailable: true, latestVersion: latest };
    }
    return { updateAvailable: false, latestVersion: latest };
  } catch (err) {
    console.warn('Update check failed:', err);
    return { updateAvailable: false };
  }
};

export const triggerApkDownload = (apkUrl?: string) => {
  const target = apkUrl || 'https://ofmedia.vercel.app/ofmedia-latest.apk';
  const a = document.createElement('a');
  a.href = target;
  a.target = '_blank';
  a.download = 'OFMEDIA.apk';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};