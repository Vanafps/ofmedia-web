import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

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
  user?: any;
  defaultUserName?: string | null;
  onOpenAuth?: () => void;
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
  'text-[#FF5C00]',
  'text-[#00E575]',
  'text-[#38BDF8]',
  'text-[#F59E0B]',
  'text-[#EC4899]',
  'text-[#A78BFA]',
  'text-[#10B981]',
  'text-[#F97316]',
];

const AVATAR_BG_COLORS = [
  'bg-[#FF5C00]/20 border-[#FF5C00]/40 text-[#FF5C00]',
  'bg-[#00E575]/20 border-[#00E575]/40 text-[#00E575]',
  'bg-sky-500/20 border-sky-500/40 text-sky-400',
  'bg-amber-500/20 border-amber-500/40 text-amber-400',
  'bg-pink-500/20 border-pink-500/40 text-pink-400',
  'bg-violet-500/20 border-violet-500/40 text-violet-400',
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
          className="text-[#FF5C00] hover:text-[#00E575] underline break-all transition-colors"
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
  user,
  defaultUserName: _defaultUserName,
  onOpenAuth,
}) => {
  const [activeChannel, setActiveChannel] = useState<'ofmedi' | 'chanel9of'>('ofmedi');
  const [posts, setPosts] = useState<TelegramPortalPost[]>([]);
  const [channelMeta, setChannelMeta] = useState<TelegramChannelMeta | null>(null);
  const [minScannedId, setMinScannedId] = useState<number>(13000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Telegram Account Linking state
  const [linkedTelegramUsername, setLinkedTelegramUsername] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ofmedia_tg_username') || null;
    }
    return null;
  });
  const [isCheckingLink, setIsCheckingLink] = useState<boolean>(false);
  const [manualTgInput, setManualTgInput] = useState<string>('');
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  // Chat composer state for 9OF (@chanel9of)
  const [chatText, setChatText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<TelegramPortalPost | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef<boolean>(true);

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

  // Helper to get persistent client identifier (either OFMEDIA user ID or persistent anonymous client ID)
  const getClientTelegramId = useCallback((): string => {
    if (user?.id) return String(user.id);
    if (user?.uid) return String(user.uid);
    if (typeof window !== 'undefined') {
      let localId = localStorage.getItem('ofmedia_tg_client_id');
      if (!localId) {
        localId = 'client_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('ofmedia_tg_client_id', localId);
      }
      return localId;
    }
    return 'client_default';
  }, [user]);

  // Check Telegram account linkage for current user or client ID
  useEffect(() => {
    const checkUserLink = async () => {
      const clientId = getClientTelegramId();
      if (!clientId) return;
      try {
        const apiBase = getApiHost() || 'https://ofmedia.ru';
        const res = await fetch(`${apiBase}/api/telegram-news?action=get_link&userId=${encodeURIComponent(clientId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.linked && data.data?.telegramUsername) {
            setLinkedTelegramUsername(data.data.telegramUsername);
            localStorage.setItem('ofmedia_tg_username', data.data.telegramUsername);
          }
        }
      } catch {}
    };

    checkUserLink();
  }, [user, getClientTelegramId]);

  const handleVerifyTelegramLink = async () => {
    const clientId = getClientTelegramId();
    setIsCheckingLink(true);
    setLinkNotice(null);
    try {
      const apiBase = getApiHost() || 'https://ofmedia.ru';
      const res = await fetch(`${apiBase}/api/telegram-news?action=get_link&userId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.linked && data.data?.telegramUsername) {
          setLinkedTelegramUsername(data.data.telegramUsername);
          localStorage.setItem('ofmedia_tg_username', data.data.telegramUsername);
          setLinkNotice(`Telegram успешно привязан: ${data.data.telegramUsername}`);
          setIsCheckingLink(false);
          return;
        }
      }
      setLinkNotice('Бот пока не получил команду /start. Нажмите «Открыть @ofmedia_apibot» и запустите бота в Telegram.');
    } catch {
      setLinkNotice('Не удалось связаться с сервером проверки.');
    } finally {
      setIsCheckingLink(false);
    }
  };

  const handleManualConfirmTg = async () => {
    const clientId = getClientTelegramId();
    const cleanHandle = manualTgInput.trim().replace(/^@/, '');
    if (!cleanHandle) return;
    setIsCheckingLink(true);
    try {
      const apiBase = getApiHost() || 'https://ofmedia.ru';
      const fullHandle = `@${cleanHandle}`;
      const res = await fetch(
        `${apiBase}/api/telegram-news?action=confirm_link&userId=${encodeURIComponent(clientId)}&username=${encodeURIComponent(fullHandle)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setLinkedTelegramUsername(fullHandle);
          localStorage.setItem('ofmedia_tg_username', fullHandle);
          setLinkNotice(`Telegram-юзернейм ${fullHandle} успешно подтверждён!`);
          setManualTgInput('');
        }
      }
    } catch {
      setLinkNotice('Ошибка подтверждения юзернейма');
    } finally {
      setIsCheckingLink(false);
    }
  };

  const handleUnlinkTelegram = () => {
    localStorage.removeItem('ofmedia_tg_username');
    setLinkedTelegramUsername(null);
    setLinkNotice('Привязка Telegram отключена на этом устройстве.');
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
        shouldScrollToBottomRef.current = true;
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

  // Classic chronological feed order for both Channel & Chat:
  // Oldest posts at top, newest posts at bottom (снизу новые, сверху старые)
  const displayedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [posts]);

  // Pinned post in active view
  const pinnedPost = useMemo(() => {
    return posts.find((p) => p.pinned) || null;
  }, [posts]);

  // Auto-scroll to bottom so user immediately sees the latest messages
  useEffect(() => {
    if (shouldScrollToBottomRef.current && !isLoading && displayedPosts.length > 0) {
      const el = chatScrollRef.current;
      if (el) {
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 80);
      }
      shouldScrollToBottomRef.current = false;
    }
  }, [displayedPosts, activeChannel, isLoading]);

  const scrollToMessageId = (targetId: string) => {
    const node = document.getElementById(`tg-msg-${targetId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.classList.add('ring-2', 'ring-[#FF5C00]');
      setTimeout(() => {
        node.classList.remove('ring-2', 'ring-[#FF5C00]');
      }, 1800);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || isSending) return;
    const clientId = getClientTelegramId();
    const authorUsername = linkedTelegramUsername;
    if (!authorUsername) {
      setSendNotice('Сначала привяжите ваш Telegram-аккаунт через @ofmedia_apibot');
      return;
    }

    setIsSending(true);
    setSendNotice(null);
    try {
      const apiBase = getApiHost() || 'https://ofmedia.ru';
      const res = await fetch(`${apiBase}/api/telegram-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          channel: 'chanel9of',
          userId: clientId,
          author: authorUsername,
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
        setPosts((prev) => [...prev, normalized]);
        setSendNotice('Сообщение отправлено в чат 9OF');
        setTimeout(() => setSendNotice(null), 3000);
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
    <div className="min-h-screen h-screen w-full bg-[#070709] text-zinc-100 flex flex-col overflow-hidden select-text font-sans">
      {/* Top Full-Page Navigation Header */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#0B0B10]/95 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back to Home Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline font-heading">На главную OFMEDIA</span>
            <span className="sm:hidden font-heading">Назад</span>
          </button>

          {/* Portal Title & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 flex items-center justify-center text-[#FF5C00] shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-sm sm:text-base text-white truncate">
                  OFMEDIA Telegram
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#00E575]/15 text-[#00E575] border border-[#00E575]/25 text-[10px] font-semibold shrink-0">
                  Без VPN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden md:block truncate">
                {isChatMode
                  ? 'Чат сообщества 9OF (@chanel9of) с проверенной отправкой'
                  : 'Официальный канал @ofmedi с полной историей до поста #1'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions: Sync, Open in TG & Profile/Login */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isLoading && posts.length > 0 && (
            <span className="hidden xl:inline-block text-xs text-zinc-400 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
              {isChatMode ? `${posts.length} сообщ.` : `${posts.length} публ.`}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchChannelData(activeChannel, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
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
            <span className="hidden sm:inline font-heading">Обновить</span>
          </button>

          <a
            href={`https://t.me/${isChatMode ? 'chanel9of' : 'ofmedi'}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#FF5C00]/20 text-zinc-200 hover:text-[#FF5C00] border border-white/10 hover:border-[#FF5C00]/40 text-xs font-semibold transition-all"
          >
            <span className="font-heading">В Telegram</span>
            <span>→</span>
          </a>

          {/* User Profile Avatar or SVG Login Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName || user.username || 'Пользователь'}
                  className="w-8 h-8 rounded-full object-cover border border-[#FF5C00]/50 ring-2 ring-[#FF5C00]/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5C00] to-[#00E575] flex items-center justify-center text-white font-bold text-xs">
                  {(user.displayName || user.username || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left min-w-0 max-w-[130px]">
                <div className="text-xs font-semibold text-white truncate">
                  {user.displayName || user.username}
                </div>
                {linkedTelegramUsername ? (
                  <div className="text-[10px] text-[#00E575] truncate">
                    {linkedTelegramUsername}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-400 truncate">
                    OFMEDIA ID
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF7700] hover:brightness-110 text-white font-semibold text-xs shadow-md shadow-[#FF5C00]/20 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
              </svg>
              <span className="font-heading">Войти</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Full-Page Workspace */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar (Desktop Navigation & Metadata Directory) */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-r border-white/10 bg-[#0B0B10] flex-col justify-between p-5 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1 font-heading">
                Разделы Telegram
              </div>
              <div className="space-y-2.5">
                {/* Tab 1: Канал OFMEDIA */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('ofmedi')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    !isChatMode
                      ? 'bg-[#FF5C00]/10 border-[#FF5C00]/50 shadow-[0_0_24px_rgba(255,92,0,0.12)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <img
                    src="/logos/ofmediawhite_clean.png"
                    alt="Канал OFMEDIA"
                    className="w-11 h-11 rounded-2xl object-contain bg-black/40 p-1 border border-white/15 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-sm text-white truncate">
                        Канал OFMEDIA
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                        @ofmedi
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      Официальные анонсы, премьеры и архив постов
                    </p>
                  </div>
                </button>

                {/* Tab 2: Чат 9OF */}
                <button
                  type="button"
                  onClick={() => setActiveChannel('chanel9of')}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isChatMode
                      ? 'bg-[#00E575]/10 border-[#00E575]/50 shadow-[0_0_24px_rgba(0,229,117,0.12)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <img
                    src="/api/telegram-image?file_id=AQADAgADJx9rG1E4WEkACAMAA0tBeJgW____5Px31TM9C0k9BA"
                    alt="Чат 9OF"
                    className="w-11 h-11 rounded-2xl object-cover bg-black/40 border border-white/15 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logos/ofmediawhite_clean.png';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-bold text-sm text-white truncate">
                        Чат 9OF
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                        @chanel9of
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
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-base shrink-0">
                      {channelMeta.title.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-white text-base truncate">
                      {channelMeta.title}
                    </h2>
                    <div className="text-xs text-zinc-400">@{channelMeta.username}</div>
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
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/5 text-[11px] text-zinc-500 space-y-1">
            <div>Прямой серверный прокси-мост OFMEDIA</div>
            <div>Работает в РФ на всех устройствах без VPN</div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col bg-[#070709] min-w-0 relative">
          {/* Mobile Tab Switcher (Visible only on small viewports where sidebar is hidden) */}
          <div className="lg:hidden flex items-center p-2.5 bg-[#0B0B10] border-b border-white/10 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveChannel('ofmedi')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-bold transition-all text-center ${
                !isChatMode
                  ? 'bg-[#FF5C00] text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Канал OFMEDIA
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel('chanel9of')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-heading font-bold transition-all text-center ${
                isChatMode
                  ? 'bg-[#00E575] text-black shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Чат 9OF
            </button>
          </div>

          {/* Pinned Message Banner at the top of Feed */}
          {pinnedPost && (
            <div
              onClick={() => scrollToMessageId(pinnedPost.id)}
              className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#FF5C00]/15 via-white/[0.04] to-transparent border-b border-[#FF5C00]/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FF5C00]/20 transition-all shrink-0 z-10"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#FF5C00] shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-[#FF5C00] uppercase tracking-wide shrink-0 font-heading">
                  Закрепленное сообщение #{pinnedPost.id}
                </span>
                <span className="text-xs text-zinc-300 truncate">
                  {pinnedPost.content || pinnedPost.title || 'Медиаматериал'}
                </span>
              </div>
              <span className="text-xs text-zinc-400 hover:text-white transition-colors shrink-0">
                Перейти →
              </span>
            </div>
          )}

          {/* Scrollable Feed Area (Classic Chronological: Oldest at Top, Newest at Bottom) */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4"
          >
            {isLoading ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center gap-3 text-zinc-400">
                <div className="w-9 h-9 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-sm">
                  {isChatMode
                    ? 'Синхронизация сообщений, стикеров и участников чата 9OF...'
                    : 'Загрузка архива публикаций канала OFMEDIA (@ofmedi)...'}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="py-20 text-center space-y-3">
                <div className="text-sm text-red-400 font-medium">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => fetchChannelData(activeChannel, true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all cursor-pointer font-heading font-semibold"
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
                      className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 font-heading font-semibold"
                    >
                      {isLoadingOlderChat ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#00E575] border-t-transparent rounded-full animate-spin" />
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
                            : 'bg-[#121218] border-white/10 hover:border-white/20 shadow-md'
                        }`}
                      >
                        {/* Sender Name + Username + Reply Action */}
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`font-bold text-xs sm:text-[13px] truncate ${colorClass}`}>
                              {senderName}
                            </span>
                            {post.authorUsername && post.authorUsername !== '@chanel9of' && (
                              <span className="text-[11px] text-zinc-500 truncate">
                                {post.authorUsername}
                              </span>
                            )}
                            {post.pinned && (
                              <span className="px-1.5 py-0.5 rounded bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-semibold">
                                Закреплено
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setReplyingTo(post)}
                            className="opacity-70 group-hover:opacity-100 text-[11px] text-zinc-400 hover:text-[#00E575] transition-opacity cursor-pointer shrink-0 font-heading"
                            title="Ответить на это сообщение"
                          >
                            Ответить
                          </button>
                        </div>

                        {/* Replied Message Quote Block */}
                        {post.replyTo && (
                          <div
                            onClick={() => scrollToMessageId(post.replyTo!.id)}
                            className="mb-2 pl-2.5 pr-3 py-1.5 rounded-lg bg-white/[0.04] border-l-2 border-[#FF5C00] cursor-pointer hover:bg-white/[0.07] transition-colors flex items-center gap-2.5"
                          >
                            {post.replyTo.thumb && (
                              <SmartTelegramImage
                                src={post.replyTo.thumb}
                                alt="Reply preview"
                                className="w-8 h-8 rounded object-contain bg-black/20 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-[#FF5C00] truncate">
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
                          <div className="mb-1.5 text-xs text-[#00E575] font-medium">
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
                                className="rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer group/img relative"
                              >
                                <SmartTelegramImage
                                  src={imgUrl}
                                  originalSrc={post.originalImages?.[idx]}
                                  alt={`Фото #${idx + 1}`}
                                  className="w-full max-h-80 object-cover group-hover/img:scale-[1.02] transition-transform"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text Message Content */}
                        {showTextContent && (
                          <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                            {renderTextWithLinks(post.content)}
                          </div>
                        )}

                        {/* Message Metadata & Direct TG Link */}
                        <div className="flex items-center justify-end gap-2 mt-1.5 text-[10px] text-zinc-500">
                          <span>{post.dateFormatted || post.date}</span>
                          <span>•</span>
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
                 CHANNEL OFMEDIA (@ofmedi) — CLASSIC CHRONOLOGICAL FEED
                 ========================================================= */
              <div className="max-w-3xl mx-auto space-y-4 pb-4">
                {displayedPosts.map((post) => {
                  const authorLabel = post.author || 'OFMEDIA';

                  return (
                    <article
                      key={post.id}
                      id={`tg-msg-${post.id}`}
                      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                        post.pinned
                          ? 'bg-[#141214] border-[#FF5C00]/40 shadow-[0_0_24px_rgba(255,92,0,0.08)]'
                          : 'bg-[#101015] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Author Header Row */}
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-heading font-bold text-sm text-white truncate">
                            {authorLabel}
                          </span>
                          {post.authorUsername && (
                            <span className="text-xs text-zinc-400 truncate">
                              {post.authorUsername}
                            </span>
                          )}
                          {post.pinned && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] text-[10px] font-semibold">
                              Закреплено
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-zinc-500 shrink-0">
                          {post.dateFormatted || post.date}
                        </span>
                      </div>

                      {/* Photo / Sticker media */}
                      {post.isSticker && post.stickerUrl ? (
                        <div className="py-2">
                          <SmartTelegramImage
                            src={post.stickerUrl}
                            originalSrc={post.originalImages?.[0]}
                            alt="Стикер"
                            onClick={() => setSelectedImage(post.stickerUrl!)}
                            className="w-32 h-32 object-contain cursor-pointer"
                          />
                        </div>
                      ) : post.images && post.images.length > 0 ? (
                        <div
                          className={`grid gap-2 my-2.5 ${
                            post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}
                        >
                          {post.images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedImage(imgUrl)}
                              className="rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer relative"
                            >
                              <SmartTelegramImage
                                src={imgUrl}
                                originalSrc={post.originalImages?.[idx]}
                                alt={`Фото #${idx + 1}`}
                                className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Post Text */}
                      {post.content && !(post.isSticker && post.content === 'Стикер') && (
                        <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed break-words whitespace-pre-wrap">
                          {renderTextWithLinks(post.content)}
                        </div>
                      )}

                      {/* Footer: Views & Link */}
                      <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-white/5 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-3">
                          <span>#{post.id}</span>
                          {post.views && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>{post.views}</span>
                            </span>
                          )}
                        </div>

                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF5C00] hover:text-[#00E575] transition-colors font-heading font-semibold"
                        >
                          Открыть пост в TG →
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* =========================================================
             BOTTOM CHAT COMPOSER — AVAILABLE ONLY FOR AUTHENTICATED USERS
             ========================================================= */}
          {isChatMode && (
            <div className="border-t border-white/10 bg-[#0B0B10]/95 backdrop-blur-xl p-3 sm:p-4 shrink-0">
              <div className="max-w-4xl mx-auto space-y-2.5">
                {/* Notice message */}
                {(sendNotice || linkNotice) && (
                  <div className="text-xs text-center py-1 px-3 rounded-lg bg-white/5 border border-white/10 text-[#00E575]">
                    {sendNotice || linkNotice}
                  </div>
                )}

                {!linkedTelegramUsername ? (
                  /* Case: Telegram NOT linked yet — available to both visitors and registered users */
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-[#FF5C00]/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                          <span className="text-[#FF5C00]">●</span>
                          <span>Привязка Telegram для отправки сообщений</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Чтобы исключить спам, сообщения в чат 9OF отправляются от вашего проверенного Telegram-юзернейма
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://t.me/ofmedia_apibot?start=link_${getClientTelegramId()}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#00E575] hover:bg-[#00C853] text-black font-heading font-bold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                          </svg>
                          <span>Открыть @ofmedia_apibot</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleVerifyTelegramLink}
                          disabled={isCheckingLink}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-semibold text-xs border border-white/10 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isCheckingLink ? 'Проверка...' : 'Проверить привязку'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <input
                        type="text"
                        value={manualTgInput}
                        onChange={(e) => setManualTgInput(e.target.value)}
                        placeholder="Или укажите ваш @username вручную..."
                        className="flex-1 bg-[#121218] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5C00]"
                      />
                      <button
                        type="button"
                        onClick={handleManualConfirmTg}
                        disabled={!manualTgInput.trim() || isCheckingLink}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-heading font-semibold disabled:opacity-40 transition-all cursor-pointer"
                      >
                        Подтвердить
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Case: Telegram Linked — Full Composer Unlocked */
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    {/* Active verified sender badge & Reply preview */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2.5 py-1 rounded-lg bg-[#00E575]/15 border border-[#00E575]/30 text-[#00E575] font-semibold text-[11px] flex items-center gap-1.5 shrink-0">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                          </svg>
                          <span>От имени {linkedTelegramUsername}</span>
                          <button
                            type="button"
                            onClick={handleUnlinkTelegram}
                            className="text-zinc-400 hover:text-red-400 text-[10px] underline ml-1 cursor-pointer transition-colors"
                            title="Отвязать или сменить Telegram-аккаунт"
                          >
                            сменить
                          </button>
                        </span>

                        {replyingTo && (
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 truncate">
                            <span className="text-[11px] text-[#FF5C00] font-semibold shrink-0">
                              Ответ на #{replyingTo.id}:
                            </span>
                            <span className="truncate text-[11px]">
                              {replyingTo.author}: {replyingTo.content || 'Медиа'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReplyingTo(null)}
                              className="text-zinc-400 hover:text-white shrink-0 ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quick Emojis Bar */}
                      <div className="hidden sm:flex items-center gap-1">
                        {STANDARD_QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setChatText((prev) => prev + emoji)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-sm transition-all cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Composer Input & Send Button */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="Написать сообщение в чат 9OF (@chanel9of)..."
                        maxLength={500}
                        className="flex-1 bg-[#121218] border border-white/10 focus:border-[#FF5C00] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!chatText.trim() || isSending}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5C00] to-[#00E575] hover:brightness-110 disabled:opacity-40 text-black font-heading font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
                      >
                        {isSending ? '...' : 'Отправить'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lightbox Dialog for Telegram Images */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
