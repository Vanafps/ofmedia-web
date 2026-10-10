import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '../services/firebase';
import {
  subscribeToNewsFromFirebase,
  syncNewsToFirebase,
  fetchNewsFromFirebase,
  saveHiddenTelegramPostToFirebase,
  subscribeToHiddenTelegramPosts,
} from '../services/firebase';

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  tag: string;
  coverImage?: string;
  pinned?: boolean;
  views?: string;
  url?: string;
  source?: 'telegram' | 'manual';
  images?: string[];
}

interface TelegramChannelInfo {
  title: string;
  username: string;
  description: string;
  subscribers: string;
  avatar: string;
  url: string;
}

const ADMIN_UID = 'vk_759530692';

const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news_v1_3_0',
    title: 'v1.3.0 • Масштабное обновление Web и Android, портал Telegram и ускорение HLS',
    content: `Представляем крупное обновление платформы OFMEDIA v1.3.0 для Web и Android!

**Главные изменения:**
* **Встроенный портал Telegram без VPN**: прямой доступ к официальному каналу @ofmedi и чату @chanel9of на сайте и в приложении с поддержкой всех фотоальбомов
* **Ускоренная HLS-буферизация**: мгновенный старт воспроизведения (1.5 с), визуальная шкала буферизации в плеере и кэширование HLS-сегментов для просмотра офлайн на ПК и Android
* **Единый Glassmorphism-дизайн**: синхронизация матового стекла (blur), плавающей навигации и типографики между веб-версией и Android-приложением
* **Авторизация и проверка обновлений**: исправлен вход через VK ID и Email, добавлена реальная проверка свежих сборок APK
* **Расширенный архив публикаций**: снят лимит в 20 постов Telegram за счет многостраничной подгрузки ленты

[cut]

> Мы непрерывно улучшаем экосистему OFMEDIA, обеспечивая стабильную работу сервиса, быструю загрузку контента на территории РФ и удобство использования на всех устройствах.

Скачивайте официальное приложение v1.3.0 на странице /app или продолжайте просмотр на веб-платформе!`,
    date: '10 октября 2026',
    author: 'OFMEDIA Official',
    tag: 'Обновление v1.3.0',
    pinned: true,
    source: 'manual',
  },
  {
    id: 'news_v1_2_5',
    title: 'v1.2.5 • Масштабное обновление плеера, фотоальбомов и дизайна',
    content: `Представляем масштабное обновление стриминговой платформы OFMEDIA v1.2.5 для Web и Android!

**Главные изменения:**
* **Оптически выверенный плеер**: выравнивание контролов воспроизведения по центру экрана на смартфонах и ПК, мгновенная пауза по клику
* **Полноценные фотоальбомы Telegram**: просмотр всех кадров медиагрупп, плавный жест масштабирования и панорамирование
* **Премиальный матовый дизайн**: эффект Glassmorphism (матовое стекло) в навигации мобильного приложения и веб-интерфейса
* **Официальная авторизация VK ID**: вход через официальный SDK
* **Релиз APK v1.2.5**: обновленный установочный пакет готов к загрузке

[cut]

> Мы непрерывно улучшаем экосистему OFMEDIA, обеспечивая стабильную работу сервиса, быструю загрузку контента на территории РФ и удобство использования на всех устройствах.

Скачивайте официальное приложение или продолжайте просмотр на веб-платформе!`,
    date: '4 октября 2026',
    author: 'OFMEDIA Official',
    tag: 'Обновление v1.2.5',
    pinned: false,
    source: 'manual',
  },
  {
    id: 'news_v1_2_1',
    title: 'v1.2.1 • Обновление новостей',
    content: `Представляем масштабное обновление раздела «Новости» и релиз мобильного приложения OFMEDIA v1.2.1 в RuStore!

**Главные изменения:**
* **Интеграция Telegram @ofmedi**: прямая трансляция публикаций из официального канала без необходимости использования VPN
* **Поддержка медиаальбомов**: интерактивная фотогалерея и полноэкранный просмотр изображений высокого разрешения
* **Сквозная синхронизация**: моментальное обновление и управление публикациями на всех зеркалах через Firebase Realtime Database
* **Умный фильтр ленты**: автоматическое исключение удаленных постов Telegram и синхронное скрытие публикаций
* **Мобильный клиент v1.2.1**: обновленная сборка для Android с оптимизацией кэширования и поддержкой жестов доступна в RuStore

[cut]

> Мы непрерывно улучшаем экосистему OFMEDIA, обеспечивая стабильную работу сервиса, быструю загрузку контента на территории РФ и удобство использования на всех устройствах.

Скачивайте официальное приложение в RuStore или продолжайте просмотр на веб-платформе!`,
    date: '4 октября 2026',
    author: 'OFMEDIA Official',
    tag: 'Обновление v1.2.1',
    pinned: false,
    source: 'manual',
  },
  {
    id: 'news_v1_2_0',
    title: 'v1.2.0 • Кинематографичный плеер и мобильная версия',
    content: `Релиз стриминговой платформы OFMEDIA версии v1.2.0 с обновленным ядром воспроизведения и официальным дебютом в RuStore!

**Ключевые нововведения:**
* Новый адаптивный видеоплеер с оптически выверенными контролами
* Мягкий градиент перемотки на 10 секунд и мгновенная пауза по одинарному клику
* Поддержка жестов пролистывания и полноэкранный режим с автоматической ориентацией
* Публикация первого официального APK-релиза в каталоге RuStore

[cut]

> Наслаждайтесь просмотром любимых фильмов и сериалов в высоком разрешении на любых диагоналях экранов.`,
    date: '21 сентября 2026',
    author: 'OFMEDIA Official',
    tag: 'Обновление v1.2.0',
    pinned: false,
    source: 'manual',
  },
  {
    id: 'news_premiere',
    title: 'Эксклюзивные релизы и оригинальные проекты осени',
    content: `В каталоге OFMEDIA доступны новые оригинальные проекты в сверхвысоком разрешении 4K Ultra HD. Все релизы сопровождаются студийным дубляжом и расширенными материалами со съемочной площадки.\n\nПереходите в раздел «Главная» или выбирайте интересующий жанр через каталог!`,
    date: '20 сентября 2026',
    author: 'Редакция OFMEDIA',
    tag: 'Премьеры',
    source: 'manual',
  },
];

interface OfmediaNewsSectionProps {
  user: UserProfile | null;
}

export const OfmediaNewsSection: React.FC<OfmediaNewsSectionProps> = ({ user }) => {
  const [manualNews, setManualNews] = useState<NewsPost[]>(() => {
    try {
      const saved = localStorage.getItem('ofmedia_news');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_NEWS;
  });

  const [telegramPosts, setTelegramPosts] = useState<NewsPost[]>([]);
  const [channelInfo, setChannelInfo] = useState<TelegramChannelInfo | null>(null);
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'telegram' | 'announcements'>('all');

  const [hiddenTgPosts, setHiddenTgPosts] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [expandedNews, setExpandedNews] = useState<Record<string, boolean>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Editor Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTag, setFormTag] = useState('Обновление v1.3.0');
  const [formCover, setFormCover] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isAdmin = user?.uid === ADMIN_UID;

  // Realtime Firebase DB Sync & Listener
  useEffect(() => {
    // 1. Initial direct fetch from Firebase REST API for immediate hydration
    fetchNewsFromFirebase().then((remoteNews) => {
      if (remoteNews && Array.isArray(remoteNews) && remoteNews.length > 0) {
        setManualNews(remoteNews);
        try {
          localStorage.setItem('ofmedia_news', JSON.stringify(remoteNews));
        } catch {}
      }
    });

    // 2. Realtime listener for cross-tab and cross-device updates
    const unsubNews = subscribeToNewsFromFirebase((remoteNews) => {
      if (remoteNews && Array.isArray(remoteNews) && remoteNews.length > 0) {
        setManualNews(remoteNews);
        try {
          localStorage.setItem('ofmedia_news', JSON.stringify(remoteNews));
        } catch {}
      }
    });

    const unsubHidden = subscribeToHiddenTelegramPosts((hiddenMap) => {
      setHiddenTgPosts(hiddenMap || {});
    });

    return () => {
      unsubNews();
      unsubHidden();
    };
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const fetchTelegramNews = async () => {
    setIsLoadingTelegram(true);
    setTelegramError(null);
    try {
      const isDirectVercelDomain =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'ofmedia.ru' ||
          window.location.hostname === 'www.ofmedia.ru');

      const apiBase = isDirectVercelDomain ? '' : 'https://ofmedia.ru';
      const imageHostBase = 'https://ofmedia.ru';

      let data: any = null;
      try {
        const res = await fetch(`${apiBase}/api/telegram-news?channel=ofmedi`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        }
      } catch {}

      if (!data) {
        try {
          const fallbackRes = await fetch('https://ofmedia.ru/api/telegram-news?channel=ofmedi');
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
          }
        } catch {}
      }

      if (!data) {
        try {
          const rtdbRes = await fetch(
            'https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app/telegram_news_v5.json'
          );
          if (rtdbRes.ok) {
            const rtdbJson = await rtdbRes.json();
            if (rtdbJson && Array.isArray(rtdbJson.posts)) {
              data = { ok: true, posts: rtdbJson.posts, channel: rtdbJson.channel };
            }
          }
        } catch {}
      }

      if (data && data.ok && Array.isArray(data.posts)) {
        const mapped: NewsPost[] = data.posts.map((p: any) => {
          const rawCover = p.coverImage || '';
          const resolvedCover = rawCover
            ? rawCover.startsWith('/')
              ? `${imageHostBase}${rawCover}`
              : rawCover
            : undefined;

          const mappedImages = Array.isArray(p.images)
            ? p.images.map((img: string) => (img.startsWith('/') ? `${imageHostBase}${img}` : img))
            : [];

          const cleanTitle = (p.title || '').trim();
          const cleanContent = (p.content || '').trim();

          return {
            id: `tg_${p.id}`,
            title: cleanTitle || `Публикация #${p.id}`,
            content: cleanContent,
            date: p.dateFormatted || p.date || '',
            author: '@ofmedi',
            tag: 'Telegram',
            coverImage: resolvedCover,
            images: mappedImages,
            pinned: !!p.pinned,
            views: p.views || '',
            url: p.url || `https://t.me/ofmedi/${p.id}`,
            source: 'telegram' as const,
          };
        });

        setTelegramPosts(mapped);

        if (data.channel) {
          setChannelInfo({
            ...data.channel,
            avatar:
              data.channel.avatar && data.channel.avatar.startsWith('/')
                ? `${imageHostBase}${data.channel.avatar}`
                : data.channel.avatar,
          });
        }
      } else {
        throw new Error(data.error || 'Ошибка формата постов');
      }
    } catch (err: any) {
      console.warn('Failed to load telegram posts:', err);
      setTelegramError('Не удалось загрузить публикации Telegram');
    } finally {
      setIsLoadingTelegram(false);
    }
  };

  useEffect(() => {
    fetchTelegramNews();
  }, []);

  const visibleTelegramPosts = useMemo(() => {
    return telegramPosts.filter((p) => {
      const cleanId = p.id.replace(/^tg_/, '');
      return !hiddenTgPosts[cleanId];
    });
  }, [telegramPosts, hiddenTgPosts]);

  const combinedPosts = useMemo(() => {
    if (activeFilter === 'telegram') return visibleTelegramPosts;
    if (activeFilter === 'announcements') return manualNews;
    const list = [
      ...manualNews.map((n) => ({ ...n, source: 'manual' as const })),
      ...visibleTelegramPosts,
    ];
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [activeFilter, manualNews, visibleTelegramPosts]);

  const toggleExpand = (id: string) => {
    setExpandedNews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormTitle('');
    setFormContent('');
    setFormTag('Обновление v1.3.0');
    setFormCover('');
    setFormPinned(false);
    setShowPreview(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: NewsPost) => {
    setEditingPostId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormTag(post.tag);
    setFormCover(post.coverImage || '');
    setFormPinned(!!post.pinned);
    setShowPreview(false);
    setIsEditorOpen(true);
  };

  const handleDeletePost = (post: NewsPost) => {
    if (!isAdmin) return;
    const isTg = post.source === 'telegram' || post.tag === 'Telegram';
    const confirmMsg = isTg
      ? 'Скрыть эту публикацию Telegram из ленты для всех пользователей?'
      : 'Удалить эту новость?';

    if (window.confirm(confirmMsg)) {
      if (isTg) {
        const cleanId = post.id.replace(/^tg_/, '');
        saveHiddenTelegramPostToFirebase(cleanId);
        setHiddenTgPosts((prev) => ({ ...prev, [cleanId]: true }));
      } else {
        const updated = manualNews.filter((n) => n.id !== post.id);
        setManualNews(updated);
        syncNewsToFirebase(updated);
        try {
          localStorage.setItem('ofmedia_news', JSON.stringify(updated));
        } catch {}
      }
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('news-content-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formContent;
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected || 'текст'}${suffix}`;
    const next = current.substring(0, start) + replacement + current.substring(end);
    setFormContent(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
    }, 50);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !formTitle.trim() || !formContent.trim()) return;

    const now = new Date();
    const dateStr = `${now.getDate()} ${['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][now.getMonth()]} ${now.getFullYear()}`;
    const cleanCover = formCover.trim();

    let nextNews: NewsPost[];
    if (editingPostId) {
      nextNews = manualNews.map((n) => {
        if (n.id !== editingPostId) return n;
        const updated: NewsPost = {
          ...n,
          title: formTitle.trim(),
          content: formContent.trim(),
          tag: formTag.trim(),
          pinned: formPinned,
        };
        if (cleanCover) {
          updated.coverImage = cleanCover;
        } else {
          delete updated.coverImage;
        }
        return updated;
      });
    } else {
      const newPost: NewsPost = {
        id: `news_${Date.now()}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        date: dateStr,
        author: user?.displayName || 'Администратор',
        tag: formTag.trim(),
        pinned: formPinned,
        source: 'manual',
        ...(cleanCover ? { coverImage: cleanCover } : {}),
      };
      nextNews = [newPost, ...manualNews];
    }

    setManualNews(nextNews);
    syncNewsToFirebase(nextNews);
    try {
      localStorage.setItem('ofmedia_news', JSON.stringify(nextNews));
    } catch {}

    setIsEditorOpen(false);
  };

  const renderPostMedia = (post: NewsPost) => {
    const images =
      post.images && post.images.length > 0
        ? post.images
        : post.coverImage
        ? [post.coverImage]
        : [];

    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div
          onClick={() => setLightbox({ images, index: 0 })}
          className="rounded-2xl overflow-hidden aspect-video w-full bg-zinc-900 border border-white/10 cursor-pointer group relative"
        >
          <img
            src={images[0]}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/15">
              Открыть фото
            </span>
          </div>
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 p-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setLightbox({ images, index: idx })}
              className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group bg-zinc-800"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-2 aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 p-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setLightbox({ images, index: idx })}
              className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group bg-zinc-800"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    // 4 or more photos (album)
    const displayPhotos = images.slice(0, 4);
    const remainingCount = images.length - 4;

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 p-1">
        {displayPhotos.map((img, idx) => {
          const isLast = idx === 3 && remainingCount > 0;
          return (
            <div
              key={idx}
              onClick={() => setLightbox({ images, index: idx })}
              className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group bg-zinc-800"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
              />
              {isLast ? (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                  <span className="font-heading font-bold text-base sm:text-lg">+{remainingCount + 1}</span>
                  <span className="text-[10px] text-zinc-300 uppercase font-semibold">фото</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFormattedText = (raw: string, isExpanded: boolean, id: string) => {
    let textToRender = raw;
    const hasCut = raw.includes('[cut]');
    if (hasCut && !isExpanded) {
      textToRender = raw.split('[cut]')[0].trim();
    } else if (hasCut) {
      textToRender = raw.replace('[cut]', '\n\n');
    }

    const lines = textToRender.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Blockquote
          if (trimmed.startsWith('>')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-[#ff5c00] pl-3 py-1 my-1 bg-white/[0.03] rounded-r-xl text-zinc-300 italic"
              >
                {trimmed.replace(/^>\s*/, '')}
              </blockquote>
            );
          }

          // Image: ![alt](url)
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imgMatch) {
            return (
              <div key={idx} className="my-2 rounded-2xl overflow-hidden border border-white/10 max-h-80 aspect-video">
                <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-full object-cover" />
              </div>
            );
          }

          // Standard paragraph with inline formatting
          const parts = trimmed.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
          return (
            <p key={idx}>
              {parts.map((p, pIdx) => {
                if (p.startsWith('**') && p.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-white">
                      {p.slice(2, -2)}
                    </strong>
                  );
                }
                if (p.startsWith('*') && p.endsWith('*')) {
                  return (
                    <em key={pIdx} className="italic text-zinc-200">
                      {p.slice(1, -1)}
                    </em>
                  );
                }
                const linkMatch = p.match(/^\[(.*?)\]\((.*?)\)$/);
                if (linkMatch) {
                  return (
                    <a
                      key={pIdx}
                      href={linkMatch[2]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ff5c00] hover:underline underline-offset-2 font-medium"
                    >
                      {linkMatch[1]}
                    </a>
                  );
                }
                return p;
              })}
            </p>
          );
        })}

        {hasCut && (
          <button
            type="button"
            onClick={() => toggleExpand(id)}
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#ff5c00] hover:text-[#ff7a1a] transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Свернуть' : 'Читать полностью'}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <section id="ofnews-section" className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 select-none">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ff5c00]/20 text-[#ff5c00] border border-[#ff5c00]/30">
              OFNEWS
            </span>
            <span className="text-xs text-zinc-400 font-normal">Новости платформы и прямой эфир @ofmedi</span>
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-wide">
            Новости и обновления
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTelegramNews}
            disabled={isLoadingTelegram}
            className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Обновить ленту постов"
          >
            <svg
              className={`w-4 h-4 text-zinc-300 ${isLoadingTelegram ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoadingTelegram ? 'Загрузка...' : 'Обновить'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-103 active:scale-95 shadow-lg shadow-[#ff5c00]/25 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Опубликовать</span>
            </button>
          )}
        </div>
      </div>

      {/* Telegram Channel Feature Card */}
      <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#229ED9]/15 via-black/40 to-white/[0.02] border border-[#229ED9]/30 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#229ED9] flex items-center justify-center shrink-0 shadow-lg shadow-[#229ED9]/30">
              {channelInfo?.avatar ? (
                <img
                  src={channelInfo.avatar}
                  alt="OFMEDIA"
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-white">
                  Официальный Telegram-канал @ofmedi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/40">
                  Без VPN
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl">
                {channelInfo?.description || 'Прямые публикации, новости киноиндустрии, анонсы новых серий и эксклюзивные материалы.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {channelInfo?.subscribers && (
              <span className="text-xs font-semibold text-zinc-400 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                {channelInfo.subscribers} подписчиков
              </span>
            )}
            <a
              href="https://t.me/ofmedi"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white text-xs font-bold transition-all shadow-lg shadow-[#229ED9]/30 flex items-center gap-2"
            >
              <span>Подписаться на @ofmedi</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {telegramError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center justify-between">
          <span>{telegramError}</span>
          <button
            type="button"
            onClick={fetchTelegramNews}
            className="text-white underline hover:no-underline font-semibold cursor-pointer"
          >
            Повторить попытку
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-white text-black font-bold'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
          }`}
        >
          Все публикации ({combinedPosts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('telegram')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'telegram'
              ? 'bg-[#229ED9] text-white font-bold'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
          }`}
        >
          <span>Из Telegram @ofmedi</span>
          <span className="text-[10px] opacity-75">({visibleTelegramPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('announcements')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'announcements'
              ? 'bg-[#ff5c00] text-white font-bold'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
          }`}
        >
          <span>Релизы платформы</span>
          <span className="text-[10px] opacity-75">({manualNews.length})</span>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {combinedPosts.map((post) => {
          const isExpanded = !!expandedNews[post.id];
          const isTelegram = post.source === 'telegram' || post.tag === 'Telegram';

          return (
            <article
              key={post.id}
              className={`relative rounded-3xl glass-card p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                post.pinned
                  ? 'border-[#ff5c00]/40 shadow-[0_8px_30px_rgba(255,92,0,0.08)]'
                  : isTelegram
                  ? 'border-[#229ED9]/25 hover:border-[#229ED9]/50'
                  : 'border-white/10'
              }`}
            >
              <div className="space-y-3">
                {/* Meta Top Bar */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${
                        isTelegram
                          ? 'bg-[#229ED9]/15 text-[#229ED9] border-[#229ED9]/30'
                          : 'bg-white/10 text-zinc-300 border-white/10'
                      }`}
                    >
                      {isTelegram ? 'Telegram @ofmedi' : post.tag}
                    </span>

                    {post.pinned && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#ff5c00]/20 text-[#ff5c00] border border-[#ff5c00]/30">
                        Закреплено
                      </span>
                    )}

                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{post.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {post.views && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{post.views}</span>
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        {post.source === 'manual' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(post)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Редактировать новость"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title={isTelegram ? 'Скрыть публикацию Telegram' : 'Удалить новость'}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media (Album grid or single cover with Lightbox support) */}
                {renderPostMedia(post)}

                {/* Title */}
                <h3 className="font-heading font-bold text-lg sm:text-xl text-white leading-snug">
                  {post.title}
                </h3>

                {/* Content */}
                {renderFormattedText(post.content, isExpanded, post.id)}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-white/8 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Автор: <strong className="text-zinc-400 font-medium">{post.author}</strong></span>

                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#229ED9] hover:underline font-semibold"
                  >
                    <span>В Telegram</span>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span>OFMEDIA Live</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ADMIN NEWS EDITOR MODAL */}
      {isAdmin && isEditorOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 select-none">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-2xl"
            onClick={() => setIsEditorOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-[#101012] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-white">
                {editingPostId ? 'Редактирование новости' : 'Новая публикация OFNEWS'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Заголовок новости:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Введите заголовок..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00]"
                />
              </div>

              {/* Tag & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Тег / Категория:</label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="Например: Обновление, Премьера"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">Обложка (URL картинки, опционально):</label>
                  <input
                    type="url"
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00]"
                  />
                </div>
              </div>

              {/* Formatting Quick Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400 font-medium">Текст новости:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-xs text-zinc-300 font-bold"
                      title="Жирный шрифт"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-xs text-zinc-300 italic"
                      title="Курсив"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-xs text-zinc-300 font-serif"
                      title="Цитата"
                    >
                      Цитата
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('\n[cut]\n')}
                      className="px-2 py-1 rounded bg-[#ff5c00]/20 hover:bg-[#ff5c00]/30 text-xs text-[#ff5c00] font-semibold border border-[#ff5c00]/30"
                      title="Разделитель для сворачивания длинных новостей"
                    >
                      [cut]
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[текст](', ')')}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-xs text-zinc-300"
                      title="Ссылка"
                    >
                      Ссылка
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('![описание](', ')')}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-xs text-zinc-300"
                      title="Картинка"
                    >
                      Фото
                    </button>
                  </div>
                </div>

                <textarea
                  id="news-content-textarea"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={8}
                  placeholder="Напишите текст новости..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#ff5c00] font-mono leading-relaxed"
                />
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-[#ff5c00] focus:ring-0"
                  />
                  <span>Закрепить новость вверху</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-[#ff5c00] hover:underline"
                >
                  {showPreview ? 'Скрыть предпросмотр' : 'Предпросмотр'}
                </button>
              </div>

              {/* Preview Window */}
              {showPreview && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Предпросмотр:</div>
                  <h4 className="font-heading font-bold text-base text-white">{formTitle || 'Заголовок'}</h4>
                  {renderFormattedText(formContent, true, 'preview')}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold shadow-lg shadow-[#ff5c00]/30 transition-all active:scale-95 cursor-pointer"
                >
                  {editingPostId ? 'Сохранить изменения' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 select-none">
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl transition-opacity cursor-pointer"
            onClick={() => setLightbox(null)}
          />

          <div className="relative z-10 max-w-5xl w-full flex flex-col items-center gap-3">
            {/* Top Bar with counter & close button */}
            <div className="w-full flex items-center justify-between text-white px-2">
              <span className="text-xs font-semibold text-zinc-300 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10">
                Изображение {lightbox.index + 1} из {lightbox.images.length}
              </span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Закрыть (Esc)"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Image Stage */}
            <div className="relative w-full flex items-center justify-center max-h-[75vh] overflow-hidden rounded-3xl bg-black/60 border border-white/10 shadow-2xl">
              <img
                src={lightbox.images[lightbox.index]}
                alt=""
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />

              {/* Prev Button */}
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev
                        ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
                        : null
                    );
                  }}
                  className="absolute left-3 p-3 rounded-2xl bg-black/60 hover:bg-black/85 text-white border border-white/15 backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                  title="Предыдущее фото (Стрелка влево)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Button */}
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
                    );
                  }}
                  className="absolute right-3 p-3 rounded-2xl bg-black/60 hover:bg-black/85 text-white border border-white/15 backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                  title="Следующее фото (Стрелка вправо)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Thumbnails strip if multiple */}
            {lightbox.images.length > 1 && (
              <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2">
                {lightbox.images.map((thumb, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setLightbox((prev) => (prev ? { ...prev, index: tIdx } : null))}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      tIdx === lightbox.index
                        ? 'border-[#ff5c00] scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
