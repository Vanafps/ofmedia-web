import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import type { Project } from '../data/projects';
import { getMovieRating } from '../services/ratingService';
import { PlayIcon } from './PlayIcon';
import { SpeakerVolumeIcon } from './OfmediaPlayer';
import { Tooltip } from './ui/Tooltip';

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

  const [, setRatingsTick] = useState(0);

  // Hover Preview Sound Toggle (muted by default, user can toggle and persist across cards)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('ofmedia_preview_sound') !== 'unmuted';
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Sync sound preference across cards
  useEffect(() => {
    const handleSoundToggle = () => {
      const isUnmuted = localStorage.getItem('ofmedia_preview_sound') === 'unmuted';
      setIsMuted(!isUnmuted);
      if (videoRef.current) {
        videoRef.current.muted = !isUnmuted;
      }
    };
    window.addEventListener('ofmedia_preview_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('ofmedia_preview_sound_toggle', handleSoundToggle);
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    }
    localStorage.setItem('ofmedia_preview_sound', nextMuted ? 'muted' : 'unmuted');
    window.dispatchEvent(new Event('ofmedia_preview_sound_toggle'));
  };

  // Setup video playback on hover
  useEffect(() => {
    if (!isHovered || !project.videoUrl) return;

    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    const src = project.videoUrl;
    const isHls = src.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        startLevel: 0,
        capLevelToPlayerSize: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isMuted;
        video.play().catch(() => {
          // Fallback to muted autoplay if browser policy blocked unmuted playback
          if (!video.muted) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      });
    } else {
      video.src = src;
      video.muted = isMuted;
      video.play().catch(() => {
        if (!video.muted) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isHovered, project.videoUrl, isMuted]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isDragging) return;
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
    setIsVideoPlaying(false);
    setPreviewProgress(0);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  // Re-sync with other card updates and ratings changes
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

    const handleRatingUpdate = () => {
      setRatingsTick((t) => t + 1);
    };

    window.addEventListener('ofmedia_card_actions_sync', handleSync);
    window.addEventListener('ofmedia_ratings_updated', handleRatingUpdate);
    return () => {
      window.removeEventListener('ofmedia_card_actions_sync', handleSync);
      window.removeEventListener('ofmedia_ratings_updated', handleRatingUpdate);
    };
  }, [project.id]);

  // Strictly real rating stats computed from actual user reviews
  const ratingStats = getMovieRating(project.id);
  const hasRealRating = ratingStats.count > 0 && ratingStats.score !== null;

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
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative aspect-video w-full group select-none ${className}`}
    >
      {/* 
        The floating Okko card:
        - Resting: fits slot exactly, shows purely the 16:9 poster artwork with rounded-2xl
        - Hover: scales up smoothly (scale-110), elevates z-50 with cinema shadow, reveals info drawer below image
        - Video Intro: plays muted on hover preview
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

          {/* Hover Video Intro Preview */}
          {isHovered && (
            <div className="absolute inset-0 overflow-hidden bg-black z-10">
              <video
                ref={videoRef}
                muted={isMuted}
                loop
                playsInline
                autoPlay
                onPlaying={() => setIsVideoPlaying(true)}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) {
                    const loopDuration = Math.min(v.duration, 30);
                    setPreviewProgress(((v.currentTime % loopDuration) / loopDuration) * 100);
                  }
                }}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  isVideoPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Teaser loop progress bar */}
              {isVideoPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20 pointer-events-none">
                  <div
                    className="h-full bg-[#ff5c00] transition-all duration-150 ease-linear"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Sound Mute / Unmute Button on Hover */}
          {isHovered && (
            <button
              type="button"
              onClick={toggleSound}
              className="absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 hover:border-white/40 flex items-center justify-center text-white transition-all duration-200 cursor-pointer active:scale-90 shadow-xl group/sound animate-in fade-in zoom-in-95"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
              aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              <SpeakerVolumeIcon
                isMuted={isMuted}
                volume={isMuted ? 0 : 1}
                className="w-4 h-4 text-white group-hover/sound:scale-110 transition-transform duration-150"
              />
            </button>
          )}

          {/* Subtle Hover Specular Reflection Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

          {/* Bottom subtle shadow transition to info drawer */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#191922] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
        </div>

        {/* 
          Hover Revealed Information Drawer (Okko layout):
          Line 1: [Rating (green badge)]  [Year]  [Primary Genre]  [Duration]
          Line 2: (Play) (Bookmark) (Watched) (Dislike)
        */}
        <div className="max-h-0 opacity-0 py-0 px-3.5 group-hover:max-h-36 group-hover:py-3 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden bg-[#191922] space-y-2.5 pointer-events-none group-hover:pointer-events-auto">
          {/* Metadata Row */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium whitespace-nowrap overflow-hidden">
            {/* Real Rating Badge with dynamic 6-Tier color scale (only when rated by real users) */}
            {hasRealRating && (
              <span
                style={{
                  backgroundColor: ratingStats.colorHex,
                  color: ratingStats.colorInfo.tier === 'yellow' ? '#000000' : '#ffffff',
                  boxShadow: `0 0 10px ${ratingStats.colorHex}55`,
                }}
                className="font-semibold text-xs px-1.5 py-0.5 rounded-[4px] leading-none shrink-0 transition-colors duration-200"
              >
                {ratingStats.scoreFormatted}
              </span>
            )}

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
            <Tooltip content="Смотреть" position="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(project);
                }}
                className="w-9 h-9 rounded-full bg-[#ff5c00] hover:bg-[#e05200] text-white flex items-center justify-center shadow-lg shadow-[#ff5c00]/40 hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              >
                <PlayIcon className="w-3.5 h-3.5 fill-white" />
              </button>
            </Tooltip>

            {/* 2. Bookmark / Favorite Button */}
            <Tooltip content={isFavorite ? 'Удалить из закладок' : 'Добавить в закладки'} position="top">
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
            </Tooltip>

            {/* 3. Watched Button (Eye Icon) */}
            <Tooltip content={isWatched ? 'Просмотрено (отменить)' : 'Отметить как просмотренное'} position="top">
              <button
                onClick={handleToggleWatched}
                className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${
                  isWatched
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
                }`}
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
            </Tooltip>

            {/* 4. Dislike / Hide Button (Circle with Diagonal Slash) */}
            <Tooltip content={isDisliked ? 'Не нравится (отменить)' : 'Не рекомендовать'} position="top">
              <button
                onClick={handleToggleDislike}
                className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${
                  isDisliked
                    ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
                }`}
              >
                <svg
                  className="w-4 h-4 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
