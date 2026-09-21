const VK_SERVICE_TOKEN = '74427b5e74427b5e74427b5e0277019d3e7744274427b5e1ef273586bfcddc4a9f3a85e';

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
  const userId = urlObj.searchParams.get('user_id') || urlObj.searchParams.get('userId');

  if (!userId) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Missing user_id' }));
  }

  try {
    const fields = 'photo_200,photo_max,first_name,last_name,domain,screen_name';
    const vkApiUrl = `https://api.vk.com/method/users.get?user_ids=${encodeURIComponent(userId)}&fields=${fields}&access_token=${VK_SERVICE_TOKEN}&v=5.131`;
    const response = await fetch(vkApiUrl);
    const data = await response.json();

    if (data.response && data.response[0]) {
      const user = data.response[0];
      const photo = user.photo_200 || user.photo_max || null;
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      const displayName = `${firstName} ${lastName}`.trim() || user.domain || `id${user.id}`;
      const username = user.domain || user.screen_name || '';

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      return res.end(JSON.stringify({
        id: user.id,
        firstName,
        lastName,
        displayName,
        photo,
        username,
      }));
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (err) {
    console.error('VK API proxy error:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err ? err.message : 'Unknown' }));
  }
}

