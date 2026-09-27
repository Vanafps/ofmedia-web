import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const KEY_ID = '2351032585';
const COMPANY_ID = '2351547003';
const PACKAGE_NAME = 'ru.ofmedia.app';
const PRIVATE_KEY_PATH = path.join(rootDir, 'rustore-private-key.pem');
const APK_PATH = 'C:\\Users\\DomPC\\.gemini\\antigravity\\scratch\\ofmedia-android\\app\\build\\outputs\\apk\\release\\app-release.apk';

async function getAuthToken() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error(`Private key not found at ${PRIVATE_KEY_PATH}`);
  }
  const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const timestamp = new Date().toISOString();
  const dataToSign = KEY_ID + timestamp;

  const sign = crypto.createSign('SHA512');
  sign.update(dataToSign);
  sign.end();
  const signature = sign.sign(privateKeyPem, 'base64');

  const res = await fetch('https://public-api.rustore.ru/public/auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: KEY_ID, timestamp, signature })
  });

  const data = await res.json();
  if (data.code !== 'OK' || !data.body?.jwe) {
    throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  }
  return data.body.jwe;
}

async function uploadToRuStore() {
  console.log('[RuStore Upload] Starting deployment process...');
  
  if (!fs.existsSync(APK_PATH)) {
    throw new Error(`Release APK not found at: ${APK_PATH}`);
  }
  const stats = fs.statSync(APK_PATH);
  console.log(`[RuStore Upload] Target APK: ${APK_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  const token = await getAuthToken();
  console.log('[RuStore Upload] Authorization successful. Token obtained.');

  // 1. Check existing versions
  console.log('[RuStore Upload] Checking existing versions...');
  const verListRes = await fetch(`https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version`, {
    headers: { 'Public-Token': token }
  });
  const verListData = await verListRes.json();
  console.log('[RuStore Upload] Existing versions:', JSON.stringify(verListData.body?.content?.map(v => ({
    id: v.versionId,
    name: v.versionName,
    code: v.versionCode,
    status: v.versionStatus
  })) || verListData, null, 2));

  let versionId = null;
  const draft = verListData.body?.content?.find(v => v.versionStatus === 'DRAFT');

  if (draft) {
    versionId = draft.versionId;
    console.log(`[RuStore Upload] Found existing DRAFT version ID: ${versionId}`);
  } else {
    // 2. Create new draft version
    console.log('[RuStore Upload] Creating new draft version...');
    const createDraftPayload = {
      appName: 'OFMEDIA',
      appType: 'MAIN',
      publishType: 'INSTANTLY',
      whatsNew: 'OFMEDIA 1.1.0: Нативный Android-клиент на Kotlin и Jetpack Compose с плеером ExoPlayer (AndroidX Media3). Добавлены: меню настроек в плеере с выбором качества (144p-1080p FHD), звуковых дорожек и субтитров; регулировка скорости (0.5x-2.0x); пропорции экрана (Вписать, Заполнить, Растянуть); вертикальные жесты яркости и громкости; двойной тап перемотки (+/- 10с); режим Картинка-в-картинке (PiP); синхронизация истории просмотров, закладок, оценок и аватаров.',
      developerContacts: {
        email: 'support@ofmedia.online',
        website: 'https://ofmedia.online'
      }
    };

    const draftRes = await fetch(`https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Public-Token': token
      },
      body: JSON.stringify(createDraftPayload)
    });

    const draftData = await draftRes.json();
    console.log('[RuStore Upload] Draft creation response:', JSON.stringify(draftData, null, 2));

    if (draftData.code !== 'OK' || !draftData.body) {
      throw new Error(`Failed to create draft: ${JSON.stringify(draftData)}`);
    }

    versionId = draftData.body;
    console.log(`[RuStore Upload] Draft version created successfully! Version ID: ${versionId}`);
  }

  // 3. Upload APK file
  console.log(`[RuStore Upload] Uploading APK to version ${versionId}...`);
  const fileBuffer = fs.readFileSync(APK_PATH);
  const blob = new Blob([fileBuffer], { type: 'application/vnd.android.package-archive' });
  const formData = new FormData();
  formData.append('file', blob, 'ofmedia-v1.1.0.apk');

  const uploadUrl = `https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version/${versionId}/apk?servicesType=Unknown&isMainApk=true`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Public-Token': token
    },
    body: formData
  });

  const uploadData = await uploadRes.json();
  console.log('[RuStore Upload] APK upload response:', JSON.stringify(uploadData, null, 2));

  if (uploadData.code !== 'OK') {
    throw new Error(`Failed to upload APK: ${JSON.stringify(uploadData)}`);
  }
  console.log('[RuStore Upload] APK uploaded successfully!');

  // 4. Send draft to moderation
  console.log(`[RuStore Upload] Submitting version ${versionId} to moderation...`);
  const commitUrl = `https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version/${versionId}/commit?priorityUpdate=0`;
  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      'Public-Token': token
    }
  });

  const commitData = await commitRes.json();
  console.log('[RuStore Upload] Commit moderation response:', JSON.stringify(commitData, null, 2));

  if (commitData.code !== 'OK') {
    throw new Error(`Failed to submit version to moderation: ${JSON.stringify(commitData)}`);
  }
  console.log('[RuStore Upload] Version submitted to moderation successfully!');

  // 5. Verify final status
  const statusRes = await fetch(`https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version?ids=${versionId}`, {
    headers: { 'Public-Token': token }
  });
  const statusData = await statusRes.json();
  console.log('[RuStore Upload] Final version status:', JSON.stringify(statusData.body?.content?.[0] || statusData, null, 2));
}

uploadToRuStore().catch(err => {
  console.error('[RuStore Upload] Fatal error:', err);
  process.exit(1);
});
