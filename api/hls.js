const VIDEO_IDS = {
  clip: '8a8966e9b95360c89c66e39813e0f1db',
  park: '53b638ac2acccb2eaa4a8547b0e39334',
  nalim: '7316ea3d2c4f04fb4f56fe3e2433ecd9',
  ng: 'd0a98b9fdc754b1b8e767b18bcf6f400',
  vdnh: '654aa125e6d87c90c6002d0d7d075bd0',
  hor: '9fac4cd44df38440aa6da88154188721'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const urlObj = new URL(req.url, 'http://' + host);
  const id = urlObj.searchParams.get('id') || 'clip';
  const type = urlObj.searchParams.get('type') || 'master';
  const targetUrl = urlObj.searchParams.get('url');

  try {
    // 1. MASTER PLAYLIST
    if (type === 'master') {
      const rutubeId = VIDEO_IDS[id] || id;
      const optRes = await fetch('https://rutube.ru/api/play/options/' + rutubeId + '/?format=json', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const optData = await optRes.json();
      const m3u8Url = optData && optData.video_balancer && optData.video_balancer.m3u8;

      if (!m3u8Url) {
        res.statusCode = 404;
        return res.end('No video stream found for id: ' + id);
      }

      const m3u8Res = await fetch(m3u8Url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const masterBody = await m3u8Res.text();

      const rewritten = masterBody.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return '/api/hls?type=playlist&url=' + encodeURIComponent(trimmed);
        }
        return line;
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
      res.statusCode = 200;
      return res.end(rewritten);
    }

    // 2. SUB-PLAYLIST
    if (type === 'playlist' && targetUrl) {
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/'));
      const plRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const plBody = await plRes.text();

      const rewritten = plBody.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) return line;

        const fullSegUrl = trimmed.startsWith('http') ? trimmed : baseUrl + '/' + trimmed;
        return '/api/hls?type=segment&url=' + encodeURIComponent(fullSegUrl);
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
      res.statusCode = 200;
      return res.end(rewritten);
    }

    // 3. SEGMENT (.ts)
    if (type === 'segment' && targetUrl) {
      const segRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const buffer = await segRes.arrayBuffer();
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.statusCode = 200;
      return res.end(Buffer.from(buffer));
    }

    res.statusCode = 400;
    return res.end('Invalid parameters');
  } catch (err) {
    console.error('HLS stream error:', err);
    res.statusCode = 500;
    return res.end('Stream error: ' + (err ? err.message : 'Unknown'));
  }
}
