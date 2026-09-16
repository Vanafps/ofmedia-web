import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import type { Project } from '../data/projects';
import { getMovieRating } from '../services/ratingService';
import { PlayIcon } from './PlayIcon';
import { SpeakerVolumeIcon } from './OfmediaPlayer';
import { Tooltip } from './ui/Tooltip';
import { mobileCenterTracker } from '../utils/mobileCenterTracker';

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceIdRef = useRef<string>(
    `card_${project.id}_${Math.random().toString(36).substring(2, 8)}`
  );

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  const [isMobileCenterActive, setIsMobileCenterActive] = useState<boolean>(false);

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

  // Preview Sound Toggle (muted by default, persistent across cards)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('ofmedia_preview_sound') !== 'unmuted';
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Listen to screen resize for mobile vs desktop mode
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register in mobile center tracker
  useEffect(() => {
    const id = instanceIdRef.current;
    if (containerRef.current) {
      mobileCenterTracker.register(id, containerRef.current);
    }
    const unsubscribe = mobileCenterTracker.subscribe((activeId) => {
      setIsMobileCenterActive(activeId === id);
    });

    return () => {
      unsubscribe();
      mobileCenterTracker.unregister(id);
    };
  }, []);

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

  // Determine whether video teaser should play:
  // On mobile: only if this card is in the center of the viewport
  // On desktop: if user hovers the card
  const shouldPlayVideo = isMobile ? isMobileCenterActive : isHovered;

  useEffect(() => {
    if (!shouldPlayVideo || !project.videoUrl) {
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
      return;
    }

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
  }, [shouldPlayVideo, project.videoUrl, isMuted]);

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
    if (isDragging || isMobile) return;
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
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full select-none ${className}`}
    >
      {/* ========================================================= */}
      {/* 1. MOBILE VIEW (< md): Clean layout, NO hover, NO gray drawer */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col w-full group">
        {/* 16:9 Artwork / Center-Autoplay Video */}
        <div
          onClick={handleCardClick}
          className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#121216] border border-white/10 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
        >
          <img
            src={project.poster}
            alt={project.title}
            draggable={false}
            className="w-full h-full object-cover select-none"
          />

          {/* Autoplay Video only when this card is in center of viewport */}
          {isMobileCenterActive && (
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

              {/* Loop progress bar */}
              {isVideoPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20 pointer-events-none">
                  <div
                    className="h-full bg-[#ff5c00] transition-all duration-150 ease-linear"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              )}

              {/* Sound toggle button */}
              <button
                type="button"
                onClick={toggleSound}
                className="absolute top-2.5 right-2.5 z-30 w-7 h-7 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                <SpeakerVolumeIcon
                  isMuted={isMuted}
                  volume={isMuted ? 0 : 1}
                  className="w-3.5 h-3.5 text-white"
                />
              </button>
            </div>
          )}

          {/* Real Rating Badge directly visible on poster top-left */}
          {hasRealRating && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none">
              <span
                style={{
                  backgroundColor: ratingStats.colorHex,
                  color: ratingStats.colorInfo.tier === 'yellow' ? '#000000' : '#ffffff',
                  boxShadow: `0 0 10px ${ratingStats.colorHex}66`,
                }}
                className="font-semibold text-[11px] px-1.5 py-0.5 rounded leading-none shadow-md backdrop-blur-sm"
              >
                {ratingStats.scoreFormatted}
              </span>
            </div>
          )}
        </div>

        {/* Clean Direct Info Row on Mobile (Immediately Visible, No Drawer) */}
        <div className="pt-2 pb-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 cursor-pointer" onClick={handleCardClick}>
              <h3 className="font-heading font-semibold text-xs sm:text-sm text-white truncate group-hover:text-[#ff5c00] transition-colors">
                {project.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-normal pt-0.5">
                <span>{project.year}</span>
                <span>•</span>
                <span className="truncate">{primaryGenre}</span>
                <span>•</span>
                <span>{project.duration}</span>
              </div>
            </div>

            {/* Quick Action Buttons on Mobile */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(project);
                }}
                className="w-8 h-8 rounded-full bg-[#ff5c00] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                title="Смотреть"
              >
                <PlayIcon className="w-3.5 h-3.5 fill-white" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(project.id);
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center active:scale-90 transition-all cursor-pointer ${
                  isFavorite
                    ? 'border-[#ff5c00] bg-[#ff5c00] text-white'
                    : 'border-white/20 bg-white/5 text-zinc-300'
                }`}
                title={isFavorite ? 'Удалить из закладок' : 'В закладки'}
              >
                <svg
                  className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : 'fill-none stroke-current stroke-2'}`}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW (>= md): Floating Okko Card with Hover Drawer */}
      {/* ========================================================= */}
      <div className="hidden md:block relative aspect-video w-full group">
        <div
          onClick={handleCardClick}
          className="absolute top-0 left-0 w-full rounded-2xl overflow-hidden bg-[#16161c] border border-white/5 transition-all duration-300 ease-out origin-center group-hover:scale-110 group-hover:z-50 group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.95)] group-hover:border-white/20 group-hover:bg-[#191922] cursor-pointer"
        >
          {/* Poster Image Container */}
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

          {/* Hover Revealed Information Drawer (Okko layout) */}
          <div className="max-h-0 opacity-0 py-0 px-3.5 group-hover:max-h-36 group-hover:py-3 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden bg-[#191922] space-y-2.5 pointer-events-none group-hover:pointer-events-auto">
            {/* Metadata Row */}
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium whitespace-nowrap overflow-hidden">
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

              <span className="text-zinc-200">{project.year}</span>
              <span className="text-zinc-300 truncate max-w-[110px]">{primaryGenre}</span>
              <span className="text-zinc-400 shrink-0">{project.duration}</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-0.5">
              <Tooltip content="Смотреть" position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(project);
                  }}
                  className="w-9 h-9 rounded-full bg-[#ff5c00] hover:bg-[#e05200] text-white flex items-center justify-center shadow-lg shadow-[#ff5c00]/40 hover:scale-110 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                >
                  <PlayIcon className="w-3.5 h-3.5 fill-white" />
                </button>
              </Tooltip>

              <Tooltip content={isFavorite ? 'Удалить из закладок' : 'Добавить в закладки'} position="top">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(project.id);
                  }}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer ${
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

              <Tooltip content={isWatched ? 'Просмотрено (отменить)' : 'Отметить как просмотренное'} position="top">
                <button
                  onClick={handleToggleWatched}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer ${
                    isWatched
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
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

              <Tooltip content={isDisliked ? 'Не нравится (отменить)' : 'Не рекомендовать'} position="top">
                <button
                  onClick={handleToggleDislike}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer ${
                    isDisliked
                      ? 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
