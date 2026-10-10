const BOT_TOKENS = [
  '8811060825:AAFbFQjE060LOPqwgnzvC_iEnsXPpPpAIAA',
  '8610727941:AAGMaWuuCWH6dEdIt4gJPbcz2pl2RDOz6zI'
];
const CHANNEL_USERNAME = 'ofmedi';
const CHAT_USERNAME = 'chanel9of';
const RTDB_URL = 'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app';

function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}-\u{2B55}\u{E0020}-\u{E007F}\u{FE0F}]/gu,
      ''
    )
    .trim();
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanHtmlTags(html) {
  if (!html) return '';
  const cleaned = decodeHtmlEntities(
    html
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
  ).trim();
  return stripEmojis(cleaned);
}

function formatRussianDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря'
    ];
    // Use Moscow time (UTC+3) for consistent formatting
    const msk = new Date(d.getTime() + 3 * 3600 * 1000);
    const hours = String(msk.getUTCHours()).padStart(2, '0');
    const mins = String(msk.getUTCMinutes()).padStart(2, '0');
    return `${msk.getUTCDate()} ${months[msk.getUTCMonth()]} ${msk.getUTCFullYear()}, ${hours}:${mins}`;
  } catch {
    return '';
  }
}

async function callTelegramBot(method, params = {}) {
  for (const token of BOT_TOKENS) {
    try {
      const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        }
      });
      const res = await fetch(url.toString());
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.ok) {
        return { ok: true, result: data.result, token };
      }
    } catch {}
  }
  return { ok: false, result: null, token: BOT_TOKENS[0] };
}

function convertBotMessageToPost(msg, isPinned = false) {
  if (!msg || !msg.message_id) return null;
  const msgId = String(msg.message_id);

  let authorName = 'Участник 9OF';
  let authorUsername = '';
  if (msg.from) {
    const parts = [msg.from.first_name, msg.from.last_name].filter(Boolean);
    authorName = stripEmojis(parts.join(' ')) || msg.from.username || 'Участник 9OF';
    if (msg.from.username) authorUsername = `@${msg.from.username}`;
  } else if (msg.sender_chat) {
    authorName = stripEmojis(msg.sender_chat.title || '') || '9OF';
    if (msg.sender_chat.username) authorUsername = `@${msg.sender_chat.username}`;
  }

  const rawText = msg.text || msg.caption || '';
  const plainText = stripEmojis(rawText);

  const images = [];
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const bestPhoto = msg.photo[msg.photo.length - 1];
    if (bestPhoto && bestPhoto.file_id) {
      images.push(`/api/telegram-image?file_id=${encodeURIComponent(bestPhoto.file_id)}`);
    }
  }
  if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/')) {
    images.push(`/api/telegram-image?file_id=${encodeURIComponent(msg.document.file_id)}`);
  }
  if (msg.sticker && msg.sticker.thumbnail && msg.sticker.thumbnail.file_id) {
    images.push(`/api/telegram-image?file_id=${encodeURIComponent(msg.sticker.thumbnail.file_id)}`);
  }

  let forwardedFrom = null;
  if (msg.forward_from_chat && msg.forward_from_chat.title) {
    forwardedFrom = stripEmojis(msg.forward_from_chat.title);
  } else if (msg.forward_from) {
    forwardedFrom = stripEmojis(
      [msg.forward_from.first_name, msg.forward_from.last_name].filter(Boolean).join(' ')
    );
  } else if (msg.forward_sender_name) {
    forwardedFrom = stripEmojis(msg.forward_sender_name);
  }

  let replyTo = null;
  if (msg.reply_to_message && msg.reply_to_message.message_id) {
    const replyFrom = msg.reply_to_message.from
      ? stripEmojis(
          [msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name]
            .filter(Boolean)
            .join(' ')
        )
      : 'Сообщение';
    const replyText = stripEmojis(
      msg.reply_to_message.text || msg.reply_to_message.caption || 'Медиавложение'
    ).slice(0, 100);
    replyTo = {
      id: String(msg.reply_to_message.message_id),
      author: replyFrom,
      text: replyText
    };
  }

  if (!plainText && images.length === 0 && !forwardedFrom) {
    return null;
  }

  const dateIso = msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString();
  const dateFormatted = formatRussianDate(dateIso);
  const contentText =
    plainText ||
    (images.length > 0 ? 'Фотография в чате 9OF' : `Переслано от ${forwardedFrom}`);

  return {
    id: msgId,
    title: authorName,
    author: authorName,
    authorUsername,
    authorAvatar: null,
    content: contentText,
    rawHtml: contentText,
    date: dateIso,
    dateFormatted,
    views: '',
    images,
    originalImages: images,
    coverImage: images[0] || null,
    pinned: Boolean(isPinned),
    forwardedFrom,
    replyTo,
    mediaGroupId: msg.media_group_id ? String(msg.media_group_id) : null,
    url: `https://t.me/${CHAT_USERNAME}/${msgId}`,
    channel: `@${CHAT_USERNAME}`,
    isChat: true
  };
}

function parseEmbedChatMessageHtml(html, msgId, chatUsername = CHAT_USERNAME) {
  if (!html || html.includes('tgme_widget_message_error')) return null;
  if (!html.includes('tgme_widget_message')) return null;

  let authorName = 'Участник 9OF';
  const authorMatch =
    html.match(/<a class="tgme_widget_message_owner_name[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/<span class="tgme_widget_message_from_author"[^>]*>([\s\S]*?)<\/span>/i) ||
    html.match(/<div class="tgme_widget_message_author[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (authorMatch) {
    const cleanedAuthor = cleanHtmlTags(authorMatch[1]);
    if (cleanedAuthor) authorName = cleanedAuthor;
  }

  let authorUsername = '';
  const ownerHrefMatch = html.match(
    /<a class="tgme_widget_message_owner_name[^"]*"[^>]*href="https:\/\/t\.me\/([^"\/?]+)"/i
  );
  if (ownerHrefMatch && ownerHrefMatch[1]) {
    authorUsername = `@${ownerHrefMatch[1]}`;
  }

  let authorAvatar = null;
  const userPhotoMatch = html.match(
    /<i class="tgme_widget_message_user_photo[^"]*"[^>]*><img src="([^"]+)"/i
  );
  if (userPhotoMatch && userPhotoMatch[1]) {
    authorAvatar = `/api/telegram-image?url=${encodeURIComponent(userPhotoMatch[1])}`;
  }

  // Extract reply block if present before stripping it from main text
  let replyTo = null;
  const replyBlockMatch = html.match(
    /<a class="tgme_widget_message_reply"[^>]*href="https?:\/\/t\.me\/[^\/]+\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i
  );
  let htmlWithoutReply = html;
  if (replyBlockMatch) {
    const replyId = replyBlockMatch[1];
    const replyInner = replyBlockMatch[2];
    const replyAuthorMatch = replyInner.match(
      /<span class="tgme_widget_message_author_name"[^>]*>([\s\S]*?)<\/span>/i
    );
    const replyTextMatch =
      replyInner.match(/<div class="tgme_widget_message_metatext"[^>]*>([\s\S]*?)<\/div>/i) ||
      replyInner.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    replyTo = {
      id: replyId,
      author: replyAuthorMatch ? cleanHtmlTags(replyAuthorMatch[1]) : 'Сообщение',
      text: replyTextMatch ? cleanHtmlTags(replyTextMatch[1]).slice(0, 100) : 'Сообщение в чате'
    };
    htmlWithoutReply = html.replace(replyBlockMatch[0], '');
  }

  let rawTextHtml = '';
  let plainText = '';
  const textMatches = [
    ...htmlWithoutReply.matchAll(
      /<div class="tgme_widget_message_text[^"]*"[^>]*dir="auto">([\s\S]*?)<\/div>/gi
    )
  ];
  if (textMatches.length > 0) {
    rawTextHtml = textMatches[textMatches.length - 1][1].trim();
    plainText = cleanHtmlTags(rawTextHtml);
  }

  const images = [];
  const originalImages = [];
  const photoRegex = /background-image:\s*url\((?:'|&quot;|"|)?([^'")&]+)(?:'|&quot;|"|)?\)/gi;
  let photoMatch;
  while ((photoMatch = photoRegex.exec(htmlWithoutReply)) !== null) {
    const rawUrl = photoMatch[1].trim();
    if (
      rawUrl &&
      !rawUrl.includes('/emoji/') &&
      !rawUrl.includes('user_photo') &&
      !originalImages.includes(rawUrl)
    ) {
      originalImages.push(rawUrl);
      const proxiedUrl = rawUrl.startsWith('http')
        ? `/api/telegram-image?url=${encodeURIComponent(rawUrl)}`
        : rawUrl;
      images.push(proxiedUrl);
    }
  }

  let forwardedFrom = null;
  const fwdMatch = htmlWithoutReply.match(
    /<div class="tgme_widget_message_forwarded_from_name"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (fwdMatch) {
    forwardedFrom = cleanHtmlTags(fwdMatch[1]);
  }

  let serviceText = '';
  const serviceMatch = htmlWithoutReply.match(
    /<div class="tgme_widget_message_service_label"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (serviceMatch) {
    serviceText = cleanHtmlTags(serviceMatch[1]);
  }

  let dateIso = '';
  let dateFormatted = '';
  const timeMatch = htmlWithoutReply.match(/<time[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
  if (timeMatch) {
    dateIso = timeMatch[1];
    const innerText = timeMatch[2].replace(/<[^>]+>/g, '').trim();
    dateFormatted = formatRussianDate(dateIso) || innerText;
  }

  if (!dateIso && !plainText && images.length === 0) {
    return null;
  }

  if (!plainText && images.length === 0 && !forwardedFrom && !serviceText) {
    return null;
  }

  const finalContent =
    plainText ||
    serviceText ||
    (forwardedFrom
      ? `Переслано из: ${forwardedFrom}`
      : images.length > 1
      ? `Фотоальбом (${images.length} фото)`
      : 'Медиавложение в чате 9OF');

  return {
    id: String(msgId),
    title: authorName,
    author: authorName,
    authorUsername,
    authorAvatar,
    content: finalContent,
    rawHtml: rawTextHtml || finalContent,
    date: dateIso || dateFormatted,
    dateFormatted: dateFormatted || dateIso,
    views: '',
    images,
    originalImages,
    coverImage: images[0] || null,
    pinned: false,
    forwardedFrom,
    replyTo,
    url: `https://t.me/${chatUsername}/${msgId}`,
    channel: `@${chatUsername}`,
    isChat: true
  };
}

async function readBodyJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function handleChat9OF(req, res, urlObj, hiddenPosts) {
  const forceRefresh = urlObj.searchParams.get('refresh') === '1';

  // 1. Fetch live chat metadata via Telegram Bot API (OFMEDIA API bot in 9OF)
  let chatMeta = {
    title: '9OF',
    username: CHAT_USERNAME,
    description: 'OFMEDIA https://ofmedia.ru/',
    subscribers: '33',
    avatar: '',
    url: `https://t.me/${CHAT_USERNAME}`,
    isChat: true
  };

  let pinnedPost = null;
  let maxKnownId = 50;

  try {
    const [chatRes, countRes] = await Promise.all([
      callTelegramBot('getChat', { chat_id: `@${CHAT_USERNAME}` }),
      callTelegramBot('getChatMemberCount', { chat_id: `@${CHAT_USERNAME}` })
    ]);

    if (chatRes.ok && chatRes.result) {
      const c = chatRes.result;
      if (c.title) chatMeta.title = stripEmojis(c.title) || '9OF';
      if (c.username) chatMeta.username = c.username;
      if (c.description || c.bio) {
        chatMeta.description = stripEmojis(c.description || c.bio);
      }
      if (c.photo && (c.photo.big_file_id || c.photo.small_file_id)) {
        const fid = c.photo.big_file_id || c.photo.small_file_id;
        chatMeta.avatar = `/api/telegram-image?file_id=${encodeURIComponent(fid)}`;
      }
      if (c.pinned_message) {
        pinnedPost = convertBotMessageToPost(c.pinned_message, true);
        if (c.pinned_message.message_id > maxKnownId) {
          maxKnownId = c.pinned_message.message_id + 30;
        }
      }
    }

    if (countRes.ok && typeof countRes.result === 'number') {
      chatMeta.subscribers = String(countRes.result);
    }
  } catch {}

  // 2. Fallback avatar/meta check from public t.me/chanel9of page if Bot avatar was empty
  if (!chatMeta.avatar) {
    try {
      const pageRes = await fetch(`https://t.me/${CHAT_USERNAME}`);
      if (pageRes.ok) {
        const pageHtml = await pageRes.text();
        const avatarMatch = pageHtml.match(/<img class="tgme_page_photo_image"[^>]*src="([^"]+)"/i);
        if (avatarMatch && avatarMatch[1]) {
          chatMeta.avatar = `/api/telegram-image?url=${encodeURIComponent(avatarMatch[1])}`;
        }
        const extraMatch = pageHtml.match(/<div class="tgme_page_extra"[^>]*>([^<]+)<\/div>/i);
        if (extraMatch && extraMatch[1]) {
          const numMatch = extraMatch[1].match(/[\d\s]+/);
          if (numMatch) chatMeta.subscribers = numMatch[0].replace(/\s+/g, '');
        }
      }
    } catch {}
  }

  // 3. Load persisted chat messages from Firebase RTDB
  let storedMessagesMap = {};
  let lastBackfillTs = 0;
  try {
    const rtdbRes = await fetch(`${RTDB_URL}/telegram_chat_9of.json`);
    if (rtdbRes.ok) {
      const rtdbData = await rtdbRes.json();
      if (rtdbData && typeof rtdbData === 'object') {
        if (rtdbData.messages && typeof rtdbData.messages === 'object') {
          storedMessagesMap = rtdbData.messages;
        }
        if (typeof rtdbData.lastBackfillTs === 'number') {
          lastBackfillTs = rtdbData.lastBackfillTs;
        }
      }
    }
  } catch {}

  // Save pinned message if present
  if (pinnedPost && pinnedPost.id) {
    storedMessagesMap[pinnedPost.id] = {
      ...(storedMessagesMap[pinnedPost.id] || {}),
      ...pinnedPost,
      pinned: true
    };
  }

  // 4. Drain any pending getUpdates or ensure Webhook is registered on OFMEDIA API bot
  try {
    const whRes = await callTelegramBot('getWebhookInfo');
    const webhookUrl = whRes.ok && whRes.result ? whRes.result.url : '';
    let newUpdatesSaved = false;

    if (!webhookUrl) {
      const updatesRes = await callTelegramBot('getUpdates', {
        limit: 100,
        allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post']
      });
      if (updatesRes.ok && Array.isArray(updatesRes.result)) {
        for (const upd of updatesRes.result) {
          const msg =
            upd.message || upd.edited_message || upd.channel_post || upd.edited_channel_post;
          if (!msg || !msg.chat) continue;
          const chatUser = (msg.chat.username || '').toLowerCase();
          const chatTitle = (msg.chat.title || '').toUpperCase();
          if (chatUser === CHAT_USERNAME || chatTitle.includes('9OF')) {
            const converted = convertBotMessageToPost(msg, false);
            if (converted) {
              storedMessagesMap[converted.id] = converted;
              newUpdatesSaved = true;
              const numId = parseInt(converted.id, 10);
              if (numId > maxKnownId) maxKnownId = numId + 20;
            }
          }
        }
      }
      // Register webhook on production so all future messages in 9OF are intercepted in real time
      await callTelegramBot('setWebhook', {
        url: 'https://ofmedia.ru/api/telegram-news?webhook=1',
        allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post'],
        drop_pending_updates: false
      });
    }

    if (newUpdatesSaved) {
      await fetch(`${RTDB_URL}/telegram_chat_9of/messages.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storedMessagesMap)
      }).catch(() => {});
    }
  } catch {}

  // 5. Backfill & sync existing messages from public group embed (t.me/chanel9of/{id}?embed=1&mode=tme)
  const existingNumericIds = Object.keys(storedMessagesMap)
    .map((k) => parseInt(k, 10))
    .filter((n) => !isNaN(n) && n > 0);
  if (existingNumericIds.length > 0) {
    const highestStored = Math.max(...existingNumericIds);
    if (highestStored + 25 > maxKnownId) {
      maxKnownId = highestStored + 25;
    }
  }

  const now = Date.now();
  const shouldBackfill =
    existingNumericIds.length === 0 || forceRefresh || now - lastBackfillTs > 45 * 1000;

  if (shouldBackfill) {
    const idsToProbe = [];
    if (existingNumericIds.length === 0) {
      // Initial full scan of message IDs 1..maxKnownId (up to 120)
      const upper = Math.min(Math.max(maxKnownId, 80), 120);
      for (let id = 1; id <= upper; id++) {
        idsToProbe.push(id);
      }
    } else {
      // Incremental scan around the latest messages
      const highest = Math.max(...existingNumericIds);
      const startId = Math.max(1, highest - 5);
      const endId = highest + 25;
      for (let id = startId; id <= endId; id++) {
        idsToProbe.push(id);
      }
    }

    const batchSize = 20;
    const newlyFound = {};
    for (let i = 0; i < idsToProbe.length; i += batchSize) {
      const batch = idsToProbe.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (msgId) => {
          try {
            const embedRes = await fetch(
              `https://t.me/${CHAT_USERNAME}/${msgId}?embed=1&mode=tme`,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                  Referer: `https://t.me/${CHAT_USERNAME}`
                }
              }
            );
            if (!embedRes.ok) return null;
            const html = await embedRes.text();
            return parseEmbedChatMessageHtml(html, msgId, CHAT_USERNAME);
          } catch {
            return null;
          }
        })
      );

      for (const item of results) {
        if (item && item.id) {
          const prev = storedMessagesMap[item.id];
          const merged = {
            ...item,
            pinned: Boolean((prev && prev.pinned) || (pinnedPost && pinnedPost.id === item.id))
          };
          storedMessagesMap[item.id] = merged;
          newlyFound[item.id] = merged;
        }
      }
    }

    try {
      await fetch(`${RTDB_URL}/telegram_chat_9of.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: storedMessagesMap,
          lastBackfillTs: now,
          meta: chatMeta
        })
      });
    } catch {}
  }

  // 6. Filter hidden posts and sort newest first
  const allChatPosts = Object.values(storedMessagesMap)
    .filter((p) => p && p.id && !hiddenPosts[p.id] && !hiddenPosts[`tg_${p.id}`])
    .sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numB - numA;
    });

  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
  return res.json({
    ok: true,
    channel: chatMeta,
    count: allChatPosts.length,
    posts: allChatPosts
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const host = req.headers.host || 'localhost';
  const urlObj = new URL(req.url, 'http://' + host);

  // Handle POST requests: either Telegram Bot Webhook or sending a message to 9OF chat
  if (req.method === 'POST') {
    const body = await readBodyJson(req);

    // Case A: User sending a message from the OFMEDIA Telegram Portal into 9OF chat
    if (body && body.action === 'sendMessage') {
      const text = stripEmojis(String(body.text || '').trim());
      const senderName = stripEmojis(String(body.author || 'Гость OFMEDIA').trim());
      if (!text) {
        res.statusCode = 400;
        return res.json({ ok: false, error: 'Пустое сообщение' });
      }
      const formattedText = senderName ? `${senderName}: ${text}` : text;
      const sendRes = await callTelegramBot('sendMessage', {
        chat_id: `@${CHAT_USERNAME}`,
        text: formattedText
      });

      if (sendRes.ok && sendRes.result) {
        const newPost = convertBotMessageToPost(sendRes.result, false);
        if (newPost) {
          newPost.author = senderName || newPost.author;
          newPost.title = senderName || newPost.title;
          newPost.content = text;
          await fetch(`${RTDB_URL}/telegram_chat_9of/messages/${newPost.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
          }).catch(() => {});
        }
        return res.json({ ok: true, post: newPost });
      } else {
        res.statusCode = 500;
        return res.json({ ok: false, error: 'Не удалось отправить сообщение через бота' });
      }
    }

    // Case B: Incoming Telegram Bot Webhook update
    const msg =
      body.message || body.edited_message || body.channel_post || body.edited_channel_post;
    if (msg && msg.chat) {
      const chatUser = (msg.chat.username || '').toLowerCase();
      const chatTitle = (msg.chat.title || '').toUpperCase();
      if (chatUser === CHAT_USERNAME || chatTitle.includes('9OF')) {
        const post = convertBotMessageToPost(msg, false);
        if (post) {
          await fetch(`${RTDB_URL}/telegram_chat_9of/messages/${post.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
          }).catch(() => {});
        }
      }
    }
    return res.json({ ok: true });
  }

  const beforeParam = urlObj.searchParams.get('before');
  const channelParam = (urlObj.searchParams.get('channel') || CHANNEL_USERNAME)
    .replace(/^@/, '')
    .trim()
    .toLowerCase();
  const rawLimit = urlObj.searchParams.get('limit');
  const limitParam =
    rawLimit && rawLimit !== 'all' && parseInt(rawLimit, 10) > 0
      ? parseInt(rawLimit, 10)
      : Infinity;

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

  // 2. If requested target is the 9OF chat (@chanel9of), use dedicated Bot + Embed interceptor
  if (channelParam === CHAT_USERNAME || channelParam === '9of') {
    return handleChat9OF(req, res, urlObj, hiddenPosts);
  }

  // 3. Otherwise, scrape the entire broadcast channel (@ofmedi) without any artificial ceiling
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  };

  const parseMessagesFromHtml = (html, channelName) => {
    let channelTitle = channelName.toUpperCase();
    let channelDescription = '';
    let subscribers = '';
    let channelAvatar = '';

    const titleMatch = html.match(
      /<div class="tgme_channel_info_header_title"[^>]*><span[^>]*>([\s\S]*?)<\/span>/i
    );
    if (titleMatch) {
      channelTitle = cleanHtmlTags(titleMatch[1]);
    }

    const descMatch = html.match(
      /<div class="tgme_channel_info_description"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (descMatch) {
      channelDescription = cleanHtmlTags(descMatch[1]);
    }

    const subMatch = html.match(
      /<span class="counter_value">([^<]+)<\/span>\s*<span class="counter_type">(?:subscribers|members|подписчик[^<]*)<\/span>/i
    );
    if (subMatch) {
      subscribers = subMatch[1].trim();
    }

    const avatarMatch = html.match(
      /<i class="tgme_page_photo_image[^"]*"[^>]*><img src="([^"]+)"/i
    );
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
      const textMatch = block.match(
        /<div class="tgme_widget_message_text[^"]*"[^>]*dir="auto">([\s\S]*?)<\/div>/i
      );
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
      const fwdMatch = block.match(
        /<div class="tgme_widget_message_forwarded_from_name"[^>]*>([\s\S]*?)<\/div>/i
      );
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
          plainText =
            images.length > 1
              ? `Фотоальбом (${images.length} фото)`
              : `Медиаматериал канала @${channelName}`;
        }
      }

      const lines = plainText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let title =
        lines[0] ||
        (images.length > 1
          ? `Фотоальбом (${images.length} фото)`
          : images.length > 0
          ? 'Медиаматериал'
          : `Публикация #${postId}`);
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
        channel: `@${channelName}`,
        isChat: false
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

    // Full history pagination loop: walk backwards until post #1 or no older messages exist
    let loopCount = 0;
    const maxPages = 50; // Up to ~1000 posts without any artificial 20/50 ceiling
    while (postsMap.size < limitParam && loopCount < maxPages) {
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

    const finalPosts = Number.isFinite(limitParam) ? allPosts.slice(0, limitParam) : allPosts;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({
      ok: true,
      channel: {
        title: parsedFirst.channelTitle,
        username: channelParam,
        description: parsedFirst.channelDescription,
        subscribers: parsedFirst.subscribers,
        avatar: parsedFirst.channelAvatar,
        url: `https://t.me/${channelParam}`,
        isChat: false
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
