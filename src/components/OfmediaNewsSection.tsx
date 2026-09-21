import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../services/firebase';

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  tag: string;
  coverImage?: string;
  pinned?: boolean;
}

const ADMIN_UID = 'vk_759530692';

const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news_1',
    title: 'Большое обновление OFMEDIA: Кинематографичный плеер и мобильная версия',
    content: `Мы рады представить масштабное обновление стриминговой платформы OFMEDIA! **Что изменилось:**\n\n* Новый адаптивный видеоплеер с оптически центрированными контролами и поддержкой жестов\n* Мягкий градиент перемотки на 10 секунд и мгновенная пауза по одинарному клику\n* Полноэкранный режим с автоповоротом на мобильных устройствах\n* Новый раздел новостей и обновленный каталог жанров\n\n[cut]\n\n> Мы продолжаем совершенствовать сервис, делая просмотр максимально удобным на любых экранах: от смартфонов до 4K-телевизоров.\n\nСпасибо, что выбираете OFMEDIA! Приятного просмотра!`,
    date: '21 сентября 2026',
    author: 'OFMEDIA Official',
    tag: 'Обновление',
    pinned: true,
  },
  {
    id: 'news_2',
    title: 'Эксклюзивные релизы и оригинальные проекты осени',
    content: `В каталоге OFMEDIA доступны новые оригинальные проекты в сверхвысоком разрешении 4K Ultra HD. Все релизы сопровождаются студийным дубляжом и расширенными материалами со съемочной площадки.\n\nПереходите в раздел «Главная» или выбирайте интересующий жанр через каталог!`,
    date: '20 сентября 2026',
    author: 'Редакция OFMEDIA',
    tag: 'Премьеры',
  },
];

interface OfmediaNewsSectionProps {
  user: UserProfile | null;
}

export const OfmediaNewsSection: React.FC<OfmediaNewsSectionProps> = ({ user }) => {
  const [news, setNews] = useState<NewsPost[]>(() => {
    try {
      const saved = localStorage.getItem('ofmedia_news');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_NEWS;
  });

  const [expandedNews, setExpandedNews] = useState<Record<string, boolean>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Editor Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTag, setFormTag] = useState('Новости');
  const [formCover, setFormCover] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    try {
      localStorage.setItem('ofmedia_news', JSON.stringify(news));
    } catch {}
  }, [news]);

  const toggleExpand = (id: string) => {
    setExpandedNews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormTitle('');
    setFormContent('');
    setFormTag('Новости');
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

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Удалить эту новость?')) {
      setNews((prev) => prev.filter((n) => n.id !== id));
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

    if (editingPostId) {
      setNews((prev) =>
        prev.map((n) =>
          n.id === editingPostId
            ? {
                ...n,
                title: formTitle.trim(),
                content: formContent.trim(),
                tag: formTag.trim(),
                coverImage: formCover.trim() || undefined,
                pinned: formPinned,
              }
            : n
        )
      );
    } else {
      const newPost: NewsPost = {
        id: `news_${Date.now()}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        date: dateStr,
        author: user?.displayName || 'Администратор',
        tag: formTag.trim(),
        coverImage: formCover.trim() || undefined,
        pinned: formPinned,
      };
      setNews((prev) => [newPost, ...prev]);
    }

    setIsEditorOpen(false);
  };

  const renderFormattedText = (raw: string, isExpanded: boolean, id: string) => {
    let textToRender = raw;
    const hasCut = raw.includes('[cut]');
    if (hasCut && !isExpanded) {
      textToRender = raw.split('[cut]')[0].trim();
    } else if (hasCut) {
      textToRender = raw.replace('[cut]', '\n\n');
    }

    // Process blocks: quotes, images, paragraphs, inline formatting
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
              <div key={idx} className="my-2 rounded-2xl overflow-hidden border border-white/10 max-h-80">
                <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full h-auto object-cover" />
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
            <span className="text-xs text-zinc-400 font-normal">Новости платформы и релизы</span>
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-wide">
            Новости и обновления
          </h2>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-103 active:scale-95 shadow-lg shadow-[#ff5c00]/25 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Опубликовать новость</span>
          </button>
        )}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {news.map((post) => {
          const isExpanded = !!expandedNews[post.id];
          return (
            <article
              key={post.id}
              className={`relative rounded-3xl glass-card p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                post.pinned ? 'border-[#ff5c00]/40 shadow-[0_8px_30px_rgba(255,92,0,0.08)]' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Meta Top Bar */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                      {post.tag}
                    </span>
                    {post.pinned && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#ff5c00]/20 text-[#ff5c00] border border-[#ff5c00]/30">
                        Закреплено
                      </span>
                    )}
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{post.date}</span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
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
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        title="Удалить новость"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Cover */}
                {post.coverImage && (
                  <div className="rounded-2xl overflow-hidden aspect-video w-full bg-zinc-900 border border-white/10">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Title */}
                <h3 className="font-heading font-bold text-lg sm:text-xl text-white leading-snug">
                  {post.title}
                </h3>

                {/* Formatted Content */}
                {renderFormattedText(post.content, isExpanded, post.id)}
              </div>

              {/* Author footer */}
              <div className="pt-4 mt-4 border-t border-white/8 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Автор: <strong className="text-zinc-400 font-medium">{post.author}</strong></span>
                <span>OFMEDIA Live</span>
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
                      ” Цитата
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
    </section>
  );
};
