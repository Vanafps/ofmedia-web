const BOT_TOKEN = '8610727941:AAGMaWuuCWH6dEdIt4gJPbcz2pl2RDOz6zI';
const WEB_APP_URL = 'https://app.ofmedia.online';

async function callTelegram(method, body = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

async function main() {
  console.log('[OFMEDIA Bot Setup] Initializing Telegram Bot configuration...');

  // 1. Verify Bot Info
  const me = await callTelegram('getMe');
  if (!me.ok) {
    console.error('[OFMEDIA Bot Setup] Failed to get bot info:', me);
    process.exit(1);
  }
  console.log(`[OFMEDIA Bot Setup] Connected to @${me.result.username} (${me.result.first_name})`);

  // 2. Set Bot Name
  const nameRes = await callTelegram('setMyName', {
    name: 'OFMEDIA — Онлайн-кинотеатр'
  });
  console.log('[OFMEDIA Bot Setup] setMyName:', nameRes.ok ? 'SUCCESS' : nameRes.description);

  // 3. Set Bot Description (shown in chat before pressing Start)
  const descRes = await callTelegram('setMyDescription', {
    description: 'Официальный онлайн-кинотеатр оригинальных фильмов и клипов OFMEDIA.\n\nДесятки фильмов, клипов и шоу собственного производства в Full HD 1080p без рекламы. Умный плеер с жестами, синхронизация истории и избранного прямо внутри Telegram!'
  });
  console.log('[OFMEDIA Bot Setup] setMyDescription:', descRes.ok ? 'SUCCESS' : descRes.description);

  // 4. Set Bot Short Description (shown on profile page)
  const shortDescRes = await callTelegram('setMyShortDescription', {
    short_description: 'Онлайн-кинотеатр оригинальных фильмов и клипов OFMEDIA в Telegram.'
  });
  console.log('[OFMEDIA Bot Setup] setMyShortDescription:', shortDescRes.ok ? 'SUCCESS' : shortDescRes.description);

  // 5. Set Bot Commands
  const commandsRes = await callTelegram('setMyCommands', {
    commands: [
      { command: 'start', description: 'Запустить кинотеатр OFMEDIA' },
      { command: 'cinema', description: 'Открыть каталог фильмов' },
      { command: 'help', description: 'О проекте и поддержка' }
    ]
  });
  console.log('[OFMEDIA Bot Setup] setMyCommands:', commandsRes.ok ? 'SUCCESS' : commandsRes.description);

  // 6. Set Chat Menu Button to WebApp (Persistent bottom-left button in chat)
  const menuBtnRes = await callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '🎬 Кинотеатр',
      web_app: {
        url: WEB_APP_URL
      }
    }
  });
  console.log('[OFMEDIA Bot Setup] setChatMenuButton:', menuBtnRes.ok ? 'SUCCESS' : menuBtnRes.description);

  console.log('\n[OFMEDIA Bot Setup] All bot configurations applied successfully!');
  console.log(`[OFMEDIA Bot Setup] Test the bot: https://t.me/${me.result.username}`);
}

main().catch(console.error);
