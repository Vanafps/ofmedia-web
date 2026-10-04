export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const urlObj = new URL(req.url, 'http://' + host);
  let targetUrl = urlObj.searchParams.get('url');

  if (!targetUrl) {
    res.statusCode = 400;
    return res.json({ error: 'Missing url parameter' });
  }

  // Handle base64 encoded URL if passed
  if (targetUrl.startsWith('aHR0c')) {
    try {
      targetUrl = Buffer.from(targetUrl, 'base64').toString('utf8');
    } catch {}
  }

  try {
    const parsed = new URL(targetUrl);
    // Allowlist legitimate Telegram media domains
    const allowed = [
      'telesco.pe',
      'cdn1.telesco.pe',
      'cdn2.telesco.pe',
      'cdn3.telesco.pe',
      'cdn4.telesco.pe',
      'cdn5.telesco.pe',
      'telegram.org',
      't.me',
      'api.telegram.org'
    ];
    const isAllowed = allowed.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
    if (!isAllowed) {
      res.statusCode = 403;
      return res.json({ error: 'Host not allowed' });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Referer': 'https://t.me/'
      }
    });

    if (!upstream.ok) {
      res.statusCode = upstream.status;
      return res.json({ error: 'Upstream fetch failed', status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');

    const buffer = await upstream.arrayBuffer();
    return res.end(Buffer.from(buffer));
  } catch (err) {
    res.statusCode = 500;
    return res.json({ error: 'Proxy fetch failed', message: err.message });
  }
}
