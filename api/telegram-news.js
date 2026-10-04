const BOT_TOKEN = '8811060825:AAFbFQjE060LOPqwgnzvC_iEnsXPpPpAIAA';
const CHANNEL_USERNAME = 'ofmedi';
const RTDB_URL = 'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app';

function cleanHtmlTags(html) {
  if (!html) return '';
  return html
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, inner) => {
      const cleanInner = inner.replace(/<br\s*[\/]?>/gi, '\n> ');
      return `\n> ${cleanInner}\n`;
    })
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (match, href, text) => {
      const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '').trim();
      if (!cleanText || cleanText === href) return href;
      return `${cleanText} (${href})`;
    })
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

function formatRussianDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins}`;
  } catch {
    return '';
  }
}

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
  const beforeParam = urlObj.searchParams.get('before');
  const limitParam = parseInt(urlObj.searchParams.get('limit') || '30', 10);

  // 1. Fetch hidden posts from Firebase RTDB
  let hiddenPosts = {};
  try {
    const hiddenRes = await fetch(`${RTDB_URL}/hidden_telegram_posts.json`);
    if (hiddenRes.ok) {
      const data = await hiddenRes.json();
      if (data && typeof data === 'object') {
        hiddenPosts = data;
      }
    }
  } catch {}

  let targetUrl = `https://t.me/s/${CHANNEL_USERNAME}`;
  if (beforeParam) {
    targetUrl += `?before=${encodeURIComponent(beforeParam)}`;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned HTTP ${upstreamRes.status}`);
    }

    const html = await upstreamRes.text();

    // 2. Channel Info
    let channelTitle = 'OFMEDIA';
    let channelDescription = '';
    let subscribers = '';
    let channelAvatar = '';

    const titleMatch = html.match(/<div class="tgme_channel_info_header_title"[^>]*><span[^>]*>([\s\S]*?)<\/span>/i);
    if (titleMatch) {
      channelTitle = cleanHtmlTags(titleMatch[1]);
    }

    const descMatch = html.match(/<div class="tgme_channel_info_description"[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) {
      channelDescription = cleanHtmlTags(descMatch[1]);
    }

    const subMatch = html.match(/<span class="counter_value">([^<]+)<\/span>\s*<span class="counter_type">subscribers<\/span>/i);
    if (subMatch) {
      subscribers = subMatch[1].trim();
    }

    const avatarMatch = html.match(/<i class="tgme_page_photo_image[^"]*"[^>]*><img src="([^"]+)"/i);
    if (avatarMatch) {
      const rawAvatar = avatarMatch[1];
      channelAvatar = `/api/telegram-image?url=${encodeURIComponent(rawAvatar)}`;
    }

    // 3. Parse Posts
    const posts = [];
    const messageBlocks = html.split('<div class="tgme_widget_message_wrap');

    for (let i = 1; i < messageBlocks.length; i++) {
      const block = messageBlocks[i];

      // Extract Post ID
      const postMatch = block.match(/data-post="([^"]+)"/i);
      if (!postMatch) continue;
      const fullPostId = postMatch[1]; // e.g. "ofmedi/1608"
      const idParts = fullPostId.split('/');
      const postId = idParts[1] || fullPostId;

      // Skip if post was hidden/deleted by admin in RTDB
      if (hiddenPosts[postId] || hiddenPosts[`tg_${postId}`]) {
        continue;
      }

      // Extract Text
      let rawTextHtml = '';
      let plainText = '';
      const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*dir="auto">([\s\S]*?)<\/div>/i);
      if (textMatch) {
        rawTextHtml = textMatch[1].trim();
        plainText = cleanHtmlTags(rawTextHtml);
      }

      // Extract Images - capture single photos and full albums from .tgme_widget_message_grouped
      const images = [];
      const originalImages = [];

      // Regex matching any background-image URL inside the message block
      const photoRegex = /background-image:\s*url\((?:'|&quot;|"|)?([^'")&]+)(?:'|&quot;|"|)?\)/gi;
      let photoMatch;
      while ((photoMatch = photoRegex.exec(block)) !== null) {
        const rawUrl = photoMatch[1].trim();
        if (rawUrl && !rawUrl.includes('/emoji/') && !originalImages.includes(rawUrl)) {
          originalImages.push(rawUrl);
          const proxiedUrl = rawUrl.startsWith('http')
            ? `/api/telegram-image?url=${encodeURIComponent(rawUrl)}`
            : rawUrl;
          images.push(proxiedUrl);
        }
      }

      // Extract Date and Time
      let dateIso = '';
      let dateFormatted = '';
      const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
      if (timeMatch) {
        dateIso = timeMatch[1];
        const innerText = timeMatch[2].replace(/<[^>]+>/g, '').trim();
        dateFormatted = formatRussianDate(dateIso) || innerText;
      }

      // Extract Views
      let views = '';
      const viewsMatch = block.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/i);
      if (viewsMatch) {
        views = viewsMatch[1].trim();
      }

      // Pinned status
      const isPinned = block.includes('tgme_widget_message_pinned');

      // Forwarded from
      let forwardedFrom = '';
      const fwdMatch = block.match(/<div class="tgme_widget_message_forwarded_from_name"[^>]*>([\s\S]*?)<\/div>/i);
      if (fwdMatch) {
        forwardedFrom = cleanHtmlTags(fwdMatch[1]);
      }

      // CRITICAL: Filter out deleted/empty posts from Telegram!
      // When a post is deleted in Telegram, t.me/s still emits an empty block without text, media or forwards.
      if (!plainText && images.length === 0 && !forwardedFrom) {
        continue;
      }

      if (!plainText) {
        if (forwardedFrom) {
          plainText = `Переслано из: ${forwardedFrom}`;
        } else if (images.length > 0) {
          plainText = images.length > 1 ? `Фотоальбом (${images.length} фото)` : 'Медиаматериал канала OFMEDIA';
        }
      }

      // Title extraction
      const lines = plainText.split('\n').map((l) => l.trim()).filter(Boolean);
      let title = lines[0] || (images.length > 1 ? `Фотоальбом (${images.length} фото)` : images.length > 0 ? 'Медиаматериал OFMEDIA' : `Публикация #${postId}`);
      if (title.length > 80) {
        title = title.substring(0, 77) + '...';
      }

      posts.push({
        id: postId,
        title,
        content: plainText,
        rawHtml: rawTextHtml,
        date: dateIso || dateFormatted,
        dateFormatted,
        views,
        images,
        originalImages,
        coverImage: images[0] || null,
        pinned: isPinned,
        forwardedFrom: forwardedFrom || null,
        url: `https://t.me/${fullPostId}`,
        channel: `@${CHANNEL_USERNAME}`
      });
    }

    // Sort descending by numeric ID (newest first)
    posts.sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numB - numA;
    });

    const finalPosts = posts.slice(0, limitParam);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({
      ok: true,
      channel: {
        title: channelTitle,
        username: CHANNEL_USERNAME,
        description: channelDescription,
        subscribers,
        avatar: channelAvatar,
        url: `https://t.me/${CHANNEL_USERNAME}`
      },
      count: finalPosts.length,
      posts: finalPosts
    });
  } catch (err) {
    console.error('Error fetching Telegram channel:', err);

    // Fallback using Bot API getChat
    try {
      const fallbackUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=@${CHANNEL_USERNAME}`;
      const botRes = await fetch(fallbackUrl);
      const botData = await botRes.json();

      if (botData.ok) {
        return res.json({
          ok: true,
          channel: {
            title: botData.result.title || 'OFMEDIA',
            username: CHANNEL_USERNAME,
            description: botData.result.description || '',
            url: `https://t.me/${CHANNEL_USERNAME}`
          },
          count: 0,
          posts: [],
          notice: 'Channel info fetched via Bot API fallback'
        });
      }
    } catch {}

    res.statusCode = 500;
    return res.json({
      ok: false,
      error: 'Failed to retrieve telegram channel posts',
      details: err.message
    });
  }
}
