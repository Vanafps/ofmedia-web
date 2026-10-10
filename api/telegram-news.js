const BOT_TOKENS = [
  '8811060825:AAFbFQjE060LOPqwgnzvC_iEnsXPpPpAIAA',
  '8610727941:AAGMaWuuCWH6dEdIt4gJPbcz2pl2RDOz6zI'
];
const CHANNEL_USERNAME = 'ofmedi';
const CHAT_USERNAME = 'chanel9of';
const RTDB_URL = 'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app';

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

/**
 * Normalizes Telegram HTML emoji wrappers:
 * - Converts <i class="emoji" ...><b>🤨</b></i> into standard Unicode emoji 🤨
 * - Strips custom <tg-emoji ...> wrappers down to their standard fallback character (no custom emoji assets)
 */
function normalizeTelegramEmojisInHtml(html) {
  if (!html) return '';
  return html
    .replace(/<tg-emoji[^>]*>([\s\S]*?)<\/tg-emoji>/gi, (_, inner) => {
      return decodeHtmlEntities(inner.replace(/<\/?[^>]+(>|$)/g, ''));
    })
    .replace(/<i class="emoji"[^>]*>([\s\S]*?)<\/i>/gi, (_, inner) => {
      return decodeHtmlEntities(inner.replace(/<\/?[^>]+(>|$)/g, ''));
    });
}

function cleanHtmlTags(html) {
  if (!html) return '';
  const withNormalizedEmojis = normalizeTelegramEmojisInHtml(html);
  const cleaned = decodeHtmlEntities(
    withNormalizedEmojis
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
  return cleaned;
}

function translateReplyMetaText(text) {
  if (!text) return '';
  return text
    .replace(/\bSticker\b/gi, 'Стикер')
    .replace(/\bPhoto\b/gi, 'Фото')
    .replace(/\bVideo message\b/gi, 'Видеосообщение')
    .replace(/\bVoice message\b/gi, 'Голосовое сообщение')
    .replace(/\bVideo\b/gi, 'Видео')
    .replace(/\bAudio\b/gi, 'Аудио')
    .replace(/\bFile\b/gi, 'Файл')
    .trim();
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
    authorName = parts.join(' ').trim() || msg.from.username || 'Участник 9OF';
    if (msg.from.username) authorUsername = `@${msg.from.username}`;
  } else if (msg.sender_chat) {
    authorName = (msg.sender_chat.title || '').trim() || '9OF';
    if (msg.sender_chat.username && msg.sender_chat.username.toLowerCase() !== CHAT_USERNAME) {
      authorUsername = `@${msg.sender_chat.username}`;
    }
  }

  const plainText = (msg.text || msg.caption || '').trim();

  const images = [];
  let isSticker = false;
  let stickerUrl = null;
  let stickerVideoUrl = null;
  let stickerEmoji = '';

  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const bestPhoto = msg.photo[msg.photo.length - 1];
    if (bestPhoto && bestPhoto.file_id) {
      images.push(`/api/telegram-image?file_id=${encodeURIComponent(bestPhoto.file_id)}`);
    }
  }
  if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/')) {
    images.push(`/api/telegram-image?file_id=${encodeURIComponent(msg.document.file_id)}`);
  }
  if (msg.sticker) {
    isSticker = true;
    stickerEmoji = msg.sticker.emoji || '';
    const thumbObj = msg.sticker.thumbnail || msg.sticker.thumb;
    if (!msg.sticker.is_animated && !msg.sticker.is_video && msg.sticker.file_id) {
      stickerUrl = `/api/telegram-image?file_id=${encodeURIComponent(msg.sticker.file_id)}`;
      images.push(stickerUrl);
    } else if (thumbObj && thumbObj.file_id) {
      stickerUrl = `/api/telegram-image?file_id=${encodeURIComponent(thumbObj.file_id)}`;
      images.push(stickerUrl);
    }
    if (msg.sticker.is_video && msg.sticker.file_id) {
      stickerVideoUrl = `/api/telegram-image?file_id=${encodeURIComponent(msg.sticker.file_id)}`;
    }
  }

  let forwardedFrom = null;
  if (msg.forward_from_chat && msg.forward_from_chat.title) {
    forwardedFrom = msg.forward_from_chat.title.trim();
  } else if (msg.forward_from) {
    forwardedFrom = [msg.forward_from.first_name, msg.forward_from.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
  } else if (msg.forward_sender_name) {
    forwardedFrom = msg.forward_sender_name.trim();
  }

  let replyTo = null;
  if (msg.reply_to_message && msg.reply_to_message.message_id) {
    const replyFrom = msg.reply_to_message.from
      ? [msg.reply_to_message.from.first_name, msg.reply_to_message.from.last_name]
          .filter(Boolean)
          .join(' ')
          .trim()
      : msg.reply_to_message.sender_chat && msg.reply_to_message.sender_chat.title
      ? msg.reply_to_message.sender_chat.title.trim()
      : 'Сообщение';
    const replyText = (
      msg.reply_to_message.text ||
      msg.reply_to_message.caption ||
      (msg.reply_to_message.sticker
        ? `${msg.reply_to_message.sticker.emoji || ''} Стикер`.trim()
        : 'Медиавложение')
    )
      .trim()
      .slice(0, 120);
    replyTo = {
      id: String(msg.reply_to_message.message_id),
      author: replyFrom,
      text: replyText
    };
  }

  if (!plainText && images.length === 0 && !isSticker && !forwardedFrom) {
    return null;
  }

  const dateIso = msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString();
  const dateFormatted = formatRussianDate(dateIso);
  const contentText =
    plainText ||
    (isSticker
      ? `${stickerEmoji ? stickerEmoji + ' ' : ''}Стикер`.trim()
      : images.length > 0
      ? ''
      : forwardedFrom
      ? `Переслано от ${forwardedFrom}`
      : '');

  return {
    id: msgId,
    title: authorName,
    author: authorName,
    authorUsername,
    authorAvatar: null,
    content: contentText,
    rawHtml: plainText || '',
    date: dateIso,
    dateFormatted,
    views: '',
    images,
    originalImages: images,
    coverImage: images[0] || null,
    isSticker,
    stickerUrl,
    stickerVideoUrl,
    stickerEmoji,
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

  // 1. Extract and strip the reply block FIRST so we never confuse reply author/sticker/text with message author/sticker/text
  let replyTo = null;
  let htmlWithoutReply = html;
  const replyBlockMatch = html.match(
    /<a class="tgme_widget_message_reply[^"]*"[^>]*href="https?:\/\/t\.me\/[^\/]+\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i
  );
  if (replyBlockMatch) {
    const replyId = replyBlockMatch[1];
    const replyInner = replyBlockMatch[2];
    const replyAuthorMatch = replyInner.match(
      /<(?:span|a) class="tgme_widget_message_author_name[^"]*"[^>]*>([\s\S]*?)<\/(?:span|a)>/i
    );
    const replyTextMatch =
      replyInner.match(/<div class="tgme_widget_message_metatext[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
      replyInner.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const replyThumbWebpMatch =
      replyInner.match(/data-webp="([^"]+)"/i) ||
      replyInner.match(/background-image:\s*url\(['"]?(https?:\/\/[^'")]+)['"]?\)/i);
    const rawReplyThumb = replyThumbWebpMatch ? replyThumbWebpMatch[1] : null;
    replyTo = {
      id: replyId,
      author: replyAuthorMatch ? cleanHtmlTags(replyAuthorMatch[1]) : 'Сообщение',
      text: replyTextMatch
        ? translateReplyMetaText(cleanHtmlTags(replyTextMatch[1])).slice(0, 120)
        : 'Сообщение в чате',
      thumb: rawReplyThumb ? `/api/telegram-image?url=${encodeURIComponent(rawReplyThumb)}` : null
    };
    htmlWithoutReply = html.replace(replyBlockMatch[0], '');
  }

  // 2. Extract real sender author name (prioritizing tgme_widget_message_author_name and tgme_widget_message_from_author over group owner_name)
  let authorName = 'Участник 9OF';
  const authorMatch =
    htmlWithoutReply.match(
      /<(?:a|span) class="tgme_widget_message_author_name[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span)>/i
    ) ||
    htmlWithoutReply.match(
      /<(?:a|span) class="tgme_widget_message_from_author[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span)>/i
    ) ||
    htmlWithoutReply.match(
      /<a class="tgme_widget_message_owner_name[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    );
  if (authorMatch) {
    const cleanedAuthor = cleanHtmlTags(authorMatch[1]);
    if (cleanedAuthor) authorName = cleanedAuthor;
  }

  // Extract sender's personal @username if linked on author_name or user avatar (never use @chanel9of for participants)
  let authorUsername = '';
  const senderHrefMatch =
    htmlWithoutReply.match(
      /<a class="tgme_widget_message_(?:author_name|from_author)[^"]*"[^>]*href="https?:\/\/t\.me\/([^"\/?#]+)"/i
    ) ||
    htmlWithoutReply.match(
      /<div class="tgme_widget_message_user"><a href="https?:\/\/t\.me\/([^"\/?#]+)"/i
    );
  if (senderHrefMatch && senderHrefMatch[1]) {
    const candidateUser = senderHrefMatch[1].trim();
    if (candidateUser.toLowerCase() !== chatUsername.toLowerCase()) {
      authorUsername = `@${candidateUser}`;
    }
  }

  let authorAvatar = null;
  let authorAvatarOriginal = null;
  const userPhotoMatch = htmlWithoutReply.match(
    /<i class="tgme_widget_message_user_photo[^"]*"[^>]*><img src="([^"]+)"/i
  );
  if (userPhotoMatch && userPhotoMatch[1]) {
    authorAvatarOriginal = userPhotoMatch[1];
    authorAvatar = `/api/telegram-image?url=${encodeURIComponent(userPhotoMatch[1])}`;
  }

  // 3. Extract message text & normalize emojis (preserving standard Unicode emojis, stripping custom emoji images)
  let rawTextHtml = '';
  let plainText = '';
  const textMatches = [
    ...htmlWithoutReply.matchAll(
      /<div class="tgme_widget_message_text[^"]*"[^>]*dir="auto">([\s\S]*?)<\/div>/gi
    )
  ];
  if (textMatches.length > 0) {
    rawTextHtml = normalizeTelegramEmojisInHtml(textMatches[textMatches.length - 1][1].trim());
    plainText = cleanHtmlTags(rawTextHtml);
  }

  // 4. Extract stickers (WebP static/animated preview or video sticker)
  let isSticker = false;
  let stickerUrl = null;
  let originalStickerUrl = null;
  let stickerVideoUrl = null;
  const hasStickerClass =
    htmlWithoutReply.includes('tgme_widget_message_sticker') ||
    htmlWithoutReply.includes('sticker_media') ||
    htmlWithoutReply.includes('tgme_widget_message_videosticker');

  if (hasStickerClass) {
    const webpMatch = htmlWithoutReply.match(/data-webp="([^"]+)"/i);
    if (webpMatch && webpMatch[1]) {
      originalStickerUrl = webpMatch[1].trim();
      stickerUrl = `/api/telegram-image?url=${encodeURIComponent(originalStickerUrl)}`;
      isSticker = true;
    }
    const videoStickerMatch =
      htmlWithoutReply.match(
        /<video[^>]*class="[^"]*tgme_widget_message_videosticker[^"]*"[^>]*src="([^"]+)"/i
      ) ||
      htmlWithoutReply.match(
        /<video[^>]*src="([^"]+)"[^>]*class="[^"]*tgme_widget_message_videosticker[^"]*"/i
      );
    if (videoStickerMatch && videoStickerMatch[1]) {
      const rawVid = videoStickerMatch[1].trim();
      stickerVideoUrl = `/api/telegram-image?url=${encodeURIComponent(rawVid)}`;
      isSticker = true;
    }
  }

  // 5. Extract regular photos (ignoring data:image/svg+xml skeletons and emoji sprites)
  const images = [];
  const originalImages = [];
  if (isSticker && stickerUrl) {
    images.push(stickerUrl);
    if (originalStickerUrl) originalImages.push(originalStickerUrl);
  }

  const photoRegex = /background-image:\s*url\((?:'|&quot;|"|)?([^'")&]+)(?:'|&quot;|"|)?\)/gi;
  let photoMatch;
  while ((photoMatch = photoRegex.exec(htmlWithoutReply)) !== null) {
    const rawUrl = photoMatch[1].trim();
    if (
      rawUrl &&
      !rawUrl.startsWith('data:') &&
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

  if (!dateIso) {
    return null;
  }

  if (!plainText && images.length === 0 && !isSticker && !forwardedFrom && !serviceText) {
    return null;
  }

  const finalContent =
    plainText ||
    serviceText ||
    (isSticker
      ? 'Стикер'
      : forwardedFrom
      ? `Переслано из: ${forwardedFrom}`
      : '');

  return {
    id: String(msgId),
    title: authorName,
    author: authorName,
    authorUsername,
    authorAvatar,
    authorAvatarOriginal,
    content: finalContent,
    rawHtml: rawTextHtml || '',
    date: dateIso || dateFormatted,
    dateFormatted: dateFormatted || dateIso,
    views: '',
    images,
    originalImages,
    coverImage: images[0] || null,
    isSticker,
    stickerUrl,
    stickerVideoUrl,
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

async function probeChatEmbedIds(idsToProbe, chatUsername = CHAT_USERNAME, batchSize = 50) {
  const foundMap = {};
  for (let i = 0; i < idsToProbe.length; i += batchSize) {
    const batch = idsToProbe.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (msgId) => {
        try {
          const embedRes = await fetch(
            `https://t.me/${chatUsername}/${msgId}?embed=1&mode=tme`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                Referer: `https://t.me/${chatUsername}`
              }
            }
          );
          if (!embedRes.ok) return null;
          const html = await embedRes.text();
          return parseEmbedChatMessageHtml(html, msgId, chatUsername);
        } catch {
          return null;
        }
      })
    );
    for (const item of results) {
      if (item && item.id) {
        foundMap[item.id] = item;
      }
    }
  }
  return foundMap;
}

async function handleChat9OF(req, res, urlObj, hiddenPosts) {
  const forceRefresh = urlObj.searchParams.get('refresh') === '1';
  const scanFromParam = parseInt(urlObj.searchParams.get('scanFrom') || '', 10);
  const scanCountParam = parseInt(urlObj.searchParams.get('scanCount') || '', 10);
  const beforeIdParam = parseInt(urlObj.searchParams.get('beforeId') || '', 10);

  // 1. Fetch live chat metadata via Telegram Bot API (OFMEDIA API bot in 9OF)
  let chatMeta = {
    title: '9OF',
    username: CHAT_USERNAME,
    description: 'Чат сообщества 9OF (@chanel9of)',
    subscribers: '33',
    avatar: '',
    url: `https://t.me/${CHAT_USERNAME}`,
    isChat: true
  };

  let pinnedPost = null;
  let anchorMaxId = 13685;

  try {
    const [chatRes, countRes] = await Promise.all([
      callTelegramBot('getChat', { chat_id: `@${CHAT_USERNAME}` }),
      callTelegramBot('getChatMemberCount', { chat_id: `@${CHAT_USERNAME}` })
    ]);

    if (chatRes.ok && chatRes.result) {
      const c = chatRes.result;
      if (c.title) chatMeta.title = c.title.trim() || '9OF';
      if (c.username) chatMeta.username = c.username;
      if (c.description || c.bio) {
        chatMeta.description = (c.description || c.bio).trim();
      }
      if (c.photo && (c.photo.big_file_id || c.photo.small_file_id)) {
        const fid = c.photo.big_file_id || c.photo.small_file_id;
        chatMeta.avatar = `/api/telegram-image?file_id=${encodeURIComponent(fid)}`;
      }
      if (c.pinned_message) {
        pinnedPost = convertBotMessageToPost(c.pinned_message, true);
        if (c.pinned_message.message_id > anchorMaxId) {
          anchorMaxId = c.pinned_message.message_id;
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

  // 3. Load persisted chat messages from Firebase RTDB & clean any legacy misparsed entries
  let storedMessagesMap = {};
  let lastBackfillTs = 0;
  let minScannedId = 0;
  try {
    const rtdbRes = await fetch(`${RTDB_URL}/telegram_chat_9of.json`);
    if (rtdbRes.ok) {
      const rtdbData = await rtdbRes.json();
      if (rtdbData && typeof rtdbData === 'object') {
        if (rtdbData.messages && typeof rtdbData.messages === 'object') {
          for (const [k, msgObj] of Object.entries(rtdbData.messages)) {
            if (!msgObj || !msgObj.id) continue;
            // Purge old misparsed entries where author was wrongly set to 9OF/@chanel9of or had SVG skeleton
            const hasSvgSkeleton =
              msgObj.coverImage && String(msgObj.coverImage).startsWith('data:image/svg+xml');
            const isLegacyWrongAuthor =
              msgObj.author === '9OF' && msgObj.authorUsername === '@chanel9of';
            if (!hasSvgSkeleton && !isLegacyWrongAuthor) {
              storedMessagesMap[k] = msgObj;
            }
          }
        }
        if (typeof rtdbData.lastBackfillTs === 'number') {
          lastBackfillTs = rtdbData.lastBackfillTs;
        }
        if (typeof rtdbData.minScannedId === 'number') {
          minScannedId = rtdbData.minScannedId;
        }
      }
    }
  } catch {}

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
              storedMessagesMap[converted.id] = {
                ...(storedMessagesMap[converted.id] || {}),
                ...converted
              };
              newUpdatesSaved = true;
              const numId = parseInt(converted.id, 10);
              if (numId > anchorMaxId) anchorMaxId = numId;
            }
          }
        }
      }
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

  const highestStored =
    existingNumericIds.length > 0 ? Math.max(...existingNumericIds, anchorMaxId) : anchorMaxId;
  const lowestStored =
    existingNumericIds.length > 0 ? Math.min(...existingNumericIds) : anchorMaxId;
  if (!minScannedId || minScannedId > lowestStored) {
    minScannedId = lowestStored;
  }

  const now = Date.now();
  const idsToProbe = [];

  if (!isNaN(scanFromParam) && scanFromParam > 0) {
    // Explicit range scan requested (e.g. ?scanFrom=13690&scanCount=250)
    const count = !isNaN(scanCountParam) && scanCountParam > 0 ? Math.min(scanCountParam, 350) : 250;
    for (let id = scanFromParam; id >= Math.max(1, scanFromParam - count + 1); id--) {
      idsToProbe.push(id);
    }
    const lowestProbed = Math.max(1, scanFromParam - count + 1);
    if (!minScannedId || lowestProbed < minScannedId) {
      minScannedId = lowestProbed;
    }
  } else if (!isNaN(beforeIdParam) && beforeIdParam > 1) {
    // Scroll-up history pagination requested by client (?beforeId=13600)
    const start = beforeIdParam - 1;
    const end = Math.max(1, start - 220);
    for (let id = start; id >= end; id--) {
      if (!storedMessagesMap[String(id)]) idsToProbe.push(id);
    }
    if (end < minScannedId) minScannedId = end;
  } else {
    // Standard request:
    // A) Always check for new messages above highestStored if refreshed or >15s since last check
    if (forceRefresh || now - lastBackfillTs > 15 * 1000 || existingNumericIds.length < 25) {
      for (let id = highestStored + 30; id >= Math.max(1, highestStored - 5); id--) {
        if (!storedMessagesMap[String(id)] || id >= highestStored - 3) {
          idsToProbe.push(id);
        }
      }
    }
    // B) If we have fewer than 40 messages cached, scan backwards across gaps (220 IDs per pass)
    if (existingNumericIds.length < 40 && minScannedId > 1) {
      const startBack = minScannedId;
      const endBack = Math.max(1, startBack - 220);
      for (let id = startBack; id >= endBack; id--) {
        if (!storedMessagesMap[String(id)] && !idsToProbe.includes(id)) {
          idsToProbe.push(id);
        }
      }
      minScannedId = endBack;
    }
  }

  if (idsToProbe.length > 0) {
    const newlyFound = await probeChatEmbedIds(idsToProbe, CHAT_USERNAME, 55);
    for (const [idKey, item] of Object.entries(newlyFound)) {
      const prev = storedMessagesMap[idKey];
      storedMessagesMap[idKey] = {
        ...item,
        pinned: Boolean((prev && prev.pinned) || (pinnedPost && pinnedPost.id === idKey))
      };
    }
  }

  // Ensure pinned message is marked pinned (and enriched by embed parser if available)
  if (pinnedPost && pinnedPost.id) {
    if (storedMessagesMap[pinnedPost.id]) {
      storedMessagesMap[pinnedPost.id].pinned = true;
    } else {
      storedMessagesMap[pinnedPost.id] = { ...pinnedPost, pinned: true };
    }
  }

  if (idsToProbe.length > 0) {
    try {
      await fetch(`${RTDB_URL}/telegram_chat_9of.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: storedMessagesMap,
          lastBackfillTs: now,
          minScannedId,
          meta: chatMeta
        })
      });
    } catch {}
  }

  // 6. Filter hidden posts and sort newest first (UI can reverse for chronological chat view)
  const allChatPosts = Object.values(storedMessagesMap)
    .filter((p) => p && p.id && !hiddenPosts[p.id] && !hiddenPosts[`tg_${p.id}`])
    .sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numB - numA;
    });

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
  return res.json({
    ok: true,
    channel: chatMeta,
    minScannedId,
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
      const text = String(body.text || '').trim();
      const userId = String(body.userId || '').trim();
      let senderName = String(body.author || '').trim();
      const replyToMessageId = body.replyToId ? parseInt(String(body.replyToId), 10) : undefined;
      if (!text) {
        res.statusCode = 400;
        return res.json({ ok: false, error: 'Пустое сообщение' });
      }

      // If userId is provided, verify linked Telegram username from Firebase RTDB to prevent spoofing
      if (userId) {
        try {
          const lRes = await fetch(`${RTDB_URL}/telegram_linked_users/${encodeURIComponent(userId)}.json`);
          if (lRes.ok) {
            const lData = await lRes.json();
            if (lData && lData.telegramUsername) {
              senderName = lData.telegramUsername;
            }
          }
        } catch {}
      }

      const effectiveSender = senderName || 'Участник 9OF';
      const formattedText = `${effectiveSender}: ${text}`;
      const sendParams = {
        chat_id: `@${CHAT_USERNAME}`,
        text: formattedText
      };
      if (replyToMessageId && !isNaN(replyToMessageId)) {
        sendParams.reply_to_message_id = replyToMessageId;
      }
      const sendRes = await callTelegramBot('sendMessage', sendParams);

      if (sendRes.ok && sendRes.result) {
        const newPost = convertBotMessageToPost(sendRes.result, false);
        if (newPost) {
          newPost.author = effectiveSender;
          newPost.title = effectiveSender;
          newPost.content = text;
          newPost.rawHtml = text;
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

    // Handle Telegram Account Linking via bot (@ofmedia_apibot /start link_<userId>)
    if (msg && msg.chat && msg.chat.type === 'private' && msg.text && msg.text.startsWith('/start link_')) {
      const linkUserId = msg.text.replace('/start link_', '').trim();
      const tgUsername = msg.from && msg.from.username ? `@${msg.from.username}` : (msg.from ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() : 'Пользователь');
      const tgId = msg.from ? msg.from.id : null;
      if (linkUserId && tgUsername) {
        await fetch(`${RTDB_URL}/telegram_linked_users/${encodeURIComponent(linkUserId)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: linkUserId,
            telegramId: tgId,
            telegramUsername: tgUsername,
            firstName: msg.from?.first_name || '',
            lastName: msg.from?.last_name || '',
            linkedAt: Date.now()
          })
        }).catch(() => {});
        await callTelegramBot('sendMessage', {
          chat_id: msg.chat.id,
          text: `✅ Ваш аккаунт Telegram (${tgUsername}) успешно привязан к профилю OFMEDIA!\n\nТеперь вы можете писать сообщения в чат 9OF с сайта и из приложения под своим именем без спама и анонимности.`
        }).catch(() => {});
        return res.json({ ok: true, linked: true });
      }
    }

    if (msg && msg.chat) {
      const chatUser = (msg.chat.username || '').toLowerCase();
      const chatTitle = (msg.chat.title || '').toUpperCase();
      if (chatUser === CHAT_USERNAME || chatTitle.includes('9OF')) {
        let post = convertBotMessageToPost(msg, false);
        // Try enriching with public embed avatar/author if available
        try {
          const embedRes = await fetch(
            `https://t.me/${CHAT_USERNAME}/${msg.message_id}?embed=1&mode=tme`,
            { headers: { Referer: `https://t.me/${CHAT_USERNAME}` } }
          );
          if (embedRes.ok) {
            const embedHtml = await embedRes.text();
            const parsedEmbed = parseEmbedChatMessageHtml(embedHtml, msg.message_id, CHAT_USERNAME);
            if (parsedEmbed) {
              post = { ...post, ...parsedEmbed };
            }
          }
        } catch {}
        if (post) {
          await fetch(`${RTDB_URL}/telegram_chat_9of/messages/${post.id}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
          }).catch(() => {});
        }
      } else if (chatUser === CHANNEL_USERNAME || chatTitle.includes('OFMEDIA')) {
        // Trigger immediate channel sync in RTDB so new channel posts appear with zero lag
        try {
          const chRes = await fetch(`https://t.me/s/${CHANNEL_USERNAME}`);
          if (chRes.ok) {
            await fetch(`${RTDB_URL}/telegram_channel_ofmedi/lastWebhookTs.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(Date.now())
            });
          }
        } catch {}
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

  const actionParam = urlObj.searchParams.get('action');
  if (actionParam === 'get_link') {
    const userId = urlObj.searchParams.get('userId');
    if (!userId) return res.json({ ok: false, error: 'userId required' });
    try {
      const lRes = await fetch(`${RTDB_URL}/telegram_linked_users/${encodeURIComponent(userId)}.json`);
      if (lRes.ok) {
        const lData = await lRes.json();
        return res.json({ ok: true, linked: Boolean(lData && lData.telegramUsername), data: lData });
      }
    } catch {}
    return res.json({ ok: true, linked: false });
  }

  if (actionParam === 'confirm_link') {
    const userId = urlObj.searchParams.get('userId');
    const tgHandle = (urlObj.searchParams.get('username') || '').trim();
    if (!userId || !tgHandle) return res.json({ ok: false, error: 'userId and username required' });
    const normalizedHandle = tgHandle.startsWith('@') ? tgHandle : `@${tgHandle}`;
    const payload = {
      userId,
      telegramUsername: normalizedHandle,
      linkedAt: Date.now(),
      manualConfirmed: true
    };
    try {
      await fetch(`${RTDB_URL}/telegram_linked_users/${encodeURIComponent(userId)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json({ ok: true, linked: true, data: payload });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  }

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

  // 3. Scrape the broadcast channel (@ofmedi) with real-time top-page check + full RTDB history down to post #1
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
        rawTextHtml = normalizeTelegramEmojisInHtml(textMatch[1].trim());
        plainText = cleanHtmlTags(rawTextHtml);
      }

      // Check for stickers in channel posts too
      let isSticker = false;
      let stickerUrl = null;
      let originalStickerUrl = null;
      if (
        block.includes('tgme_widget_message_sticker') ||
        block.includes('sticker_media')
      ) {
        const webpMatch = block.match(/data-webp="([^"]+)"/i);
        if (webpMatch && webpMatch[1]) {
          originalStickerUrl = webpMatch[1].trim();
          stickerUrl = `/api/telegram-image?url=${encodeURIComponent(originalStickerUrl)}`;
          isSticker = true;
        }
      }

      const images = [];
      const originalImages = [];
      if (isSticker && stickerUrl) {
        images.push(stickerUrl);
        if (originalStickerUrl) originalImages.push(originalStickerUrl);
      }

      const photoRegex = /background-image:\s*url\((?:'|&quot;|"|)?([^'")&]+)(?:'|&quot;|"|)?\)/gi;
      let photoMatch;
      while ((photoMatch = photoRegex.exec(block)) !== null) {
        const rawUrl = photoMatch[1].trim();
        if (
          rawUrl &&
          !rawUrl.startsWith('data:') &&
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

      if (!plainText && images.length === 0 && !isSticker && !forwardedFrom) {
        continue;
      }

      if (!plainText) {
        if (isSticker) {
          plainText = 'Стикер';
        } else if (forwardedFrom) {
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

      // Extract author for de-anonymized or signed channel posts
      let signedAuthor = null;
      let signedAuthorUsername = null;
      const signedMatch = block.match(/<span class="tgme_widget_message_signed"[^>]*>([\s\S]*?)<\/span>/i);
      const fromAuthorMatch = block.match(/<div class="tgme_widget_message_from_author"[^>]*>([\s\S]*?)<\/div>/i);
      const authorNameMatch = block.match(/<a class="tgme_widget_message_author_name"[^>]*>([\s\S]*?)<\/a>/i);
      if (signedMatch) {
        signedAuthor = cleanHtmlTags(signedMatch[1]);
      } else if (fromAuthorMatch) {
        signedAuthor = cleanHtmlTags(fromAuthorMatch[1]);
      } else if (authorNameMatch) {
        const parsedName = cleanHtmlTags(authorNameMatch[1]);
        if (parsedName && !parsedName.toUpperCase().includes('OFMEDIA')) {
          signedAuthor = parsedName;
        }
        const hrefMatch = authorNameMatch[0].match(/href="https?:\/\/t\.me\/([^\/"]+)"/i);
        if (hrefMatch && hrefMatch[1] && hrefMatch[1].toLowerCase() !== channelName.toLowerCase()) {
          signedAuthorUsername = `@${hrefMatch[1]}`;
        }
      }

      // Check author signature at end of text (e.g. - Лидия Павловна)
      if (!signedAuthor && lines.length > 1) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.startsWith('- ') && lastLine.length > 2 && lastLine.length < 40) {
          signedAuthor = lastLine.replace(/^-\s*/, '').trim();
        }
      }

      const effectiveAuthor = signedAuthor || channelTitle || 'OFMEDIA';

      postsList.push({
        id: postId,
        title,
        author: effectiveAuthor,
        authorUsername: signedAuthorUsername || null,
        content: plainText,
        rawHtml: rawTextHtml,
        date: dateIso || dateFormatted,
        dateFormatted,
        views,
        images,
        originalImages,
        coverImage: images[0] || null,
        isSticker,
        stickerUrl,
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
    // A. Load cached full channel history from Firebase RTDB so we don't have to re-fetch 100 pages on every hit
    const postsMap = new Map();
    let cachedChannelMeta = null;
    if (!beforeParam) {
      try {
        const cachedRes = await fetch(`${RTDB_URL}/telegram_news_v5.json`);
        if (cachedRes.ok) {
          const cachedData = await cachedRes.json();
          if (cachedData && Array.isArray(cachedData.posts)) {
            for (const p of cachedData.posts) {
              if (p && p.id && !hiddenPosts[p.id] && !hiddenPosts[`tg_${p.id}`]) {
                postsMap.set(String(p.id), p);
              }
            }
          }
          if (cachedData && cachedData.channel) {
            cachedChannelMeta = cachedData.channel;
          }
        }
      } catch {}
    }

    // B. ALWAYS fetch the live top page of https://t.me/s/ofmedi so new posts appear immediately (0 lag!)
    let targetUrl = `https://t.me/s/${channelParam}`;
    if (beforeParam) {
      targetUrl += `?before=${encodeURIComponent(beforeParam)}`;
    }

    const firstRes = await fetch(targetUrl, { headers });
    if (!firstRes.ok && postsMap.size === 0) {
      throw new Error(`Upstream returned HTTP ${firstRes.status}`);
    }

    let parsedFirst = {
      channelTitle: cachedChannelMeta?.title || 'OFMEDIA',
      channelDescription: cachedChannelMeta?.description || '',
      subscribers: cachedChannelMeta?.subscribers || '',
      channelAvatar: cachedChannelMeta?.avatar || '',
      postsList: []
    };

    let newTopPostsCount = 0;
    if (firstRes.ok) {
      const firstHtml = await firstRes.text();
      parsedFirst = parseMessagesFromHtml(firstHtml, channelParam);
      for (const post of parsedFirst.postsList) {
        if (!postsMap.has(post.id)) {
          newTopPostsCount++;
        }
        // Always overwrite top page posts so views, edits, and emojis are fresh
        postsMap.set(post.id, post);
      }
    }

    // C. Check if we already have the complete history down to the very first existing post in @ofmedi
    const getNumericIds = () =>
      Array.from(postsMap.keys())
        .map((id) => parseInt(id, 10))
        .filter((n) => !isNaN(n) && n > 0);

    let currentOldest = getNumericIds().length > 0 ? Math.min(...getNumericIds()) : Infinity;

    // Paginate downwards until we reach the beginning of the channel (oldestId <= 5 or upstream returns 0 older posts)
    let loopCount = 0;
    const maxPagesPerInvocation = 60;
    let historyExpanded = false;

    while (postsMap.size < limitParam && loopCount < maxPagesPerInvocation && currentOldest > 5) {
      loopCount++;
      try {
        const nextUrl = `https://t.me/s/${channelParam}?before=${currentOldest}`;
        const nextRes = await fetch(nextUrl, { headers });
        if (!nextRes.ok) break;
        const nextHtml = await nextRes.text();
        const parsedNext = parseMessagesFromHtml(nextHtml, channelParam);
        if (parsedNext.postsList.length === 0) {
          // Reached the absolute beginning of the channel!
          currentOldest = 1;
          break;
        }
        let addedInPage = 0;
        let minIdInPage = currentOldest;
        for (const post of parsedNext.postsList) {
          const numId = parseInt(post.id, 10);
          if (!isNaN(numId) && numId < minIdInPage) minIdInPage = numId;
          if (!postsMap.has(post.id)) {
            postsMap.set(post.id, post);
            addedInPage++;
            historyExpanded = true;
          }
        }
        if (minIdInPage >= currentOldest || addedInPage === 0) {
          break;
        }
        currentOldest = minIdInPage;
      } catch {
        break;
      }
    }

    const allPosts = Array.from(postsMap.values()).filter(
      (p) => p && p.id && !hiddenPosts[p.id] && !hiddenPosts[`tg_${p.id}`]
    );
    allPosts.sort((a, b) => {
      const numA = parseInt(a.id, 10) || 0;
      const numB = parseInt(b.id, 10) || 0;
      return numB - numA;
    });

    const channelPayload = {
      title: parsedFirst.channelTitle || 'OFMEDIA',
      username: channelParam,
      description: parsedFirst.channelDescription,
      subscribers: parsedFirst.subscribers,
      avatar: parsedFirst.channelAvatar,
      url: `https://t.me/${channelParam}`,
      isChat: false
    };

    // Persist complete channel history to Firebase RTDB so subsequent requests & mirror fallback have all posts
    if (!beforeParam && (newTopPostsCount > 0 || historyExpanded || urlObj.searchParams.get('refresh') === '1')) {
      try {
        await fetch(`${RTDB_URL}/telegram_news_v5.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updatedAt: Date.now(),
            channel: channelPayload,
            count: allPosts.length,
            posts: allPosts
          })
        });
      } catch {}
    }

    const finalPosts = Number.isFinite(limitParam) ? allPosts.slice(0, limitParam) : allPosts;

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    return res.json({
      ok: true,
      channel: channelPayload,
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
