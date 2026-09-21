const VK_APP_ID_WEB = 54781535;
const VK_CLIENT_SECRET = 'onvGud3EPvBipAvPz7AK';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  let code = '';
  let deviceId = '';
  let redirectUri = '';

  if (req.method === 'POST') {
    try {
      let bodyStr = '';
      if (typeof req.body === 'string') {
        bodyStr = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        bodyStr = req.body.toString('utf8');
      } else if (req.body && typeof req.body === 'object') {
        code = req.body.code || '';
        deviceId = req.body.device_id || req.body.deviceId || '';
        redirectUri = req.body.redirect_uri || req.body.redirectUri || '';
      }

      if (!code && bodyStr) {
        try {
          const parsed = JSON.parse(bodyStr);
          code = parsed.code || '';
          deviceId = parsed.device_id || parsed.deviceId || '';
          redirectUri = parsed.redirect_uri || parsed.redirectUri || '';
        } catch {
          const params = new URLSearchParams(bodyStr);
          code = params.get('code') || '';
          deviceId = params.get('device_id') || params.get('deviceId') || '';
          redirectUri = params.get('redirect_uri') || params.get('redirectUri') || '';
        }
      }
    } catch (e) {
      console.warn('Error reading body:', e);
    }
  }

  if (!code) {
    const host = req.headers.host || 'localhost';
    const urlObj = new URL(req.url, 'http://' + host);
    code = urlObj.searchParams.get('code') || '';
    deviceId = urlObj.searchParams.get('device_id') || urlObj.searchParams.get('deviceId') || '';
    redirectUri = urlObj.searchParams.get('redirect_uri') || urlObj.searchParams.get('redirectUri') || '';
  }

  if (!code) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Missing code' }));
  }

  const defaultRedirect = 'https://ofmedia-web.github.io/';
  const finalRedirectUri = redirectUri || defaultRedirect;

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: String(VK_APP_ID_WEB),
      client_secret: VK_CLIENT_SECRET,
      code,
      redirect_uri: finalRedirectUri,
    });
    if (deviceId) {
      params.append('device_id', deviceId);
    }

    let data = null;
    try {
      const vkResponse = await fetch('https://id.vk.com/oauth2/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      data = await vkResponse.json();
    } catch (e) {
      console.warn('id.vk.com exchange error:', e);
    }

    if (!data || data.error) {
      try {
        const fallbackUrl = `https://oauth.vk.com/access_token?client_id=${VK_APP_ID_WEB}&client_secret=${VK_CLIENT_SECRET}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&code=${encodeURIComponent(code)}`;
        const fbResponse = await fetch(fallbackUrl);
        const fbData = await fbResponse.json();
        if (fbData && !fbData.error) {
          data = fbData;
        }
      } catch (fbErr) {
        console.warn('oauth.vk.com fallback error:', fbErr);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(data || { error: 'Exchange failed' }));
  } catch (err) {
    console.error('VK exchange error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err ? err.message : 'Unknown' }));
  }
}
