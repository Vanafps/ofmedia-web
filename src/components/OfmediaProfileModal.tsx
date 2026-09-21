import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../services/firebase';
import { updateLocalUserProfile, CINEMA_AVATARS } from '../services/firebase';
import { getUserRatings } from '../services/ratingService';
import { getAllUserReviews, deleteMovieReview, type Review } from '../services/reviewService';
import { PROJECTS_DATA, type Project } from '../data/projects';
import { OfmediaMovieCard } from './OfmediaMovieCard';
import { PlayIcon } from './PlayIcon';
import { CustomSelect } from './ui/CustomSelect';
import { getOfflineMovies, removeOfflineMovie, type OfflineMovie } from '../services/offlineStorageService';
import { checkForAppUpdate, triggerApkDownload, CURRENT_APP_VERSION } from '../services/updateService';

interface OfmediaProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  onSelectProject: (project: Project) => void;
  onPlayProject: (project: Project) => void;
}

export const OfmediaProfileModal: React.FC<OfmediaProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onSelectProject,
  onPlayProject,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'downloads' | 'history' | 'ratings' | 'reviews' | 'settings'>('overview');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatarIcon || 'popcorn');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [watchedProjects, setWatchedProjects] = useState<Project[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [favoritesList, setFavoritesList] = useState<string[]>([]);
  const [offlineMovies, setOfflineMovies] = useState<OfflineMovie[]>([]);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Player Settings
  const [prefQuality, setPrefQuality] = useState(() => localStorage.getItem('ofmedia_pref_quality') || '1080p');
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem('ofmedia_pref_autonext') !== 'false');

  const refreshData = useCallback(() => {
    try {
      const watchedRaw = localStorage.getItem('ofmedia_watched') || '[]';
      const watchedIds: string[] = JSON.parse(watchedRaw);
      setWatchedProjects(PROJECTS_DATA.filter((p) => watchedIds.includes(p.id)));
    } catch {
      setWatchedProjects([]);
    }

    try {
      const favRaw = localStorage.getItem('ofmedia_favs') || localStorage.getItem('ofmedia_favorites') || '[]';
      setFavoritesList(JSON.parse(favRaw));
    } catch {
      setFavoritesList([]);
    }

    setUserRatings(getUserRatings());
    setUserReviews(getAllUserReviews(user?.uid));
    setOfflineMovies(getOfflineMovies());
  }, [user?.uid]);

  const handleToggleFavorite = (projectId: string) => {
    setFavoritesList((prev) => {
      const next = prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId];
      localStorage.setItem('ofmedia_favs', JSON.stringify(next));
      localStorage.setItem('ofmedia_favorites', JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      const currentName = user?.displayName || user?.email?.split('@')[0] || 'Пользователь';
      setDisplayName(currentName);
      setSelectedAvatar(user?.avatarIcon || 'popcorn');
      refreshData();
    }
  }, [isOpen, user, refreshData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentDisplayName = displayName || user?.displayName || user?.email?.split('@')[0] || 'Пользователь';

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        updateLocalUserProfile({
          photoURL: dataUrl,
          avatarIcon: null,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    updateLocalUserProfile({
      photoURL: null,
      avatarIcon: selectedAvatar || 'popcorn',
    });
  };

  const handleSaveProfile = () => {
    updateLocalUserProfile({
      displayName: currentDisplayName.trim() || 'Пользователь',
      avatarIcon: selectedAvatar,
    });
    setIsEditingProfile(false);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('ofmedia_watched');
    setWatchedProjects([]);
  };

  const handleRemoveHistoryItem = (projectId: string) => {
    try {
      const watchedRaw = localStorage.getItem('ofmedia_watched') || '[]';
      const list: string[] = JSON.parse(watchedRaw);
      const next = list.filter((id) => id !== projectId);
      localStorage.setItem('ofmedia_watched', JSON.stringify(next));
      setWatchedProjects(PROJECTS_DATA.filter((p) => next.includes(p.id)));
    } catch {
      // ignore
    }
  };

  const handleDeleteReview = (projectId: string, reviewId: string) => {
    deleteMovieReview(projectId, reviewId);
    setUserReviews(getAllUserReviews(user?.uid));
  };

  const handleSaveSettings = (quality: string, auto: boolean) => {
    setPrefQuality(quality);
    setAutoNext(auto);
    localStorage.setItem('ofmedia_pref_quality', quality);
    localStorage.setItem('ofmedia_pref_autonext', auto ? 'true' : 'false');
  };

  const ratedEntries = Object.entries(userRatings);
  const avgRating =
    ratedEntries.length > 0
      ? (ratedEntries.reduce((acc, [, val]) => acc + val, 0) / ratedEntries.length).toFixed(1)
      : '—';

  const totalMinutes = watchedProjects.reduce((acc, p) => {
    const num = parseInt(p.duration) || 20;
    return acc + num;
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-lenis-prevent="true"
          className="fixed inset-0 z-[100] bg-[#08080a] overflow-y-auto custom-scrollbar text-[#f4f4f5] pb-28 sm:pb-12"
        >
      {/* Hidden File Input for Custom Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
      />

      {/* Top Floating Navigation Header */}
      <div className="sticky top-0 left-0 right-0 z-40 px-4 sm:px-12 py-3.5 sm:py-5 glass-header flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-white transition-all text-xs font-semibold group shadow-lg hover:scale-105 active:scale-95 bg-[#ff5c00]/20 hover:bg-[#ff5c00] border border-[#ff5c00]/40"
          title="Вернуться на главную (Esc)"
        >
          <svg className="w-4 h-4 fill-current group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>← На главную</span>
        </button>

        <img
          src="/logos/ofmediawhite_clean.png"
          alt="OFMEDIA"
          className="h-5 sm:h-6 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 space-y-8">
        {/* USER PROFILE HERO */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Meta */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              {(() => {
                if (user?.photoURL) {
                  return (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/20 shrink-0 shadow-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  );
                }
                const avatarKey = (isEditingProfile ? selectedAvatar : user?.avatarIcon) || 'popcorn';
                const currentAvatarObj = CINEMA_AVATARS.find((a) => a.id === avatarKey) || CINEMA_AVATARS[0];
                return (
                  <img
                    src={currentAvatarObj.src}
                    alt={currentAvatarObj.label}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/20 shrink-0 shadow-lg"
                  />
                );
              })()}

              {/* Interactive Change Avatar Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition-opacity cursor-pointer backdrop-blur-[2px]"
                title="Загрузить свою фотографию"
              >
                <svg className="w-5 h-5 mb-0.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Изменить</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  {currentDisplayName}
                </h1>
                {user?.username && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff5c00]/15 border border-[#ff5c00]/30 text-[#ff5c00] text-xs font-semibold">
                    {user.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-normal">
                {user?.email || 'Локальный профиль зрителя'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-zinc-500 font-normal">
                <span>OFMEDIA ID: {user?.uid || 'local_user'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-center md:self-auto">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-5 py-2.5 rounded-2xl glass-pill text-xs font-medium text-zinc-200 hover:text-white transition-all hover:scale-103 active:scale-95 shadow"
            >
              {isEditingProfile ? 'Скрыть редактор' : 'Редактировать профиль'}
            </button>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="px-4 py-2.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* PROFILE EDIT FORM */}
        {isEditingProfile && (
          <div className="p-6 rounded-3xl glass-card space-y-5 animate-in fade-in">
            <h3 className="font-bold text-base text-white">Редактирование профиля</h3>

            {/* Custom Photo Upload & Removal Controls */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium block">Ваша фотография:</label>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow hover:scale-102 active:scale-95"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Загрузить фото с устройства</span>
                </button>

                {user?.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-4 py-2.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-300 text-xs font-medium transition-all cursor-pointer hover:scale-102 active:scale-95"
                  >
                    Удалить свое фото
                  </button>
                )}
              </div>
            </div>
            
            {/* Minimalist Cinema Avatars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400 font-medium block">Или выберите минималистичный аватар киномана:</label>
                {(selectedAvatar || user?.avatarIcon || user?.photoURL) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(null);
                      updateLocalUserProfile({ photoURL: null, avatarIcon: null });
                    }}
                    className="text-[11px] text-[#ff5c00] hover:underline font-medium cursor-pointer"
                  >
                    Сбросить аватар
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-w-md">
                {CINEMA_AVATARS.map((av) => {
                  const isSelected = selectedAvatar === av.id && !user?.photoURL;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAvatar(null);
                          updateLocalUserProfile({ photoURL: null, avatarIcon: null });
                        } else {
                          setSelectedAvatar(av.id);
                          updateLocalUserProfile({ photoURL: null, avatarIcon: av.id });
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#ff5c00] bg-[#ff5c00]/20 ring-2 ring-[#ff5c00]/50 scale-105 shadow-lg shadow-[#ff5c00]/20'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={av.src}
                        alt={av.label}
                        className="w-12 h-12 rounded-xl object-cover shadow-inner mb-1.5"
                      />
                      <span className="text-[10px] text-zinc-300 font-medium truncate max-w-full">{av.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium block">Имя пользователя:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#ff5c00]"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-2xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-medium transition-all shadow border border-white/20 cursor-pointer"
              >
                Сохранить
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-2xl glass-pill text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {[
            { id: 'overview', label: 'Обзор', count: null },
            { id: 'downloads', label: 'Оффлайн', count: offlineMovies.length },
            { id: 'history', label: 'История', count: watchedProjects.length },
            { id: 'ratings', label: 'Оценки', count: ratedEntries.length },
            { id: 'reviews', label: 'Рецензии', count: userReviews.length },
            { id: 'settings', label: 'Настройки', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#ff5c00] text-white shadow-lg border border-white/20'
                  : 'glass-pill text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 4 Clean Metric Cards with SVGs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Watch Time */}
              <div className="p-5 rounded-3xl glass-card space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-normal">Время просмотра</span>
                  <svg className="w-4 h-4 fill-zinc-400" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </div>
                <div className="font-bold text-2xl sm:text-3xl text-white">
                  {totalMinutes} <span className="text-xs text-zinc-400 font-normal">минут</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-normal">
                  {watchedProjects.length} {watchedProjects.length === 1 ? 'релиз' : 'релизов'}
                </div>
              </div>

              {/* Ratings */}
              <div className="p-5 rounded-3xl glass-card space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-normal">Средний балл</span>
                  <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <div className="font-bold text-2xl sm:text-3xl text-white flex items-center gap-1.5">
                  <svg className="w-5 h-5 fill-amber-400 shrink-0" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{avgRating}</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-normal">
                  {ratedEntries.length} {ratedEntries.length === 1 ? 'оценка' : 'оценок'}
                </div>
              </div>

              {/* Reviews */}
              <div className="p-5 rounded-3xl glass-card space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-normal">Рецензии</span>
                  <svg className="w-4 h-4 fill-zinc-400" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                  </svg>
                </div>
                <div className="font-bold text-2xl sm:text-3xl text-white">
                  {userReviews.length}
                </div>
                <div className="text-[11px] text-zinc-400 font-normal">
                  Опубликовано мнений
                </div>
              </div>

              {/* Bookmarks */}
              <div className="p-5 rounded-3xl glass-card space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-normal">В закладках</span>
                  <svg className="w-4 h-4 fill-zinc-400" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <div className="font-bold text-2xl sm:text-3xl text-white">
                  {favoritesList.length}
                </div>
                <div className="text-[11px] text-zinc-400 font-normal">
                  Сохраненных фильмов
                </div>
              </div>
            </div>

            {/* Continue Watching Row */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-white">
                  Продолжить просмотр
                </h2>
                {watchedProjects.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-[#ff5c00] hover:underline font-normal"
                  >
                    Вся история ({watchedProjects.length}) →
                  </button>
                )}
              </div>

              {watchedProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {watchedProjects.slice(0, 3).map((p) => (
                    <OfmediaMovieCard
                      key={p.id}
                      project={p}
                      onPlay={(proj) => {
                        onPlayProject(proj);
                        onClose();
                      }}
                      onOpenDetails={(proj) => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      isFavorite={favoritesList.includes(p.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center glass-card rounded-3xl space-y-2">
                  <div className="text-xs text-zinc-300 font-medium">История просмотров пуста</div>
                  <p className="text-[11px] text-zinc-500 font-normal">Запустите фильм в каталоге, и он появится здесь</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-white">История просмотров</h2>
                <p className="text-xs text-zinc-400 font-normal">Все просмотренные видео</p>
              </div>
              {watchedProjects.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
                >
                  Очистить историю
                </button>
              )}
            </div>

            {watchedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {watchedProjects.map((p) => (
                  <div key={p.id} className="relative group/hist">
                    <OfmediaMovieCard
                      project={p}
                      onPlay={(proj) => {
                        onPlayProject(proj);
                        onClose();
                      }}
                      onOpenDetails={(proj) => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      isFavorite={favoritesList.includes(p.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <button
                      onClick={() => handleRemoveHistoryItem(p.id)}
                      className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 text-zinc-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/hist:opacity-100 shadow"
                      title="Удалить из истории"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-3xl space-y-2">
                <div className="text-sm font-medium text-white">История просмотров пуста</div>
                <p className="text-xs text-zinc-400 font-normal">Запустите просмотр фильма в каталоге</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RATINGS */}
        {activeTab === 'ratings' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="font-bold text-lg text-white">Мои оценки</h2>
              <p className="text-xs text-zinc-400 font-normal">Ваши личные оценки фильмов</p>
            </div>

            {ratedEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ratedEntries.map(([projectId, score]) => {
                  const proj = PROJECTS_DATA.find((p) => p.id === projectId);
                  if (!proj) return null;

                  return (
                    <div
                      key={projectId}
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="p-4 rounded-3xl glass-card hover:border-white/30 transition-all flex items-center gap-4 cursor-pointer group shadow"
                    >
                      <img
                        src={proj.poster}
                        alt={proj.title}
                        className="w-16 aspect-video rounded-xl object-cover bg-zinc-800 shrink-0 shadow"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-[#ff5c00] transition-colors truncate">
                          {proj.title}
                        </div>
                        <div className="text-xs text-zinc-400 font-normal truncate">
                          {proj.genres.join(', ')} • {proj.year}
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm shrink-0 shadow flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 fill-emerald-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-3xl space-y-2">
                <div className="text-sm font-medium text-white">Вы еще не оценили ни одного фильма</div>
                <p className="text-xs text-zinc-400 font-normal">Поставьте оценку в карточке любого фильма</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h2 className="font-bold text-lg text-white">Опубликованные рецензии</h2>
              <p className="text-xs text-zinc-400 font-normal">Ваши отзывы на фильмы</p>
            </div>

            {userReviews.length > 0 ? (
              <div className="space-y-4">
                {userReviews.map((rev) => {
                  const proj = PROJECTS_DATA.find((p) => p.id === rev.projectId);

                  return (
                    <div
                      key={rev.id}
                      className="p-5 rounded-3xl glass-card space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-white">
                            {proj ? proj.title : 'Фильм'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                            <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1">
                              <svg className="w-3 h-3 fill-emerald-400" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span>{rev.ratingScore}</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteReview(rev.projectId, rev.id)}
                          className="text-xs text-zinc-400 hover:text-red-400 transition-colors font-normal"
                        >
                          Удалить
                        </button>
                      </div>

                      <div className="text-xs font-semibold text-zinc-200">{rev.title}</div>
                      <p className="text-xs text-zinc-300 font-normal leading-relaxed whitespace-pre-line">
                        {rev.text}
                      </p>

                      <div className="text-[11px] text-zinc-400 pt-2 flex items-center justify-between border-t border-white/5 font-normal">
                        <span>Опубликовано {new Date(rev.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span className="text-[#ff5c00] font-medium flex items-center gap-1">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                          </svg>
                          <span>{rev.helpfulCount}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-3xl space-y-2">
                <div className="text-sm font-medium text-white">Вы еще не написали ни одной рецензии</div>
                <p className="text-xs text-zinc-400 font-normal">Оставьте отзыв на странице любого фильма</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: OFFLINE DOWNLOADS */}
        {activeTab === 'downloads' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-lg sm:text-xl text-white">Оффлайн загрузки</h2>
                <p className="text-xs text-zinc-400 font-normal">
                  Фильмы и серии, сохранённые на вашем устройстве для просмотра без интернета
                </p>
              </div>
              {offlineMovies.length > 0 && (
                <div className="text-xs text-zinc-400 glass-pill px-3.5 py-1.5 rounded-full w-fit">
                  Всего занято: <span className="font-semibold text-[#ff5c00]">{offlineMovies.reduce((acc, m) => acc + (m.fileSizeMb || 0), 0)} МБ</span>
                </div>
              )}
            </div>

            {offlineMovies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {offlineMovies.map((movie) => (
                  <div key={movie.id} className="p-4 rounded-3xl glass-card space-y-3 flex flex-col justify-between">
                    <div className="flex gap-3">
                      <img
                        src={movie.poster || movie.backdrop}
                        alt={movie.title}
                        className="w-20 aspect-video rounded-xl object-cover bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-white truncate">{movie.title}</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{movie.year} • {movie.duration}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Размер: ~{movie.fileSizeMb} МБ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          onPlayProject(movie.project);
                          onClose();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
                      >
                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                        <span>Смотреть</span>
                      </button>
                      <button
                        onClick={() => removeOfflineMovie(movie.id)}
                        className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-medium transition-colors flex items-center justify-center"
                        title="Удалить из памяти"
                      >
                        <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                  <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-white">Нет загруженных фильмов</div>
                <p className="text-xs text-zinc-400 font-normal max-w-sm mx-auto">
                  Нажмите кнопку «Скачать оффлайн» на странице любого фильма, чтобы смотреть его в дороге без доступа к сети.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="font-bold text-lg text-white">Настройки плеера и приложения</h2>
              <p className="text-xs text-zinc-400 font-normal">Параметры видеопотока и обновлений</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-5 rounded-3xl glass-card flex items-center justify-between gap-4 relative z-30 overflow-visible">
                <div>
                  <div className="font-medium text-sm text-white">Качество видео по умолчанию</div>
                  <div className="text-xs text-zinc-400 font-normal mt-0.5">
                    Автоматически включать при запуске видео
                  </div>
                </div>
                <CustomSelect
                  value={prefQuality}
                  onChange={(val) => handleSaveSettings(val, autoNext)}
                  align="right"
                  options={[
                    { value: '1080p', label: '1080p' },
                    { value: '720p', label: '720p' },
                    { value: '540p', label: '540p' },
                    { value: '240p', label: '240p' },
                    { value: '144p', label: '144p' },
                    { value: 'auto', label: 'Авто' },
                  ]}
                  triggerClassName="rounded-2xl px-4 py-2 bg-black/60 border-white/20 text-xs"
                />
              </div>

              <div className="p-5 rounded-3xl glass-card flex items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="font-medium text-sm text-white">Автопереход к следующей серии</div>
                  <div className="text-xs text-zinc-400 font-normal mt-0.5">
                    Запускать следующее видео после окончания
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => handleSaveSettings(prefQuality, e.target.checked)}
                  className="w-5 h-5 accent-[#ff5c00] rounded-lg cursor-pointer"
                />
              </div>

              {/* App Version & Self Update Check without RuStore */}
              <div className="p-5 rounded-3xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
                <div>
                  <div className="font-medium text-sm text-white flex items-center gap-2">
                    <span>Мобильное приложение OFMEDIA</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#ff5c00]/20 text-[#ff5c00] text-[10px] font-mono font-bold">v{CURRENT_APP_VERSION}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-normal mt-0.5">
                    {updateMessage || 'Автономные обновления без магазинов приложений'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isCheckingUpdate}
                  onClick={async () => {
                    setIsCheckingUpdate(true);
                    setUpdateMessage('Проверка сервера обновлений...');
                    const res = await checkForAppUpdate();
                    setIsCheckingUpdate(false);
                    if (res.updateAvailable && res.latestVersion) {
                      setUpdateMessage(`Доступна новая версия ${res.latestVersion.versionName}! Загрузка APK...`);
                      triggerApkDownload(res.latestVersion.apkDirectUrl || res.latestVersion.apkUrl);
                    } else {
                      setUpdateMessage('У вас установлена последняя версия приложения.');
                    }
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-[#ff5c00] hover:text-white text-zinc-200 text-xs font-semibold transition-all active:scale-95 shrink-0 shadow border border-white/15"
                >
                  {isCheckingUpdate ? 'Проверяем...' : 'Проверить обновления'}
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
