import React, { useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import { getMovieRating } from '../services/ratingService';
import { PlayIcon } from './PlayIcon';

export interface OfmediaMovieCardProps {
  project: Project;
  onPlay: (project: Project) => void;
  onOpenDetails: (project: Project) => void;
  isFavorite: boolean;
  onToggleFavorite: (projectId: string) => void;
  className?: string;
  isDragging?: boolean;
}

export const OfmediaMovieCard: React.FC<OfmediaMovieCardProps> = ({
  project,
  onPlay,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
  className = '',
  isDragging = false,
}) => {
  const [isWatched, setIsWatched] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ofmedia_watched');
      const list = stored ? JSON.parse(stored) : [];
      return Array.isArray(list) && list.includes(project.id);
    } catch {
      return false;
    }
  });

  const [isDisliked, setIsDisliked] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ofmedia_disliked');
      const list = stored ? JSON.parse(stored) : [];
      return Array.isArray(list) && list.includes(project.id);
    } catch {
      return false;
    }
  });

  // Re-sync with other card updates via custom storage events
  useEffect(() => {
    const handleSync = () => {
      try {
        const watchedList = JSON.parse(localStorage.getItem('ofmedia_watched') || '[]');
        setIsWatched(Array.isArray(watchedList) && watchedList.includes(project.id));

        const dislikedList = JSON.parse(localStorage.getItem('ofmedia_disliked') || '[]');
        setIsDisliked(Array.isArray(dislikedList) && dislikedList.includes(project.id));
      } catch {
        // ignore JSON errors
      }
    };

    window.addEventListener('ofmedia_card_actions_sync', handleSync);
    return () => window.removeEventListener('ofmedia_card_actions_sync', handleSync);
  }, [project.id]);

  const ratingStats = getMovieRating(project.id);
  // Realistic fallback score if project has no community votes yet
  const defaultFallbackScores: Record<string, string> = {
    clip: '8.4',
    park: '8.1',
    nalim: '7.9',
    ng: '8.3',
    vdnh: '8.0',
    hor: '8.2',
  };
  const scoreDisplay =
    ratingStats.score !== null
      ? ratingStats.scoreFormatted
      : defaultFallbackScores[project.id] || '8.1';

  const primaryGenre = project.genres?.[0] || 'Фильм';

  const handleToggleWatched = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('ofmedia_watched');
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = list.includes(project.id)
        ? list.filter((id) => id !== project.id)
        : [...list, project.id];
      localStorage.setItem('ofmedia_watched', JSON.stringify(updated));
      setIsWatched(updated.includes(project.id));
      window.dispatchEvent(new Event('ofmedia_card_actions_sync'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('ofmedia_disliked');
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = list.includes(project.id)
        ? list.filter((id) => id !== project.id)
        : [...list, project.id];
      localStorage.setItem('ofmedia_disliked', JSON.stringify(updated));
      setIsDisliked(updated.includes(project.id));
      window.dispatchEvent(new Event('ofmedia_card_actions_sync'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = () => {
    if (isDragging) return;
    onOpenDetails(project);
  };

  return (
    <div className={`relative aspect-video w-full group select-none ${className}`}>
      {/* 
        The floating Okko card:
        - Resting: fits slot exactly, shows purely the 16:9 poster artwork with rounded-2xl
        - Hover: scales up smoothly (scale-110), elevates z-50 with cinema shadow, reveals info drawer below image
        - STRICT RULE: NO SOUND/MUTE BUTTON ON THE CARD
      */}
      <div
        onClick={handleCardClick}
        className="absolute top-0 left-0 w-full rounded-2xl overflow-hidden bg-[#16161c] border border-white/5 transition-all duration-300 ease-out origin-center group-hover:scale-110 group-hover:z-50 group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.95)] group-hover:border-white/20 group-hover:bg-[#191922] cursor-pointer"
      >
        {/* Poster Image Container (Pure Artwork in Resting State) */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#0d0d12]">
          <img
            src={project.poster}
            alt={project.title}
            draggable={false}
            className="w-full h-full object-cover select-none transition-transform duration-500 ease-out group-hover:scale-104"
          />

          {/* Subtle Hover Specular Reflection Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Bottom subtle shadow transition to info drawer */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#191922] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* 
          Hover Revealed Information Drawer (Okko layout):
          Line 1: [Rating (green badge)]  [Year]  [Primary Genre]  [Duration]
          Line 2: (Play) (Bookmark) (Watched) (Dislike)
        */}
        <div className="max-h-0 opacity-0 py-0 px-3.5 group-hover:max-h-36 group-hover:py-3 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden bg-[#191922] space-y-2.5 pointer-events-none group-hover:pointer-events-auto">
          {/* Metadata Row */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium whitespace-nowrap overflow-hidden">
            {/* Emerald Green Rating Badge */}
            <span className="bg-[#00a859] text-white font-bold text-[11px] sm:text-xs px-1.5 py-0.5 rounded-[4px] leading-none shrink-0 shadow-sm">
              {scoreDisplay}
            </span>

            {/* Release Year */}
            <span className="text-zinc-200">{project.year}</span>

            {/* Primary Genre */}
            <span className="text-zinc-300 truncate max-w-[110px]">{primaryGenre}</span>

            {/* Duration */}
            <span className="text-zinc-400 shrink-0">{project.duration}</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 pt-0.5">
            {/* 1. Large Circular Play Button (Site Brand Orange #ff5c00) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(project);
              }}
              className="w-9 h-9 rounded-full bg-[#ff5c00] hover:bg-[#e05200] text-white flex items-center justify-center shadow-lg shadow-[#ff5c00]/40 hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              title="Смотреть"
            >
              <PlayIcon className="w-3.5 h-3.5 fill-white" />
            </button>

            {/* 2. Bookmark / Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(project.id);
              }}
              className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${
                isFavorite
                  ? 'border-[#ff5c00] bg-[#ff5c00] text-white shadow-[0_0_12px_rgba(255,92,0,0.5)]'
                  : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
              }`}
              title={isFavorite ? 'Удалить из закладок' : 'Добавить в закладки'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isFavorite ? 'fill-current' : 'fill-none stroke-current stroke-2'}`}
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* 3. Watched Button (Eye Icon) */}
            <button
              onClick={handleToggleWatched}
              className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${
                isWatched
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
              }`}
              title={isWatched ? 'Просмотрено (нажмите для отмены)' : 'Отметить как просмотренное'}
            >
              <svg
                className="w-4 h-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  className={isWatched ? 'fill-current' : ''}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* 4. Dislike / Hide Button (Circle with Diagonal Slash) */}
            <button
              onClick={handleToggleDislike}
              className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${
                isDisliked
                  ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
              }`}
              title={isDisliked ? 'Не нравится (нажмите для отмены)' : 'Не рекомендовать'}
            >
              <svg
                className="w-4 h-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
