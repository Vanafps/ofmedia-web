import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface TelegramReplyPreview {
  id: string;
  author: string;
  text: string;
  thumb?: string | null;
}

export interface TelegramPortalPost {
  id: string;
  title: string;
  author?: string;
  authorUsername?: string;
  authorAvatar?: string | null;
  authorAvatarOriginal?: string | null;
  content: string;
  rawHtml?: string;
  date: string;
  dateFormatted?: string;
  views?: string;
  images: string[];
  originalImages?: string[];
  coverImage?: string | null;
  isSticker?: boolean;
  stickerUrl?: string | null;
  stickerVideoUrl?: string | null;
  stickerEmoji?: string;
  pinned?: boolean;
  forwardedFrom?: string | null;
  replyTo?: TelegramReplyPreview | null;
  url: string;
  channel: string;
  isChat?: boolean;
}

export interface TelegramChannelMeta {
  title: string;
  username: string;
  description: string;
  subscribers: string;
  avatar: string;
  url: string;
  isChat?: boolean;
}

interface TelegramPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserName?: string | null;
}

const STANDARD_QUICK_EMOJIS = [
  '\u{1F44D}', // 👍
  '\u{1F525}', // 🔥
  '\u{1F602}', // 😂
  '\u{2764}\u{FE0F}', // ❤️
  '\u{1F928}', // 🤨
  '\u{1F44F}', // 👏
  '\u{1F389}', // 🎉
  '\u{1F4AF}', // 💯
  '\u{1F60E}', // 😎
  '\u{1F91D}', // 🤝
  '\u{1F64F}', // 🙏
  '\u{1F440}', // 👀
];

const USER_NAME_COLORS = [
  'text-[#38bdf8]',
  'text-[#fb923c]',
  'text-[#a78bfa]',
  'text-[#34d399]',
  'text-[#f472b6]',
  'text-[#facc15]',
  'text-[#60a5fa]',
];

const AVATAR_BG_COLORS = [
  'bg-sky-500/25 border-sky-500/40 text-sky-300',
  'bg-orange-500/25 border-orange-500/40 text-orange-300',
  'bg-violet-500/25 border-violet-500/40 text-violet-300',
  'bg-emerald-500/25 border-emerald-500/40 text-emerald-300',
  'bg-pink-500/25 border-pink-500/40 text-pink-300',
  'bg-amber-500/25 border-amber-500/40 text-amber-300',
];

function getNameHashIndex(name: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

const SmartTelegramImage: React.FC<{
  src: string;
  originalSrc?: string | null;
  alt?: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, originalSrc, alt = '', className = '', onClick }) => {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (src) list.push(src);
    if (originalSrc && originalSrc.startsWith('http')) {
      list.push(`https://wsrv.nl/?url=${encodeURIComponent(originalSrc)}`);
      list.push(originalSrc);
    } else if (src.includes('url=')) {
      try {
        const u = new URL(src, 'https://ofmedia.ru');
        const raw = u.searchParams.get('url');
        if (raw && raw.startsWith('http')) {
          list.push(`https://wsrv.nl/?url=${encodeURIComponent(raw)}`);
          list.push(raw);
        }
      } catch {}
    }
    return Array.from(new Set(list));
  }, [src, originalSrc]);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [src, originalSrc]);

  if (failed || candidates.length === 0) {
    return null;
  }

  return (
    <img
      src={candidates[Math.min(attempt, candidates.length - 1)]}
      alt={alt}
      className={className}
      loading="lazy"
      onClick={onClick}
      onError={() => {
        if (attempt + 1 < candidates.length) {
          setAttempt((a) => a + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
};

function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#38bdf8] hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const TelegramPortalModal: React.FC<TelegramPortalModalProps> = ({
  isOpen,
  onClose,
  defaultUserName,
}) => {
  const [activeChannel, setActiveChannel] = useState<'ofmedi' | 'chanel9of'>('ofmedi');
  const [posts, setPosts] = useState<TelegramPortalPost[]>([]);
  const [channelMeta, setChannelMeta] = useState<TelegramChannelMeta | null>(null);
  const [minScannedId, setMinScannedId] = useState<number>(13450);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Chat composer state for 9OF (@chanel9of)
  const [chatAuthor, setChatAuthor] = useState<string>(defaultUserName || '');
  const [chatText, setChatText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<TelegramPortalPost | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef<boolean>(false);

  useEffect(() => {
    if (defaultUserName && !chatAuthor) {
      setChatAuthor(defaultUserName);
    }
  }, [defaultUserName]);

  const getApiHost = () => {
    const isDirectVercelDomain =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'ofmedia.ru' ||
        window.location.hostname === 'www.ofmedia.ru');
    return isDirectVercelDomain ? '' : 'https://ofmedia.ru';
  };

  const imageHostBase = 'https://ofmedia.ru';

  const normalizePostUrls = (p: any): TelegramPortalPost => {
    const resolveUrl = (u?: string | null) =>
      u && u.startsWith('/') ? `${imageHostBase}${u}` : u || null;

    return {
      ...p,
      authorAvatar: resolveUrl(p.authorAvatar),
      coverImage: resolveUrl(p.coverImage),
      stickerUrl: resolveUrl(p.stickerUrl),
      stickerVideoUrl: resolveUrl(p.stickerVideoUrl),
      replyTo: p.replyTo
        ? {
            ...p.replyTo,
            thumb: resolveUrl(p.replyTo.thumb),
          }
        : null,
      images: Array.isArray(p.images)
        ? p.images.map((img: string) => (img.startsWith('/') ? `${imageHostBase}${img}` : img))
        : [],
    };
  };

  const fetchChannelData = async (
    targetChannel: 'ofmedi' | 'chanel9of',
    forceRefresh: boolean = false
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const apiBase = getApiHost();
      const refreshQuery = forceRefresh ? '&refresh=1' : '';
      const endpoint = `${apiBase}/api/telegram-news?channel=${targetChannel}${refreshQuery}`;

      let data: any = null;
      try {
        const res = await fetch(endpoint);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          data = await res.json();
        }
      } catch {}

      if (!data) {
        try {
          const prodRes = await fetch(
            `https://ofmedia.ru/api/telegram-news?channel=${targetChannel}${refreshQuery}`
          );
          if (prodRes.ok) {
            data = await prodRes.json();
          }
        } catch {}
      }

      // Direct Firebase RTDB fallback so ofmedia.online and Russia users without VPN always load
      if (!data) {
        try {
          if (targetChannel === 'ofmedi') {
            const rtdbRes = await fetch(
              'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app/telegram_news_v5.json'
            );
            if (rtdbRes.ok) {
              const rtdbData = await rtdbRes.json();
              if (rtdbData && Array.isArray(rtdbData.posts)) {
                data = {
                  ok: true,
                  channel: rtdbData.channel,
                  posts: rtdbData.posts,
                };
              }
            }
          } else {
            const rtdbRes = await fetch(
              'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app/telegram_chat_9of.json'
            );
            if (rtdbRes.ok) {
              const rtdbData = await rtdbRes.json();
              if (rtdbData && rtdbData.messages) {
                const list = Object.values(rtdbData.messages).sort((a: any, b: any) => {
                  return (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0);
                });
                data = {
                  ok: true,
                  channel: rtdbData.meta,
                  minScannedId: rtdbData.minScannedId || 13000,
                  posts: list,
                };
              }
            }
          }
        } catch {}
      }

      if (data && data.ok && Array.isArray(data.posts)) {
        const resolvedPosts: TelegramPortalPost[] = data.posts.map(normalizePostUrls);
        if (targetChannel === 'chanel9of') {
          shouldScrollToBottomRef.current = true;
        }
        setPosts(resolvedPosts);
        if (typeof data.minScannedId === 'number') {
          setMinScannedId(data.minScannedId);
        } else if (resolvedPosts.length > 0) {
          const nums = resolvedPosts
            .map((p) => parseInt(p.id, 10))
            .filter((n) => !isNaN(n) && n > 0);
          if (nums.length > 0) setMinScannedId(Math.min(...nums));
        }
        if (data.channel) {
          setChannelMeta({
            ...data.channel,
            avatar:
              data.channel.avatar && data.channel.avatar.startsWith('/')
                ? `${imageHostBase}${data.channel.avatar}`
                : data.channel.avatar,
          });
        }
      } else {
        throw new Error(data?.error || 'Не удалось получить данные');
      }
    } catch (err: any) {
      console.warn('Telegram portal fetch error:', err);
      setErrorMessage('Не удалось загрузить данные Telegram. Проверьте соединение.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadOlderChatMessages = async () => {
    if (isLoadingOlderChat || activeChannel !== 'chanel9of') return;
    setIsLoadingOlderChat(true);
    try {
      const apiBase = getApiHost() || 'https://ofmedia.ru';
      const res = await fetch(
        `${apiBase}/api/telegram-news?channel=chanel9of&beforeId=${minScannedId}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.posts)) {
          const resolved: TelegramPortalPost[] = data.posts.map(normalizePostUrls);
          setPosts(resolved);
          if (typeof data.minScannedId === 'number') {
            setMinScannedId(data.minScannedId);
          }
        }
      }
    } catch {}
    setIsLoadingOlderChat(false);
  };

  useEffect(() => {
    if (isOpen) {
      setReplyingTo(null);
      fetchChannelData(activeChannel, false);
    }
  }, [isOpen, activeChannel]);

  // Chronological order (oldest -> newest) for Chat 9OF, newest -> oldest for Channel OFMEDIA
  const displayedPosts = useMemo(() => {
    if (activeChannel === 'chanel9of') {
      return [...posts].sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));
    }
    return posts;
  }, [posts, activeChannel]);

  const pinnedChatPost = useMemo(() => {
    if (activeChannel !== 'chanel9of') return null;
    return posts.find((p) => p.pinned) || null;
  }, [posts, activeChannel]);

  useEffect(() => {
    if (activeChannel === 'chanel9of' && shouldScrollToBottomRef.current && !isLoading) {
      const el = chatScrollRef.current;
      if (el) {
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 60);
      }
      shouldScrollToBottomRef.current = false;
    }
  }, [displayedPosts, activeChannel, isLoading]);

  const scrollToMessageId = (targetId: string) => {
    const node = document.getElementById(`tg-msg-${targetId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.classList.add('ring-2', 'ring-[#0088cc]');
      setTimeout(() => {
        node.classList.remove('ring-2', 'ring-[#0088cc]');
      }, 1800);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || isSending) return;
    setIsSending(true);
    setSendNotice(null);
    try {
      const apiBase = getApiHost() || 'https://ofmedia.ru';
      const sender = (chatAuthor || defaultUserName || 'Гость OFMEDIA').trim();
      const res = await fetch(`${apiBase}/api/telegram-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          channel: 'chanel9of',
          author: sender,
          text: chatText.trim(),
          replyToId: replyingTo?.id,
        }),
      });
      const data = await res.json();
      if (data && data.ok && data.post) {
        const normalized = normalizePostUrls(data.post);
        setChatText('');
        setReplyingTo(null);
        shouldScrollToBottomRef.current = true;
        setPosts((prev) => [normalized, ...prev]);
        setSendNotice('Сообщение доставлено в чат 9OF');
        setTimeout(() => setSendNotice(null), 3500);
      } else {
        setSendNotice(data?.error || 'Ошибка отправки сообщения');
      }
    } catch {
      setSendNotice('Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const isChatMode = activeChannel === 'chanel9of';

  return (
    <div className="min-h-screen h-screen w-full bg-[#070709] text-zinc-100 flex flex-col overflow-hidden select-text">
      {/* Top Full-Page Navigation Header */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#0b0b10]/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">На главную OFMEDIA</span>
            <span className="sm:hidden">Назад</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-[#0088cc] shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-sm sm:text-base text-white truncate">
                  OFMEDIA Telegram
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#0088cc]/20 text-[#38bdf8] border border-[#0088cc]/30 text-[10px] font-semibold shrink-0">
                  Без VPN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden md:block truncate">
                Прямой мост к официальному каналу @ofmedi и чату сообщества @chanel9of
              </p>
            </div>
          </div>
        </div>

        {/* Center Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveChannel('ofmedi')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeChannel === 'ofmedi'
                ? 'bg-[#0088cc] text-white shadow-[0_0_20px_rgba(0,136,204,0.45)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Канал OFMEDIA</span>
            <span className="hidden sm:inline ml-1 opacity-80">(@ofmedi)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel('chanel9of')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeChannel === 'chanel9of'
                ? 'bg-[#0088cc] text-white shadow-[0_0_20px_rgba(0,136,204,0.45)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Чат 9OF</span>
            <span className="hidden sm:inline ml-1 opacity-80">(@chanel9of)</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isLoading && posts.length > 0 && (
            <span className="hidden xl:inline-block text-xs text-zinc-400 font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
              {isChatMode ? `${posts.length} сообщ.` : `${posts.length} публ.`}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchChannelData(activeChannel, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 hover:text-white transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            title="Синхронизировать с Telegram"
          >
            <svg
              className={`w-3.5 h-3.5 fill-none stroke-current ${isLoading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              strokeWidth="2.3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Обновить</span>
          </button>

          <a
            href={`https://t.me/${isChatMode ? 'chanel9of' : 'ofmedi'}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#38bdf8] hover:text-white border border-[#0088cc]/30 text-xs font-semibold transition-all"
          >
            <span>Открыть в TG</span>
            <span>→</span>
          </a>
        </div>
      </header>

      {/* Main Full-Page Workspace */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar (Desktop Telegram-style Directory & Info) */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-r border-white/10 bg-[#0b0b10] flex-col justify-between p-5 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 px-1">
                Разделы Telegram
              </div>
              <div className="space-y-2">
                {/* Item 1: Канал OFMEDIA */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('ofmedi')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    !isChatMode
                      ? 'bg-[#0088cc]/15 border-[#0088cc]/40 shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#ff5c00]/20 border border-[#ff5c00]/40 flex items-center justify-center text-[#ff5c00] font-bold text-sm shrink-0">
                    OF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white truncate">Канал OFMEDIA</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                        @ofmedi
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      Официальные анонсы, премьеры и архив постов
                    </p>
                  </div>
                </button>

                {/* Item 2: Чат 9OF */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('chanel9of')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isChatMode
                      ? 'bg-[#0088cc]/15 border-[#0088cc]/40 shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#0088cc]/25 border border-[#0088cc]/40 flex items-center justify-center text-[#38bdf8] font-bold text-sm shrink-0">
                    9OF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white truncate">Чат 9OF</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Live-чат
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      Общение участников, стикеры, ответы и медиа
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Channel / Chat Metadata Card */}
            {channelMeta && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  {channelMeta.avatar ? (
                    <SmartTelegramImage
                      src={channelMeta.avatar}
                      alt={channelMeta.title}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/15 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/30 border border-[#0088cc]/50 flex items-center justify-center text-white font-bold text-base shrink-0">
                      {channelMeta.title.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-base truncate">{channelMeta.title}</h2>
                    <div className="text-xs text-[#38bdf8] font-mono">@{channelMeta.username}</div>
                    {channelMeta.subscribers && (
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {channelMeta.subscribers}{' '}
                        {isChatMode ? 'участников в группе' : 'подписчиков канала'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                  {isChatMode
                    ? 'Групповой чат сообщества 9OF (@chanel9of). Бот OFMEDIA API перехватывает сообщения, ответы, фотографии, стандартные эмодзи и стикеры в реальном времени.'
                    : channelMeta.description || 'Официальный Telegram-канал платформы OFMEDIA.'}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    OFMEDIA API активен
                  </span>
                  <span className="font-mono">
                    {isChatMode ? `${posts.length} сообщ.` : `${posts.length} постов`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-500 space-y-1">
            <div>Прямой серверный прокси-мост OFMEDIA</div>
            <div>Работает в РФ на всех устройствах без VPN</div>
          </div>
        </aside>

        {/* Right Main Feed / Messenger Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090d]">
          {/* Subheader for Chat Pinned Message (9OF Chat Mode) */}
          {isChatMode && pinnedChatPost && (
            <div
              onClick={() => scrollToMessageId(pinnedChatPost.id)}
              className="px-4 sm:px-6 py-2.5 bg-[#11131c] border-b border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#161925] transition-colors shrink-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-8 rounded-full bg-[#0088cc] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#38bdf8] flex items-center gap-1.5">
                    <span>Закрепленное сообщение</span>
                    <span className="text-zinc-500 font-mono">#{pinnedChatPost.id}</span>
                  </div>
                  <div className="text-xs text-zinc-300 truncate">{pinnedChatPost.content}</div>
                </div>
              </div>
              <span className="text-[11px] text-zinc-500 shrink-0 hidden sm:inline">
                Перейти →
              </span>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4"
          >
            {isLoading ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center gap-3 text-zinc-400">
                <div className="w-9 h-9 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-sm">
                  {isChatMode
                    ? 'Синхронизация сообщений, стикеров и участников чата 9OF...'
                    : 'Загрузка полной истории канала OFMEDIA (@ofmedi)...'}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="py-20 text-center space-y-3">
                <div className="text-sm text-red-400 font-medium">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => fetchChannelData(activeChannel, true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all cursor-pointer"
                >
                  Повторить попытку
                </button>
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="py-20 text-center text-sm text-zinc-400">
                Сообщений пока нет
              </div>
            ) : isChatMode ? (
              /* =========================================================
                 CHAT 9OF (@chanel9of) — REAL MESSENGER CHAT BUBBLE VIEW
                 ========================================================= */
              <div className="max-w-4xl mx-auto space-y-3 pb-4">
                {/* Load Older Chat History Button */}
                {minScannedId > 1 && (
                  <div className="flex justify-center pb-2">
                    <button
                      type="button"
                      onClick={handleLoadOlderChatMessages}
                      disabled={isLoadingOlderChat}
                      className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoadingOlderChat ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
                          <span>Сканирование ранней истории чата...</span>
                        </>
                      ) : (
                        <span>Загрузить более ранние сообщения чата (до #{minScannedId})</span>
                      )}
                    </button>
                  </div>
                )}

                {displayedPosts.map((post) => {
                  const senderName = post.author || post.title || 'Участник 9OF';
                  const colorClass =
                    USER_NAME_COLORS[getNameHashIndex(senderName, USER_NAME_COLORS.length)];
                  const avatarBgClass =
                    AVATAR_BG_COLORS[getNameHashIndex(senderName, AVATAR_BG_COLORS.length)];
                  const showTextContent =
                    Boolean(post.content) && !(post.isSticker && post.content === 'Стикер');

                  return (
                    <div
                      key={post.id}
                      id={`tg-msg-${post.id}`}
                      className="flex items-end gap-2.5 sm:gap-3 group transition-all rounded-2xl p-1"
                    >
                      {/* Participant Avatar */}
                      <div className="shrink-0 self-start mt-0.5">
                        {post.authorAvatar ? (
                          <SmartTelegramImage
                            src={post.authorAvatar}
                            originalSrc={post.authorAvatarOriginal}
                            alt={senderName}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/15 bg-zinc-800"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center font-bold text-xs sm:text-sm ${avatarBgClass}`}
                          >
                            {senderName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Messenger Chat Bubble */}
                      <div
                        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-sm px-3.5 sm:px-4 py-2.5 border transition-colors ${
                          post.isSticker && !showTextContent && !post.replyTo
                            ? 'bg-transparent border-transparent px-1 py-1'
                            : 'bg-[#141622] border-white/10 hover:border-white/20 shadow-md'
                        }`}
                      >
                        {/* Sender Name + Username + Reply Action */}
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`font-bold text-xs sm:text-[13px] truncate ${colorClass}`}>
                              {senderName}
                            </span>
                            {post.authorUsername && post.authorUsername !== '@chanel9of' && (
                              <span className="text-[11px] text-zinc-500 font-mono truncate">
                                {post.authorUsername}
                              </span>
                            )}
                            {post.pinned && (
                              <span className="px-1.5 py-0.5 rounded bg-[#ff5c00]/20 text-[#ff5c00] text-[10px] font-semibold">
                                Закреплено
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setReplyingTo(post)}
                            className="opacity-70 group-hover:opacity-100 text-[11px] text-zinc-400 hover:text-[#38bdf8] transition-opacity cursor-pointer shrink-0"
                            title="Ответить на это сообщение"
                          >
                            Ответить
                          </button>
                        </div>

                        {/* Replied Message Quote Block */}
                        {post.replyTo && (
                          <div
                            onClick={() => scrollToMessageId(post.replyTo!.id)}
                            className="mb-2 pl-2.5 pr-3 py-1.5 rounded-lg bg-[#0088cc]/10 border-l-2 border-[#38bdf8] cursor-pointer hover:bg-[#0088cc]/15 transition-colors flex items-center gap-2.5"
                          >
                            {post.replyTo.thumb && (
                              <SmartTelegramImage
                                src={post.replyTo.thumb}
                                alt="Reply preview"
                                className="w-8 h-8 rounded object-contain bg-black/20 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-[#38bdf8] truncate">
                                {post.replyTo.author}
                              </div>
                              <div className="text-xs text-zinc-300 truncate">
                                {post.replyTo.text}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Forwarded Header */}
                        {post.forwardedFrom && (
                          <div className="mb-1.5 text-xs text-[#38bdf8] font-medium">
                            Переслано от {post.forwardedFrom}
                          </div>
                        )}

                        {/* Sticker Graphic */}
                        {post.isSticker && (post.stickerUrl || post.images[0]) && (
                          <div className="py-1">
                            <SmartTelegramImage
                              src={post.stickerUrl || post.images[0]}
                              originalSrc={post.originalImages?.[0]}
                              alt={post.stickerEmoji || 'Стикер Telegram'}
                              onClick={() => setSelectedImage(post.stickerUrl || post.images[0])}
                              className="w-36 h-36 sm:w-44 sm:h-44 object-contain cursor-pointer drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* Regular Attached Photos (Non-sticker) */}
                        {!post.isSticker && post.images && post.images.length > 0 && (
                          <div
                            className={`grid gap-1.5 my-1.5 ${
                              post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                            }`}
                          >
                            {post.images.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedImage(imgUrl)}
                                className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer max-h-80"
                              >
                                <SmartTelegramImage
                                  src={imgUrl}
                                  originalSrc={post.originalImages?.[idx]}
                                  alt="Вложение чата"
                                  className="w-full h-full max-h-80 object-contain bg-black/30 hover:scale-[1.02] transition-transform"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Text (with standard Unicode emojis & clickable links) */}
                        {showTextContent && (
                          <div className="text-[13px] sm:text-sm text-zinc-100 leading-relaxed whitespace-pre-line break-words">
                            {renderTextWithLinks(post.content)}
                          </div>
                        )}

                        {/* Message Timestamp & ID Footer */}
                        <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-zinc-500 font-mono">
                          <span>{post.dateFormatted || post.date}</span>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-zinc-300 transition-colors"
                          >
                            #{post.id}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* =========================================================
                 CHANNEL OFMEDIA (@ofmedi) — BROADCAST POSTS FEED VIEW
                 ========================================================= */
              <div className="max-w-3xl mx-auto space-y-4 pb-8">
                {displayedPosts.map((post) => {
                  const showTextContent =
                    Boolean(post.content) && !(post.isSticker && post.content === 'Стикер');

                  return (
                    <article
                      key={post.id}
                      className="bg-[#12131a] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-3 shadow-lg hover:border-white/20 transition-all"
                    >
                      {/* Channel Post Header */}
                      <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-white text-sm">OFMEDIA</span>
                          <span className="text-zinc-500 font-mono">@ofmedi</span>
                          {post.pinned && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ff5c00]/20 text-[#ff5c00] border border-[#ff5c00]/30 text-[10px] font-semibold">
                              Закреплено
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {post.dateFormatted || post.date}
                        </span>
                      </div>

                      {post.forwardedFrom && (
                        <div className="text-xs text-[#38bdf8] font-medium bg-[#0088cc]/10 border-l-2 border-[#0088cc] px-3 py-1.5 rounded-r-lg">
                          Переслано из: {post.forwardedFrom}
                        </div>
                      )}

                      {/* Channel Post Sticker */}
                      {post.isSticker && (post.stickerUrl || post.images[0]) && (
                        <div className="py-2">
                          <SmartTelegramImage
                            src={post.stickerUrl || post.images[0]}
                            originalSrc={post.originalImages?.[0]}
                            alt="Стикер"
                            onClick={() => setSelectedImage(post.stickerUrl || post.images[0])}
                            className="w-44 h-44 object-contain cursor-pointer drop-shadow-xl"
                          />
                        </div>
                      )}

                      {/* Channel Post Text (preserving standard emojis) */}
                      {showTextContent && (
                        <div className="text-sm sm:text-[15px] text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                          {renderTextWithLinks(post.content)}
                        </div>
                      )}

                      {/* Channel Post Photo Album */}
                      {!post.isSticker && post.images && post.images.length > 0 && (
                        <div
                          className={`grid gap-2 pt-1 ${
                            post.images.length === 1
                              ? 'grid-cols-1'
                              : post.images.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-2 sm:grid-cols-3'
                          }`}
                        >
                          {post.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setSelectedImage(imgUrl)}
                              className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer group aspect-video max-h-96"
                            >
                              <SmartTelegramImage
                                src={imgUrl}
                                originalSrc={post.originalImages?.[imgIdx]}
                                alt="Медиа канала OFMEDIA"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Channel Post Footer */}
                      <div className="flex items-center justify-between pt-2 text-xs text-zinc-500 border-t border-white/5">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>#{post.id}</span>
                          {post.views && (
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5 fill-none stroke-current"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              <span>{post.views}</span>
                            </span>
                          )}
                        </div>

                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                        >
                          <span>Открыть пост в TG</span>
                          <span>→</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Interactive Messenger Composer (for Чат 9OF) */}
          {isChatMode && (
            <form
              onSubmit={handleSendMessage}
              className="px-4 sm:px-6 lg:px-8 py-3 border-t border-white/10 bg-[#0d0e14] shrink-0 space-y-2"
            >
              <div className="max-w-4xl mx-auto space-y-2">
                {/* Active Reply Indicator */}
                {replyingTo && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#0088cc]/15 border border-[#0088cc]/30 text-xs">
                    <div className="min-w-0 truncate">
                      <span className="text-[#38bdf8] font-semibold">
                        Ответ для {replyingTo.author || replyingTo.title} (#{replyingTo.id}):{' '}
                      </span>
                      <span className="text-zinc-300">{replyingTo.content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-zinc-400 hover:text-white px-1.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {sendNotice && (
                  <div className="text-xs text-[#38bdf8] font-medium px-1">{sendNotice}</div>
                )}

                {/* Quick Standard Emoji Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] text-zinc-500 mr-1 shrink-0">Эмодзи:</span>
                  {STANDARD_QUICK_EMOJIS.map((em, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChatText((prev) => prev + em)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-sm transition-transform active:scale-90 cursor-pointer shrink-0"
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Input Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={chatAuthor}
                    onChange={(e) => setChatAuthor(e.target.value)}
                    placeholder="Ваше имя"
                    maxLength={32}
                    className="sm:w-44 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#0088cc]"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Написать сообщение в чат 9OF (@chanel9of)..."
                      maxLength={500}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#0088cc]"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !chatText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 shadow-lg shadow-[#0088cc]/25"
                    >
                      {isSending ? 'Отправка...' : 'Отправить'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Lightbox for Full-screen Image / Sticker Preview */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
