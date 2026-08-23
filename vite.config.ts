import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'node:http';
import https from 'node:https';

const VIDEO_IDS: Record<string, string> = {
  clip: '8a8966e9b95360c89c66e39813e0f1db',
  park: '53b638ac2acccb2eaa4a8547b0e39334',
  nalim: '7316ea3d2c4f04fb4f56fe3e2433ecd9',
  ng: 'd0a98b9fdc754b1b8e767b18bcf6f400',
  vdnh: '654aa125e6d87c90c6002d0d7d075bd0',
  hor: '9fac4cd44df38440aa6da88154188721',
  antonio: '8a8966e9b95360c89c66e39813e0f1db'
};

function fetchStreamUrl(targetUrl: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchStreamUrl(res.headers.location));
      }
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 200, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
  });
}

function handleStreamMiddleware(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
  const reqUrl = req.url || '';

  // 1. Master M3U8 Playlist
  const masterMatch = reqUrl.match(/^\/api\/hls\/([^/?#]+)\/master\.m3u8/);
  if (masterMatch) {
    const slug = masterMatch[1];
    const vid = VIDEO_IDS[slug] || slug;
    fetchStreamUrl(`https://rutube.ru/api/play/options/${vid}/?format=json`)
      .then(async (apiRes) => {
        const data = JSON.parse(apiRes.body.toString('utf-8'));
        const m3u8Url = data.video_balancer?.m3u8;
        if (!m3u8Url) {
          res.statusCode = 404;
          return res.end('No cloud stream found');
        }

        const m3u8Res = await fetchStreamUrl(m3u8Url);
        const rawM3u8 = m3u8Res.body.toString('utf-8');

        const lines = rawM3u8.split('\n');
        const rewritten = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return `/api/hls/sub.m3u8?url=${encodeURIComponent(trimmed)}`;
          }
          return line;
        }).join('\n');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        return res.end(rewritten);
      })
      .catch((e: any) => {
        res.statusCode = 500;
        return res.end(`Stream proxy error: ${e.message}`);
      });
    return;
  }

  // 2. Sub-playlist (Quality Level Playlist)
  if (reqUrl.startsWith('/api/hls/sub.m3u8')) {
    const parsed = new URL(reqUrl, 'http://localhost');
    const targetUrl = parsed.searchParams.get('url');
    if (!targetUrl) {
      res.statusCode = 400;
      return res.end('Missing url param');
    }

    fetchStreamUrl(targetUrl)
      .then((subRes) => {
        const raw = subRes.body.toString('utf-8');
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

        const lines = raw.split('\n');
        const rewritten = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const fullSegUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
            return `/api/hls/segment?url=${encodeURIComponent(fullSegUrl)}`;
          }
          return line;
        }).join('\n');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        return res.end(rewritten);
      })
      .catch((e: any) => {
        res.statusCode = 500;
        return res.end(`Sub-playlist proxy error: ${e.message}`);
      });
    return;
  }

  // 3. TS Segment Chunk Proxy
  if (reqUrl.startsWith('/api/hls/segment')) {
    const parsed = new URL(reqUrl, 'http://localhost');
    const targetUrl = parsed.searchParams.get('url');
    if (!targetUrl) {
      res.statusCode = 400;
      return res.end('Missing segment url param');
    }

    fetchStreamUrl(targetUrl)
      .then((segRes) => {
        res.setHeader('Content-Type', 'video/mp2t');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.end(segRes.body);
      })
      .catch((e: any) => {
        res.statusCode = 500;
        return res.end(`Segment error: ${e.message}`);
      });
    return;
  }

  next();
}

function hlsCloudStreamPlugin(): Plugin {
  return {
    name: 'hls-cloud-stream-plugin',
    configureServer(server) {
      server.middlewares.use(handleStreamMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleStreamMiddleware);
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), hlsCloudStreamPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
