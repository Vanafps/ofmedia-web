export interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  minVersionCode: number;
  apkUrl: string;
  apkDirectUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_APP_CODE = 1;

export const checkForAppUpdate = async (): Promise<{
  updateAvailable: boolean;
  latestVersion?: AppVersionInfo;
}> => {
  try {
    const res = await fetch('/version.json?_t=' + Date.now());
    if (!res.ok) return { updateAvailable: false };
    const latest: AppVersionInfo = await res.json();

    if (latest.versionCode > CURRENT_APP_CODE) {
      return { updateAvailable: true, latestVersion: latest };
    }
    return { updateAvailable: false, latestVersion: latest };
  } catch (err) {
    console.warn('Update check failed:', err);
    return { updateAvailable: false };
  }
};

export const triggerApkDownload = (apkUrl?: string) => {
  const target = apkUrl || '/app/apk';
  const a = document.createElement('a');
  a.href = target;
  a.download = 'OFMEDIA.apk';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};