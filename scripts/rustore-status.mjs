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

async function main() {
  try {
    const token = await getAuthToken();
    console.log('[RuStore API] Auth OK. Fetching app status...');

    const appRes = await fetch(`https://public-api.rustore.ru/public/v1/application/${PACKAGE_NAME}/version`, {
      headers: { 'Public-Token': token }
    });
    const verData = await appRes.json();

    if (verData.code === 'OK') {
      console.log(`[RuStore API] Package: ${PACKAGE_NAME} (Company ID: ${COMPANY_ID})`);
      console.log('[RuStore API] Versions:');
      for (const ver of verData.body.content) {
        console.log(`- Version ID: ${ver.versionId} | Name: ${ver.versionName || 'N/A'} | Code: ${ver.versionCode} | Status: ${ver.versionStatus} | Sent: ${ver.sendDateForModer || 'N/A'}`);
      }
    } else {
      console.log('[RuStore API] Response:', verData);
    }
  } catch (err) {
    console.error('[RuStore API] Error:', err.message);
  }
}

main();
