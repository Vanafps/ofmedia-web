import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import type { Project, Episode } from '../data/projects';
import { PROJECTS_DATA } from '../data/projects';
import type { Actor } from '../data/actors';
import { getActorByName, getOrGenerateActor } from '../data/actors';
import {
  getMovieRating,
  submitMovieRating,
  deleteMovieRating,
  getRatingColorInfo,
  getStarColorInfo,
  getCurrentUserId,
  type MovieRatingStats,
} from '../services/ratingService';
import {
  getMovieReviews,
  submitMovieReview,
  voteMovieReview,
  deleteMovieReview,
  type MovieReviewStats,
  type ReviewType,
} from '../services/reviewService';
import { PlayIcon } from './PlayIcon';
import { Tooltip } from './ui/Tooltip';
import { OfmediaMovieCard } from './OfmediaMovieCard';

interface OfmediaDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (project: Project, episode?: Episode) => void;
  onOpenActor: (actor: Actor) => void;
  isFavorite: boolean;
  onToggleFavorite: (projectId: string) => void;
  onSelectProject?: (project: Project) => void;
  onSelectGenre?: (genre: string) => void;
  favorites?: string[];
}

export const OfmediaDetailModal: React.FC<OfmediaDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onPlay,
  onOpenActor,
  isFavorite,
  onToggleFavorite,
  onSelectProject,
  onSelectGenre,
  favorites,
}) => {
  const initialColor = getRatingColorInfo(null);
  const [ratingData, setRatingData] = useState<MovieRatingStats>({
    score: null,
    scoreFormatted: '—',
    count: 0,
    countFormatted: 'Нет оценок',
    userRating: null,
    votes: {},
    histogram: {},
    percentages: {},
    colorInfo: initialColor,
    colorClass: initialColor.bgClass,
    colorHex: initialColor.colorHex,
  });
  const [reviewsData, setReviewsData] = useState<MovieReviewStats>({
    total: 0,
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    positivePercentage: 0,
    reviews: [],
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isFullSynopsisOpen, setIsFullSynopsisOpen] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trailer Lightbox State
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const trailerVideoRef = useRef<HTMLVideoElement | null>(null);
  const trailerHlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!isTrailerOpen || !project?.videoUrl) {
      if (trailerHlsRef.current) {
        trailerHlsRef.current.destroy();
        trailerHlsRef.current = null;
      }
      if (trailerVideoRef.current) {
        trailerVideoRef.current.pause();
        trailerVideoRef.current.removeAttribute('src');
      }
      return;
    }

    const video = trailerVideoRef.current;
    if (!video) return;

    if (Hls.isSupported() && project.videoUrl.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      trailerHlsRef.current = hls;
      hls.loadSource(project.videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = project.videoUrl;
      video.play().catch(() => {});
    }
  }, [isTrailerOpen, project?.videoUrl]);

  // Review Form State
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewType, setReviewType] = useState<ReviewType>('positive');
  const [reviewScore, setReviewScore] = useState<number>(10);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const refreshAll = () => {
    if (project) {
      setRatingData(getMovieRating(project.id));
      setReviewsData(getMovieReviews(project.id));
    }
  };

  useEffect(() => {
    if (project) {
      refreshAll();
      const watchedList = localStorage.getItem('ofmedia_watched') || '[]';
      try {
        setIsWatched(JSON.parse(watchedList).includes(project.id));
      } catch {
        setIsWatched(false);
      }
    }
  }, [project]);

  useEffect(() => {
    window.addEventListener('ofmedia_ratings_updated', refreshAll);
    window.addEventListener('ofmedia_reviews_updated', refreshAll);
    return () => {
      window.removeEventListener('ofmedia_ratings_updated', refreshAll);
      window.removeEventListener('ofmedia_reviews_updated', refreshAll);
    };
  }, [project]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleRate = (score: number) => {
    const updated = submitMovieRating(project.id, score);
    setRatingData(updated);
    setReviewScore(score);
    showToast(`Ваша оценка ${score} сохранена!`);
  };

  const handleRemoveRating = () => {
    const updated = deleteMovieRating(project.id);
    setRatingData(updated);
    showToast('Оценка удалена');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewText.trim()) {
      showToast('Заполните заголовок и текст рецензии');
      return;
    }

    let authorName = 'Зритель OFMEDIA';
    let authorAvatar: string | undefined = undefined;
    try {
      const userRaw = localStorage.getItem('ofmedia_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        authorName = u.displayName || authorName;
        authorAvatar = u.photoURL;
      }
    } catch {
      // ignore
    }

    submitMovieReview(project.id, {
      title: reviewTitle,
      text: reviewText,
      type: reviewType,
      ratingScore: reviewScore,
      authorName,
      authorAvatar,
    });

    setIsWritingReview(false);
    setReviewTitle('');
    setReviewText('');
    showToast('Рецензия успешно опубликована!');
  };

  const handleVoteReview = (reviewId: string, vote: 'helpful' | 'unhelpful') => {
    voteMovieReview(project.id, reviewId, vote);
  };

  const handleDeleteReview = (reviewId: string) => {
    deleteMovieReview(project.id, reviewId);
    showToast('Рецензия удалена');
  };

  const handleToggleWatched = () => {
    const nextWatched = !isWatched;
    setIsWatched(nextWatched);
    const watchedList = localStorage.getItem('ofmedia_watched') || '[]';
    try {
      let list: string[] = JSON.parse(watchedList);
      if (nextWatched) {
        if (!list.includes(project.id)) list.push(project.id);
        showToast('Отмечено как просмотренное');
      } else {
        list = list.filter((id) => id !== project.id);
        showToast('Удалено из просмотренных');
      }
      localStorage.setItem('ofmedia_watched', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?film=${project.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Ссылка на фильм скопирована в буфер!');
    } else {
      showToast(url);
    }
  };

  const currentUserId = getCurrentUserId();
  const relatedProjects = PROJECTS_DATA.filter((p) => p.id !== project.id).slice(0, 5);

  return (
    <div data-lenis-prevent="true" className="fixed inset-0 z-50 bg-[#070709] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      {/* Toast Notification with Glassmorphism */}
      {toastMessage && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[130] px-5 py-3 rounded-full glass-modal text-white text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <span className="text-[#ff5c00] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-12 py-3.5 sm:py-5 glass-header flex items-center justify-between pointer-events-none">
        <Tooltip content="Назад к каталогу (Esc)" position="bottom">
          <button
            onClick={onClose}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-zinc-100 hover:text-white transition-all text-xs font-medium group shadow-xl hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4 fill-current group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <span>Назад</span>
          </button>
        </Tooltip>

        <img
          src="/logos/ofmediawhite_clean.png"
          alt="OFMEDIA"
          className="pointer-events-auto h-5 sm:h-6 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
        />
      </div>

      {/* 1. CINEMATIC FULL-BLEED HERO */}
      <div className="relative w-full min-h-[70vh] sm:min-h-[85vh] flex flex-col justify-end px-4 sm:px-14 lg:px-20 pb-8 sm:pb-12 overflow-hidden">
        <img
          src={project.backdrop}
          alt={project.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/90 via-[#070709]/45 to-transparent" />

        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4 pt-16 sm:pt-20">
          {/* OFMEDIA Originals Official Brand Logo */}
          {project.isOriginal && (
            <div className="flex items-center pb-0.5">
              <img
                src="/logos/ofmediaoriginalswhite_clean.png"
                alt="OFMEDIA Originals"
                className="h-6 sm:h-7 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]"
              />
            </div>
          )}

          {/* Title / Title Logo */}
          {project.titleLogo ? (
            <div className="py-2">
              <img
                src={project.titleLogo}
                alt={project.title}
                className="max-h-20 sm:max-h-32 max-w-full w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]"
              />
              <h1 className="sr-only">{project.title}</h1>
            </div>
          ) : (
            <h1 className="font-bold text-2xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              {project.title}
            </h1>
          )}

          {project.subtitle && (
            <p className="text-xs sm:text-base text-zinc-300 font-normal">
              {project.subtitle}
            </p>
          )}

          {/* Meta Line with Glass Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300">
            {ratingData.count > 0 ? (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-md ${ratingData.colorClass}`}>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>{ratingData.scoreFormatted}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg glass-pill text-zinc-200 text-xs font-medium shadow">
                <span>★</span>
                <span>Оценить</span>
              </div>
            )}
            <span className="text-zinc-400 text-xs font-normal">({ratingData.countFormatted})</span>
            <span>•</span>
            <span className="text-white font-medium">{project.year}</span>
            <span>•</span>
            <span>{project.duration}</span>
            <span>•</span>
            <span>{project.country}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-200 glass-pill">
              {project.ageRating}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-2">
            {/* Main Watch Button */}
            <button
              onClick={() => onPlay(project)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-sm bg-[#ff5c00] hover:bg-[#e05200] text-white shadow-xl shadow-[#ff5c00]/35 hover:scale-104 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-white/20"
            >
              <PlayIcon className="w-4 h-4 fill-white" />
              <span>Смотреть фильм</span>
            </button>

            {/* Watch Trailer Button */}
            <button
              onClick={() => setIsTrailerOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full font-medium text-sm glass-pill hover:bg-white/15 text-white shadow-xl hover:scale-104 active:scale-95 transition-all flex items-center justify-center gap-2.5 border border-white/20"
            >
              <svg className="w-4 h-4 fill-[#ff5c00]" viewBox="0 0 24 24">
                <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
              </svg>
              <span>Трейлер</span>
            </button>

            {/* Favorite Bookmark */}
            <Tooltip content={isFavorite ? 'В избранном' : 'Добавить в избранное'} position="top">
              <button
                onClick={() => onToggleFavorite(project.id)}
                className={`p-3.5 rounded-full border transition-all duration-200 glass-pill hover:scale-105 active:scale-95 shadow-lg ${
                  isFavorite
                    ? 'bg-[#ff5c00]/25 border-[#ff5c00] text-[#ff5c00] shadow-[#ff5c00]/25'
                    : 'text-zinc-200 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </button>
            </Tooltip>

            {/* Watched Eye Icon */}
            <Tooltip content={isWatched ? 'Просмотрено (отменить)' : 'Отметить как просмотренное'} position="top">
              <button
                onClick={handleToggleWatched}
                className={`p-3.5 rounded-full border transition-all duration-200 glass-pill hover:scale-105 active:scale-95 shadow-lg ${
                  isWatched
                    ? 'bg-[#ff5c00]/25 border-[#ff5c00] text-[#ff5c00] shadow-[#ff5c00]/25'
                    : 'text-zinc-200 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </button>
            </Tooltip>

            {/* Share Button */}
            <Tooltip content="Поделиться ссылкой" position="top">
              <button
                onClick={handleShare}
                className="p-3.5 rounded-full glass-pill text-zinc-200 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 2. GENRES & FILM SPECS BAR */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-14 lg:px-20 pt-6 sm:pt-8">
        <div className="p-5 sm:p-7 rounded-3xl glass-card flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="text-[11px] text-zinc-400 font-normal uppercase tracking-wider">Жанры (нажмите для фильтрации)</div>
            <div className="flex flex-wrap items-center gap-2">
              {project.genres.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSelectGenre) {
                      onSelectGenre(g);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full glass-pill hover:bg-[#ff5c00]/25 hover:border-[#ff5c00] text-xs sm:text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
                  title={`Показать все фильмы в жанре «${g}»`}
                >
                  <span>{g}</span>
                  <span className="text-zinc-400 text-[10px]">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-10 text-xs sm:text-sm">
            <div>
              <div className="text-zinc-500 font-normal">Премьера</div>
              <div className="text-white font-medium mt-0.5">{project.releaseDate}</div>
            </div>
            <div>
              <div className="text-zinc-500 font-normal">Производство</div>
              <div className="text-white font-medium mt-0.5">{project.production || '©OFMEDIA ORIGINALS • Школа 2070'}</div>
            </div>
            <div>
              <div className="text-zinc-500 font-normal">Звук</div>
              <div className="text-white font-medium mt-0.5">{project.audioTrack || project.audioTracks?.[0] || 'Русский (Original Stereo)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACTORS & CREATORS */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-14 lg:px-20 space-y-4 sm:space-y-6 pt-8 sm:pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg sm:text-2xl text-white">
              Актёры и создатели
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-normal">
              Нажмите на участника, чтобы открыть фильмографию
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-normal hidden sm:block">
            {project.cast.length} человек в команде
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {project.cast.map((member, idx) => {
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2);

            const actorEntity = getActorByName(member.name);

            return (
              <div
                key={idx}
                onClick={() => {
                  if (actorEntity) {
                    onOpenActor(actorEntity);
                  }
                }}
                className="p-3.5 sm:p-4 rounded-2xl glass-card hover:bg-white/[0.08] hover:border-[#ff5c00]/50 transition-all flex flex-col items-center text-center space-y-2 sm:space-y-3 group shadow-lg cursor-pointer hover:-translate-y-1"
                title={`Открыть профиль: ${member.name}`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border border-white/20 overflow-hidden flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md group-hover:scale-108 group-hover:border-[#ff5c00] transition-all shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="space-y-0.5 w-full">
                  <div className="text-xs sm:text-sm font-medium text-white group-hover:text-[#ff5c00] transition-colors truncate">
                    {member.name}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-400 font-normal truncate">
                    {member.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DESCRIPTION & 6-TIER COLOR RATING SYSTEM */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-14 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pt-8 sm:pt-10">
        <div className="lg:col-span-6 space-y-3">
          <h2 className="font-bold text-lg sm:text-xl text-white">О фильме</h2>
          <p className="text-xs sm:text-base text-zinc-300 font-normal leading-relaxed">
            {isFullSynopsisOpen ? project.fullSynopsis : project.description}
          </p>
          <button
            onClick={() => setIsFullSynopsisOpen(!isFullSynopsisOpen)}
            className="text-xs sm:text-sm font-medium text-[#ff5c00] hover:underline pt-1 inline-block"
          >
            {isFullSynopsisOpen ? 'Свернуть описание' : 'Подробное описание'}
          </button>
        </div>

        {/* 6-Tier Rating Box */}
        <div className="lg:col-span-6 p-5 sm:p-7 rounded-3xl glass-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <span>
                  {ratingData.userRating ? `Ваша оценка — ${ratingData.userRating} / 10` : 'Оцените фильм'}
                </span>
                {ratingData.userRating && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-semibold shadow ${
                      getStarColorInfo(ratingData.userRating).bgClass
                    }`}
                  >
                    ★ {ratingData.userRating}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                {ratingData.count > 0
                  ? `Реальный рейтинг: ${ratingData.scoreFormatted} / 10 (${ratingData.countFormatted})`
                  : 'Будьте первым, кто оценит этот фильм!'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ratingData.count > 0 && (
                <button
                  onClick={() => setShowHistogram(!showHistogram)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline font-normal"
                >
                  {showHistogram ? 'Скрыть график' : 'График оценок'}
                </button>
              )}
              {ratingData.userRating && (
                <button
                  onClick={handleRemoveRating}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-normal"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>

          {/* 10 Star Buttons with 6-Tier Color feedback */}
          <div
            className="flex items-center justify-between gap-1 sm:gap-1.5 pt-1"
            onMouseLeave={() => setHoverRating(null)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
              const activeStar = hoverRating !== null ? hoverRating : ratingData.userRating;
              const isFilled = activeStar !== null && star <= activeStar;
              const starColor = getStarColorInfo(activeStar || star);

              return (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleRate(star)}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-center text-xs font-semibold transition-all ${
                    isFilled
                      ? `${starColor.bgClass} scale-105 ${starColor.glowClass}`
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
                  }`}
                  title={`Оценить на ${star} (${getStarColorInfo(star).label})`}
                >
                  <span className="text-xs sm:text-base">★</span>
                  <span className="block text-[9px] sm:text-[10px] font-normal opacity-85 mt-0.5">{star}</span>
                </button>
              );
            })}
          </div>

          {/* Histogram */}
          {showHistogram && ratingData.count > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-1.5 animate-in fade-in">
              <div className="text-[11px] font-medium text-zinc-400 mb-2">Распределение по шкале оценок:</div>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((star) => {
                const pct = ratingData.percentages[star] || 0;
                const count = ratingData.histogram[star] || 0;
                const starColor = getStarColorInfo(star);

                return (
                  <div key={star} className="flex items-center gap-2.5 text-[11px]">
                    <span className="w-5 text-right font-semibold" style={{ color: starColor.colorHex }}>
                      {star}★
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden relative border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: starColor.colorHex,
                          boxShadow: `0 0 8px ${starColor.colorHex}`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-zinc-400 font-normal">{pct}%</span>
                    <span className="w-12 text-right text-zinc-500 font-normal">({count})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. GENUINE REVIEWS SECTION */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-14 lg:px-20 space-y-6 pt-10 sm:pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg sm:text-2xl text-white">
                Рецензии и мнения зрителей
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-[#ff5c00]/20 border border-[#ff5c00]/30 text-[#ff5c00] text-xs font-semibold">
                {reviewsData.total} {reviewsData.total === 1 ? 'рецензия' : reviewsData.total < 5 ? 'рецензии' : 'рецензий'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal mt-0.5">
              Честные отзывы без накруток от реального сообщества
            </p>
          </div>

          <button
            onClick={() => setIsWritingReview(!isWritingReview)}
            className="px-5 py-2.5 rounded-full bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-medium transition-all shadow-lg shadow-[#ff5c00]/30 flex items-center justify-center gap-2 self-start sm:self-auto border border-white/15 hover:scale-104 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            <span>{isWritingReview ? 'Скрыть форму' : 'Написать рецензию'}</span>
          </button>
        </div>

        {/* REVIEW SUBMISSION FORM */}
        {isWritingReview && (
          <form
            onSubmit={handleSubmitReview}
            className="p-5 sm:p-7 rounded-3xl glass-card border border-[#ff5c00]/40 space-y-4 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Новая рецензия на фильм «{project.title}»
              </h3>
              <span className="text-xs text-zinc-400 font-normal">Ваше мнение увидят другие зрители</span>
            </div>

            {/* Sentiment Selector: Positive, Neutral, Negative */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Тип рецензии:</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setReviewType('positive')}
                  className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    reviewType === 'positive'
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'glass-pill text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Положительная</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewType('neutral')}
                  className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    reviewType === 'neutral'
                      ? 'bg-zinc-600/30 border-zinc-400 text-white shadow-[0_0_15px_rgba(161,161,170,0.3)]'
                      : 'glass-pill text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                  <span>Нейтральная</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewType('negative')}
                  className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    reviewType === 'negative'
                      ? 'bg-rose-500/25 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'glass-pill text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span>Отрицательная</span>
                </button>
              </div>
            </div>

            {/* Review Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 block">Заголовок рецензии:</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Краткая суть вашего впечатления..."
                className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#ff5c00] placeholder-zinc-500"
              />
            </div>

            {/* Review Body */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300 block">Текст рецензии:</label>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Опишите ваши впечатления от сюжета, актерской игры, режиссуры и монтажа..."
                className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#ff5c00] placeholder-zinc-500 custom-scrollbar"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWritingReview(false)}
                className="px-5 py-2.5 rounded-2xl glass-pill text-zinc-300 text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-medium transition-all shadow-lg shadow-[#ff5c00]/35 border border-white/15"
              >
                Опубликовать
              </button>
            </div>
          </form>
        )}

        {/* REVIEWS LIST */}
        {reviewsData.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewsData.reviews.map((rev) => {
              const isMyReview = rev.userId === currentUserId;
              const myVote = rev.votedUsers[currentUserId];

              return (
                <div
                  key={rev.id}
                  className={`p-5 rounded-3xl glass-card transition-all flex flex-col justify-between space-y-3.5 ${
                    rev.type === 'positive'
                      ? 'border-emerald-500/35 hover:border-emerald-500/50'
                      : rev.type === 'negative'
                      ? 'border-rose-500/35 hover:border-rose-500/50'
                      : 'hover:border-white/25'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Review Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 flex items-center justify-center text-white font-semibold text-xs shadow">
                          {rev.authorInitials}
                        </div>

                        <div>
                          <div className="text-xs font-medium text-white flex items-center gap-2">
                            <span>{rev.authorName}</span>
                            {isMyReview && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-[#ff5c00]/20 text-[#ff5c00] font-medium">
                                Вы
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-normal">
                            {new Date(rev.createdAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                            rev.type === 'positive'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : rev.type === 'negative'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-zinc-600/30 text-zinc-300 border border-zinc-500/30'
                          }`}
                        >
                          {rev.type === 'positive'
                            ? 'Положительная'
                            : rev.type === 'negative'
                            ? 'Отрицательная'
                            : 'Нейтральная'}
                        </span>
                        {rev.ratingScore && (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStarColorInfo(rev.ratingScore).bgClass}`}>
                            ★ {rev.ratingScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Title & Body */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        {rev.title}
                      </h3>
                      <p className="text-xs text-zinc-300 font-normal leading-relaxed whitespace-pre-line">
                        {rev.text}
                      </p>
                    </div>
                  </div>

                  {/* Review Footer with Pure Vector Icons */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-normal">Полезно?</span>
                      <button
                        onClick={() => handleVoteReview(rev.id, 'helpful')}
                        className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                          myVote === 'helpful'
                            ? 'bg-emerald-500/25 text-emerald-400 font-bold border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : 'glass-pill text-zinc-300'
                        }`}
                        title="Полезная рецензия"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                        </svg>
                        <span>{rev.helpfulCount}</span>
                      </button>

                      <button
                        onClick={() => handleVoteReview(rev.id, 'unhelpful')}
                        className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                          myVote === 'unhelpful'
                            ? 'bg-rose-500/25 text-rose-400 font-bold border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                            : 'glass-pill text-zinc-300'
                        }`}
                        title="Бесполезная рецензия"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                        </svg>
                        <span>{rev.unhelpfulCount}</span>
                      </button>
                    </div>

                    {isMyReview && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-normal"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center glass-card rounded-3xl space-y-3 p-6 max-w-lg mx-auto shadow-xl">
            <h3 className="font-medium text-white text-sm">
              На этот фильм пока нет рецензий
            </h3>
            <p className="text-xs text-zinc-400 font-normal">
              Поделитесь своими мыслями первым — нажмите кнопку «Написать рецензию» выше!
            </p>
          </div>
        )}
      </div>

      {/* 6. «СМОТРИТЕ ТАКЖЕ» */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-14 lg:px-20 space-y-4 sm:space-y-6 pt-12 sm:pt-14 pb-24 sm:pb-20">
        <h2 className="font-heading font-bold text-lg sm:text-2xl text-white">
          Смотрите также
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {relatedProjects.map((rel) => (
            <OfmediaMovieCard
              key={rel.id}
              project={rel}
              onPlay={onPlay}
              onOpenDetails={(p) => {
                if (onSelectProject) {
                  onSelectProject(p);
                } else {
                  onPlay(p);
                }
              }}
              isFavorite={favorites?.includes(rel.id) ?? (rel.id === project.id ? isFavorite : false)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
