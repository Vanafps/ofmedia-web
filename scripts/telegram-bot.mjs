/**
 * OFMEDIA Telegram Bot Runtime (Long-polling)
 * Zero external dependencies — runs natively with modern Node.js fetch
 */

const BOT_TOKEN = '8610727941:AAGMaWuuCWH6dEdIt4gJPbcz2pl2RDOz6zI';
const WEB_APP_URL = 'https://app.ofmedia.online';

async function callTelegram(method, body = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Bot Error] ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendWelcome(chatId, userName = 'Зритель') {
  const text = 
`👋 Привет, *${userName}*!

Добро пожаловать в *OFMEDIA* — официальный онлайн-кинотеатр оригинальных фильмов и клипов собственного производства!

🔥 *Что вас ждёт внутри:*
• Десятки оригинальных фильмов в Full HD 1080p
• Умный видеоплеер с жестами (двойной тап, перемотка, автоповорот)
• Быстрый вход и синхронизация избранного с вашим Telegram-аккаунтом
• Без рекламы и подписок

Нажмите кнопку ниже, чтобы запустить кинотеатр прямо в Telegram:`;

  const reply_markup = {
    inline_keyboard: [
      [
        {
          text: '🎬 Смотреть в OFMEDIA',
          web_app: { url: WEB_APP_URL }
        }
      ],
      [
        {
          text: '📱 Открыть сайт',
          url: 'https://app.ofmedia.ru'
        },
        {
          text: '⭐ Избранное',
          web_app: { url: `${WEB_APP_URL}?tab=favorites` }
        }
      ]
    ]
  };

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup
  });
}

async function sendHelp(chatId) {
  const text =
`ℹ️ *Справка по OFMEDIA:*

OFMEDIA — независимый онлайн-кинотеатр и медиаплатформа оригинального контента.

🔹 *Как смотреть фильмы?*
Нажмите кнопку «🎬 Кинотеатр» в левом нижнем углу или кнопку в сообщении выше.

🔹 *Качество видео:*
Все релизы доступны в качестве Full HD 1080p со стереозвуком.

🔹 *Поддержка:*
По всем вопросам и предложениям пишите в поддержку кинотеатра.`;

  const reply_markup = {
    inline_keyboard: [
      [
        {
          text: '🎬 Открыть кинотеатр',
          web_app: { url: WEB_APP_URL }
        }
      ]
    ]
  };

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup
  });
}

let offset = 0;

async function pollUpdates() {
  const res = await callTelegram('getUpdates', {
    offset,
    timeout: 30,
    allowed_updates: ['message']
  });

  if (res.ok && Array.isArray(res.result)) {
    for (const update of res.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      if (!msg || !msg.text) continue;

      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const userName = msg.from?.first_name || 'Зритель';

      console.log(`[Bot] Message from @${msg.from?.username || msg.from?.id}: "${text}"`);

      if (text.startsWith('/start') || text.startsWith('/cinema')) {
        await sendWelcome(chatId, userName);
      } else if (text.startsWith('/help')) {
        await sendHelp(chatId);
      } else {
        await sendWelcome(chatId, userName);
      }
    }
  }
}

async function start() {
  const me = await callTelegram('getMe');
  if (!me.ok) {
    console.error('[Bot] Failed to connect:', me);
    return;
  }
  console.log(`[Bot] Started listening as @${me.result.username}...`);

  while (true) {
    try {
      await pollUpdates();
    } catch (e) {
      console.error('[Bot] Polling loop error:', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

start();
