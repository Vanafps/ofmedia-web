const BOT_TOKEN = '8811060825:AAFbFQjE060LOPqwgnzvC_iEnsXPpPpAIAA';
const CHANNEL_USERNAME = 'ofmedi';
const RTDB_URL = 'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app';

function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{2B55}\u{E0020}-\u{E007F}\u{FE0F}]/gu, '')
    .trim();
}

function cleanHtmlTags(html) {
  if (!html) return '';
  const cleaned = html
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
  return stripEmojis(cleaned);
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
  const channelParam = (urlObj.searchParams.get('channel') || CHANNEL_USERNAME).replace(/^@/, '').trim();
  const limitParam = Math.min(parseInt(urlObj.searchParams.get('limit') || '50', 10), 80);

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

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  const parseMessagesFromHtml = (html, channelName) => {
    let channelTitle = channelName.toUpperCase();
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

    const postsList = [];
    const messageBlocks = html.split('<div class="tgme_widget_message_wrap');

    for (let i = 1; i < messageBlocks.length; i++) {
      const block = messageBlocks[i];

      const postMatch = block.match(/data-post="([^"]+)"/i);
      if (!postMatch) continue;
      const fullPostId = postMatch[1];
      const idParts = fullPostId.split('/');
      const postId = idParts[1] || fullPostId;

      if (hiddenPosts[postId] || hiddenPosts[`tg_${postId}`]) {
        continue;
      }

      let rawTextHtml = '';
      let plainText = '';
      const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*dir="auto">([\s\S]*?)<\/div>/i);
      if (textMatch) {
        rawTextHtml = textMatch[1].trim();
        plainText = cleanHtmlTags(rawTextHtml);
      }

      const images = [];
      const originalImages = [];
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

      let dateIso = '';
      let dateFormatted = '';
      const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
      if (timeMatch) {
        dateIso = timeMatch[1];
        const innerText = timeMatch[2].replace(/<[^>]+>/g, '').trim();
        dateFormatted = formatRussianDate(dateIso) || innerText;
      }

      let views = '';
      const viewsMatch = block.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/i);
      if (viewsMatch) {
        views = viewsMatch[1].trim();
      }

      const isPinned = block.includes('tgme_widget_message_pinned');

      let forwardedFrom = '';
      const fwdMatch = block.match(/<div class="tgme_widget_message_forwarded_from_name"[^>]*>([\s\S]*?)<\/div>/i);
      if (fwdMatch) {
        forwardedFrom = cleanHtmlTags(fwdMatch[1]);
      }

      if (!plainText && images.length === 0 && !forwardedFrom) {
        continue;
      }

      if (!plainText) {
        if (forwardedFrom) {
          plainText = `Переслано из: ${forwardedFrom}`;
        } else if (images.length > 0) {
          plainText = images.length > 1 ? `Фотоальбом (${images.length} фото)` : `Медиаматериал канала @${channelName}`;
        }
      }

      const lines = plainText.split('\n').map((l) => l.trim()).filter(Boolean);
      let title = lines[0] || (images.length > 1 ? `Фотоальбом (${images.length} фото)` : images.length > 0 ? 'Медиаматериал' : `Публикация #${postId}`);
      if (title.length > 80) {
        title = title.substring(0, 77) + '...';
      }

      postsList.push({
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
        channel: `@${channelName}`
      });
    }

    return {
      channelTitle,
      channelDescription,
      subscribers,
      channelAvatar,
      postsList
    };
  };

  try {
    let targetUrl = `https://t.me/s/${channelParam}`;
    if (beforeParam) {
      targetUrl += `?before=${encodeURIComponent(beforeParam)}`;
    }

    const firstRes = await fetch(targetUrl, { headers });
    if (!firstRes.ok) {
      throw new Error(`Upstream returned HTTP ${firstRes.status}`);
    }
    const firstHtml = await firstRes.text();
    const parsedFirst = parseMessagesFromHtml(firstHtml, channelParam);

    const postsMap = new Map();
    for (const post of parsedFirst.postsList) {
      postsMap.set(post.id, post);
    }

    // Pagination loop: if we have fewer posts than requested limit, fetch older pages
    let loopCount = 0;
    while (postsMap.size < limitParam && loopCount < 3) {
      loopCount++;
      const numericIds = Array.from(postsMap.keys())
        .map((id) => parseInt(id, 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (numericIds.length === 0) break;
      const oldestId = Math.min(...numericIds);
      if (oldestId <= 1) break;

      try {
        const nextUrl = `https://t.me/s/${channelParam}?before=${oldestId}`;
        const nextRes = await fetch(nextUrl, { headers });
        if (!nextRes.ok) break;
        const nextHtml = await nextRes.text();
        const parsedNext = parseMessagesFromHtml(nextHtml, channelParam);
        let newItemsAdded = 0;
        for (const post of parsedNext.postsList) {
          if (!postsMap.has(post.id)) {
            postsMap.set(post.id, post);
            newItemsAdded++;
          }
        }
        if (newItemsAdded === 0) break;
      } catch (pageErr) {
        console.warn('Pagination fetch error:', pageErr);
        break;
      }
    }

    const allPosts = Array.from(postsMap.values());
    allPosts.sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numB - numA;
    });

    const finalPosts = allPosts.slice(0, limitParam);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({
      ok: true,
      channel: {
        title: parsedFirst.channelTitle,
        username: channelParam,
        description: parsedFirst.channelDescription,
        subscribers: parsedFirst.subscribers,
        avatar: parsedFirst.channelAvatar,
        url: `https://t.me/${channelParam}`
      },
      count: finalPosts.length,
      posts: finalPosts
    });
  } catch (err) {
    console.error('Error fetching Telegram channel:', err);

    res.statusCode = 500;
    return res.json({
      ok: false,
      error: 'Failed to retrieve telegram channel posts',
      details: err.message
    });
  }
}
