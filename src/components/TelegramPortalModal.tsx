import React, { useState, useEffect } from 'react';

export interface TelegramPortalPost {
  id: string;
  title: string;
  content: string;
  rawHtml?: string;
  date: string;
  dateFormatted?: string;
  views?: string;
  images: string[];
  originalImages?: string[];
  coverImage?: string | null;
  pinned?: boolean;
  forwardedFrom?: string | null;
  url: string;
  channel: string;
}

export interface TelegramChannelMeta {
  title: string;
  username: string;
  description: string;
  subscribers: string;
  avatar: string;
  url: string;
}

interface TelegramPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramPortalModal: React.FC<TelegramPortalModalProps> = ({ isOpen, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<'ofmedi' | 'chanel9of'>('ofmedi');
  const [posts, setPosts] = useState<TelegramPortalPost[]>([]);
  const [channelMeta, setChannelMeta] = useState<TelegramChannelMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchChannelData = async (targetChannel: 'ofmedi' | 'chanel9of') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.github.io'));

      const apiBase = isLocal ? 'https://ofmedia.ru' : '';
      const endpoint = `${apiBase}/api/telegram-news?channel=${targetChannel}&limit=50`;

      let res = await fetch(endpoint);
      let data: any = null;

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        }
      }

      if (!data && isLocal) {
        // Fallback directly to production
        const prodRes = await fetch(`https://ofmedia.ru/api/telegram-news?channel=${targetChannel}&limit=50`);
        if (prodRes.ok) {
          data = await prodRes.json();
        }
      }

      if (data && data.ok && Array.isArray(data.posts)) {
        const resolvedPosts = data.posts.map((p: any) => ({
          ...p,
          coverImage: p.coverImage && p.coverImage.startsWith('/') ? `${apiBase}${p.coverImage}` : p.coverImage,
          images: Array.isArray(p.images)
            ? p.images.map((img: string) => (img.startsWith('/') ? `${apiBase}${img}` : img))
            : [],
        }));
        setPosts(resolvedPosts);
        if (data.channel) {
          setChannelMeta({
            ...data.channel,
            avatar:
              data.channel.avatar && data.channel.avatar.startsWith('/')
                ? `${apiBase}${data.channel.avatar}`
                : data.channel.avatar,
          });
        }
      } else {
        throw new Error(data?.error || 'Не удалось получить публикации');
      }
    } catch (err: any) {
      console.warn('Telegram portal fetch error:', err);
      setErrorMessage('Не удалось загрузить ленту Telegram. Проверьте интернет-соединение.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChannelData(activeChannel);
    }
  }, [isOpen, activeChannel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c0e] border border-white/15 rounded-3xl flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#121216]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-[#0088cc] shadow-[0_0_15px_rgba(0,136,204,0.3)]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-heading font-bold text-base sm:text-lg">
                  Telegram Портал OFMEDIA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 text-[10px] font-semibold">
                  Без VPN
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Прямой защищенный мост к каналу и чату через серверный API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Закрыть"
          >
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher: Канал (@ofmedi) vs Чат (@chanel9of) */}
        <div className="px-5 sm:px-6 py-3 border-b border-white/10 bg-[#0e0e12] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveChannel('ofmedi')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeChannel === 'ofmedi'
                  ? 'bg-[#0088cc] text-white shadow-[0_0_15px_rgba(0,136,204,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Канал (@ofmedi)
            </button>
            <button
              onClick={() => setActiveChannel('chanel9of')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeChannel === 'chanel9of'
                  ? 'bg-[#0088cc] text-white shadow-[0_0_15px_rgba(0,136,204,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Чат (@chanel9of)
            </button>
          </div>

          <button
            onClick={() => fetchChannelData(activeChannel)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            title="Обновить публикации"
          >
            <svg
              className={`w-3.5 h-3.5 fill-none stroke-current ${isLoading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Обновить</span>
          </button>
        </div>

        {/* Channel Info Banner */}
        {channelMeta && (
          <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-[#0088cc]/10 to-transparent border-b border-white/8 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              {channelMeta.avatar ? (
                <img
                  src={channelMeta.avatar}
                  alt={channelMeta.title}
                  className="w-11 h-11 rounded-2xl object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-[#0088cc]/30 border border-[#0088cc]/50 flex items-center justify-center text-white font-bold text-base shrink-0">
                  {channelMeta.title.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm truncate">
                    {channelMeta.title}
                  </h3>
                  <span className="text-zinc-500 text-xs">
                    @{channelMeta.username}
                  </span>
                </div>
                {channelMeta.description && (
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {channelMeta.description}
                  </p>
                )}
                {channelMeta.subscribers && (
                  <p className="text-[11px] text-[#0088cc] font-medium">
                    {channelMeta.subscribers} подписчиков
                  </p>
                )}
              </div>
            </div>

            <a
              href={`https://t.me/${channelMeta.username}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] hover:text-white border border-[#0088cc]/30 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>В Telegram</span>
              <span>→</span>
            </a>
          </div>
        )}

        {/* Content Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Загрузка публикаций Telegram без VPN...</span>
            </div>
          ) : errorMessage ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-sm text-red-400 font-medium">{errorMessage}</div>
              <button
                onClick={() => fetchChannelData(activeChannel)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all cursor-pointer"
              >
                Повторить попытку
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">
              Публикаций в этом разделе пока нет
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-[#141418] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg hover:border-white/20 transition-all"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 pb-1 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">
                      {post.channel}
                    </span>
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

                {/* Forwarded Header if present */}
                {post.forwardedFrom && (
                  <div className="text-xs text-[#0088cc] font-medium bg-[#0088cc]/10 border-l-2 border-[#0088cc] px-3 py-1.5 rounded-r-lg">
                    Переслано из: {post.forwardedFrom}
                  </div>
                )}

                {/* Post Text */}
                {post.content && (
                  <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line selection:bg-[#0088cc]/40">
                    {post.content}
                  </div>
                )}

                {/* Images / Album Gallery */}
                {post.images && post.images.length > 0 && (
                  <div
                    className={`grid gap-2 pt-2 ${
                      post.images.length === 1
                        ? 'grid-cols-1'
                        : post.images.length === 2
                        ? 'grid-cols-2'
                        : post.images.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-3'
                    }`}
                  >
                    {post.images.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer group aspect-video"
                      >
                        <img
                          src={imgUrl}
                          alt="Telegram media"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Footer */}
                <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    {post.views && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                    <span>Ссылка</span>
                    <span>→</span>
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Lightbox for Full-screen Image Preview */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[130] bg-black/95 flex items-center justify-center p-4 animate-in fade-in"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
