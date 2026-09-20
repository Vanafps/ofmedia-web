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
  const token = urlObj.searchParams.get('token') || VK_SERVICE_TOKEN;

  if (!userId) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Missing user_id' }));
  }

  try {
    const vkApiUrl = 'https://api.vk.com/method/users.get?user_ids=' + encodeURIComponent(userId) + '&fields=photo_200,first_name,last_name,sex,domain,screen_name&access_token=' + encodeURIComponent(token) + '&v=5.131';
    const response = await fetch(vkApiUrl);
    const data = await response.json();

    if (data.response && data.response[0]) {
      const user = data.response[0];
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      return res.end(JSON.stringify({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        photo: user.photo_200,
        username: user.domain || user.screen_name || '',
        displayName: (user.first_name + ' ' + (user.last_name || '')).trim()
      }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(data));
  } catch (err) {
    console.error('VK API proxy error:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err ? err.message : 'Unknown' }));
  }
}
