import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import type { Project, Episode } from '../data/projects';
import { PlayIcon } from './PlayIcon';

interface OfmediaPlayerProps {
  project: Project;
  initialEpisode?: Episode;
  isOpen: boolean;
  onClose: () => void;
  onSelectNext?: () => void;
}

export type VideoQuality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | 'auto';

const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const QUALITY_STEPS: { id: VideoQuality; label: string }[] = [
  { id: '144p', label: '144p' },
  { id: '240p', label: '240p' },
  { id: '360p', label: '360p' },
  { id: '480p', label: '480p' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: 'auto', label: 'Авто' },
];

interface BufferedRange {
  startPct: number;
  widthPct: number;
}

const parseDurationToSeconds = (durStr?: string): number => {
  if (!durStr) return 0;
  const parts = durStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(durStr) || 0;
};

// Circular 10s Rewind SVG Icon
export const Rewind10Icon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4.5 A 7.5 7.5 0 1 0 19.5 12"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <polyline
      points="12 2 12 5 8.5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="14.4"
      textAnchor="middle"
      fontSize="6.8"
      fontWeight="800"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10
    </text>
  </svg>
);

// Circular 10s Forward SVG Icon
export const Forward10Icon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4.5 A 7.5 7.5 0 1 1 4.5 12"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <polyline
      points="12 2 12 5 15.5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="14.4"
      textAnchor="middle"
      fontSize="6.8"
      fontWeight="800"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10
    </text>
  </svg>
);

export const OfmediaPlayer: React.FC<OfmediaPlayerProps> = ({
  project,
  initialEpisode,
  isOpen,
  onClose,
  onSelectNext,
}) => {
  const currentEpisode: Episode = initialEpisode || (project.episodes && project.episodes.length > 0 ? project.episodes[0] : {
    id: project.id,
    number: 1,
    title: project.subtitle || project.title,
    duration: project.duration,
    thumbnail: project.poster,
    videoUrl: project.videoUrl,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const isDraggingScrubberRef = useRef(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([]);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [trackWidth, setTrackWidth] = useState<number>(800);

  // Storyboard Sprite Sheet Hover Frame Preview (Instant 60FPS scrubber thumbnails)
  const storyboardUrl = (currentEpisode as any).storyboard || project.storyboard || `/storyboards/${project.id}.webp`;
  const [isStoryboardLoaded, setIsStoryboardLoaded] = useState(false);

  useEffect(() => {
    if (!storyboardUrl) {
      setIsStoryboardLoaded(false);
      return;
    }
    const img = new Image();
    img.src = storyboardUrl;
    img.onload = () => setIsStoryboardLoaded(true);
    img.onerror = () => setIsStoryboardLoaded(false);
  }, [storyboardUrl]);

  // Toggle remaining time mode (-00:09 vs 00:25)
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  // Transient Pop Feedback on Toggle (Center Pop Animation)
  const [flashFeedback, setFlashFeedback] = useState<{ type: 'play' | 'pause'; id: number } | null>(null);

  // Quality & Speed Menus
  const [quality, setQuality] = useState<VideoQuality>('1080p');
  const [currentAutoHeight, setCurrentAutoHeight] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [qualityToast, setQualityToast] = useState<string | null>(null);

  const fallbackDuration = parseDurationToSeconds(currentEpisode.duration) || parseDurationToSeconds(project.duration) || 120;
  const effectiveDuration = duration > 0 ? duration : fallbackDuration;

  // Compute multi-range buffered data from HTML5 video element
  const updateBufferedRanges = (vid: HTMLVideoElement, dur: number) => {
    if (!dur || !vid.buffered) return;
    const ranges: BufferedRange[] = [];
    for (let i = 0; i < vid.buffered.length; i++) {
      const start = vid.buffered.start(i);
      const end = vid.buffered.end(i);
      ranges.push({
        startPct: (start / dur) * 100,
        widthPct: Math.max(0, ((end - start) / dur) * 100),
      });
    }
    setBufferedRanges(ranges);
  };

  // 60FPS Continuous Smooth Progress Update via requestAnimationFrame
  useEffect(() => {
    const updateSmoothProgress = () => {
      const video = videoRef.current;
      if (video && !isDraggingScrubberRef.current) {
        setCurrentTime(video.currentTime);
        if (effectiveDuration > 0) {
          updateBufferedRanges(video, effectiveDuration);
        }
      }
      if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(updateSmoothProgress);
      }
    };

    if (isPlaying) {
      rafIdRef.current = requestAnimationFrame(updateSmoothProgress);
    } else {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, effectiveDuration]);

  // Sync volume with video element reactively
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-play next episode when video ends
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const onEnded = () => {
      setIsPlaying(false);
      if (onSelectNext) {
        onSelectNext();
      }
    };

    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [isOpen, onSelectNext]);

  // Robust 3-Second Idle Auto-Hide on User Activity
  useEffect(() => {
    if (!isOpen) return;

    let timerId: number | null = null;

    const startIdleTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        setShowControls(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
      }, 3000);
    };

    const handleActivity = () => {
      setShowControls(true);
      startIdleTimer();
    };

    setShowControls(true);
    startIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'm':
          setIsMuted((m) => !m);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'escape':
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Direct GitHub CDN MP4 Streaming Engine (Zero Rutube, Zero Ads)
  useEffect(() => {
    if (!isOpen || !videoRef.current) return;
    const video = videoRef.current;

    // Clean up any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Direct HLS Adaptive Streaming via GitHub CDN (Fallback to direct MP4)
    const videoSrc = currentEpisode.videoUrl || project.videoUrl;
    if (videoSrc) {
      if (videoSrc.includes('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 60,
            maxBufferLength: 20,
            maxMaxBufferLength: 40,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 10,
          });
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });

          // Level Switch Tracking for live resolution UI badge
          hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
            if (hls.levels && hls.levels[data.level]) {
              setCurrentAutoHeight(hls.levels[data.level].height);
            }
          });

          // Self-Healing Network & Media Error Recovery
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('HLS Network Error, restarting load...', data.details);
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('HLS Media Error, recovering media...', data.details);
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Fatal unrecoverable HLS error:', data.details);
                  hls.destroy();
                  break;
              }
            } else if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
              // Automatically jump over micro-discontinuities between different resolutions
              if (video && !video.paused) {
                video.currentTime += 0.05;
                video.play().catch(() => {});
              }
            }
          });

          hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoSrc;
          video.play().catch(() => {});
        }
      } else {
        video.src = videoSrc;
        video.preload = 'auto';
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, project.id, currentEpisode.id, currentEpisode.videoUrl]);

  // Video Element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume;

    const onLoadedMetadata = () => {
      if (video.duration) {
        setDuration(video.duration);
        updateBufferedRanges(video, video.duration);
      }
    };

    const onProgress = () => {
      if (effectiveDuration > 0) {
        updateBufferedRanges(video, effectiveDuration);
      }
    };

    const onWaiting = () => {
      setIsBuffering(true);
    };

    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    // Track as watched
    try {
      const watched = localStorage.getItem('ofmedia_watched') || '[]';
      const list: string[] = JSON.parse(watched);
      if (!list.includes(project.id)) {
        list.push(project.id);
        localStorage.setItem('ofmedia_watched', JSON.stringify(list));
      }
    } catch {
      // ignore
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [currentEpisode.id, currentEpisode.videoUrl, project.id, effectiveDuration]);

  if (!isOpen) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setFlashFeedback({ type: 'play', id: Date.now() });
          })
          .catch((err) => {
            console.warn('Video play was prevented:', err);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setFlashFeedback({ type: 'pause', id: Date.now() });
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(effectiveDuration || 0, videoRef.current.currentTime + seconds)
    );
    setCurrentTime(videoRef.current.currentTime);
  };

  // Ultra-Smooth Drag & Click Seeking
  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !effectiveDuration) return;
    isDraggingScrubberRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    setTrackWidth(rect.width);
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * effectiveDuration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!videoRef.current || !effectiveDuration || !scrubberTrackRef.current) return;
      const trackRect = scrubberTrackRef.current.getBoundingClientRect();
      const movePos = Math.max(0, Math.min(1, (moveEvent.clientX - trackRect.left) / trackRect.width));
      const newTime = movePos * effectiveDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setHoverPos(moveEvent.clientX - trackRect.left);
      setHoverTime(newTime);
    };

    const onMouseUp = () => {
      isDraggingScrubberRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const totalDuration = duration > 0 ? duration : fallbackDuration;
    if (!totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTrackWidth(rect.width);
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * totalDuration;
    setHoverPos(e.clientX - rect.left);
    setHoverTime(targetTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const handleQualityChange = (newQuality: VideoQuality) => {
    setQuality(newQuality);
    const label = QUALITY_STEPS.find((q) => q.id === newQuality)?.label || newQuality;
    setQualityToast(`Качество: ${label}`);
    setTimeout(() => {
      setQualityToast(null);
    }, 1800);

    const hls = hlsRef.current;
    if (hls && hls.levels && hls.levels.length > 0) {
      if (newQuality === 'auto') {
        // Seamless ABR auto-selection without buffer flush or player stall
        hls.nextLevel = -1;
      } else {
        const targetHeight = parseInt(newQuality, 10);
        let chosenIdx = -1;

        // Try exact match first
        hls.levels.forEach((l, idx) => {
          if (l.height === targetHeight) {
            chosenIdx = idx;
          }
        });

        // Fallback to closest match
        if (chosenIdx === -1) {
          let minDiff = Infinity;
          hls.levels.forEach((l, idx) => {
            const diff = Math.abs(l.height - targetHeight);
            if (diff < minDiff) {
              minDiff = diff;
              chosenIdx = idx;
            }
          });
        }

        if (chosenIdx !== -1) {
          // nextLevel loads the next fragment at the target resolution without evicting current buffer
          hls.nextLevel = chosenIdx;
        }
      }
    }

    // Proactively prevent video freeze on level change
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
  const hoverPercent = effectiveDuration > 0 && hoverTime !== null ? (hoverTime / effectiveDuration) * 100 : null;

  const currentQualityLabel =
    quality === 'auto'
      ? currentAutoHeight
        ? `Авто (${currentAutoHeight}p)`
        : 'Авто'
      : QUALITY_STEPS.find((q) => q.id === quality)?.label || '1080p';

  // Glassmorphism button base class
  const glassBtnClass =
    'backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 text-zinc-100 hover:text-white transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow-lg shadow-black/20';

  // Speed index for slider
  const speedIndex = SPEED_STEPS.indexOf(speed) !== -1 ? SPEED_STEPS.indexOf(speed) : 2;
  const speedPercent = (speedIndex / (SPEED_STEPS.length - 1)) * 100;

  // Quality index for slider
  const qualityIndex = QUALITY_STEPS.findIndex((q) => q.id === quality) !== -1
    ? QUALITY_STEPS.findIndex((q) => q.id === quality)
    : 4;
  const qualityPercent = (qualityIndex / (QUALITY_STEPS.length - 1)) * 100;

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center select-none ${
        !showControls && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* HTML5 Video Source with HLS Stream & Dynamic Fallback */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Clean Minimal Buffering Spinner with Frosted Glow */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none z-10 animate-in fade-in duration-200">
          <div className="w-14 h-14 border-3 border-[#ff5c00]/30 border-t-[#ff5c00] rounded-full animate-spin shadow-[0_0_20px_rgba(255,92,0,0.5)]" />
        </div>
      )}

      {/* DYNAMIC QUALITY TOAST NOTIFICATION (Top Right) */}
      {qualityToast && (
        <div className="absolute top-20 right-6 z-30 px-3.5 py-1.5 rounded-full bg-[#0c0c12]/85 backdrop-blur-xl border border-white/20 text-xs font-semibold text-[#ff5c00] shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-2 duration-200">
          {qualityToast}
        </div>
      )}

      {/* DYNAMIC CENTER FLASH POP ANIMATION (Upon Play / Pause Toggle) */}
      {flashFeedback && (
        <div
          key={flashFeedback.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0c0c12]/85 backdrop-blur-2xl border-2 border-white/30 flex items-center justify-center text-white shadow-[0_0_45px_rgba(255,92,0,0.5)] animate-center-pop">
            {flashFeedback.type === 'play' ? (
              <PlayIcon className="w-9 h-9 fill-white" />
            ) : (
              <svg className="w-9 h-9 fill-white" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-all duration-300 z-20 ${
          showControls ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
            title="Закрыть плеер (Esc)"
          >
            ✕
          </button>

          <div className="flex flex-col justify-center">
            {project.titleLogo ? (
              <img
                src={project.titleLogo}
                alt={project.title}
                className="h-6 sm:h-8 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
              />
            ) : (
              <h2 className="font-heading font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
                {project.title}
              </h2>
            )}
            <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
              {currentEpisode.title && currentEpisode.title !== project.title ? `${currentEpisode.title} • ` : ''}{project.year}
            </div>
          </div>
        </div>

        {/* Next Episode Button if Series */}
        {project.isSeries && project.episodes && project.episodes.length > 1 && onSelectNext && (
          <button
            onClick={onSelectNext}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 ${glassBtnClass}`}
          >
            <span>Следующая серия</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* BOTTOM CONTROLS DOCK */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 z-20 ${
          showControls ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* SPEED POPOVER - FLOATING CLEANLY ABOVE TIMELINE */}
        {showSpeedMenu && (
          <div
            className="absolute right-4 sm:right-6 bottom-20 sm:bottom-24 bg-[#0e0e14]/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 min-w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-30 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200"
          >
            {/* Title & Badge */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-semibold text-zinc-200">
                Скорость
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#ff5c00]/25 text-[#ff5c00] border border-[#ff5c00]/40">
                {speed === 1 ? '1x' : `${speed}x`}
              </span>
            </div>

            {/* Interactive Stepped Slider Track with Full Native Swipe & Drag Support */}
            <div className="relative w-full py-1 mb-1">
              <div className="relative w-full h-2 bg-white/15 rounded-full">
                {/* Active Progress Fill */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff5c00] to-[#ff7a29] rounded-full shadow-[0_0_10px_rgba(255,92,0,0.8)] pointer-events-none"
                  style={{ width: `${speedPercent}%` }}
                />

                {/* Range Input for 100% native smooth swipe & drag */}
                <input
                  type="range"
                  min={0}
                  max={SPEED_STEPS.length - 1}
                  step={1}
                  value={speedIndex}
                  onChange={(e) => handleSpeedChange(SPEED_STEPS[parseInt(e.target.value)])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Stepped Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-[#ff5c00] shadow-[0_0_12px_rgba(255,92,0,1)] pointer-events-none transition-transform duration-100"
                  style={{ left: `${speedPercent}%` }}
                />
              </div>

              {/* Step Marks & Labels - Absolute Centered under each exact tick */}
              <div className="relative w-full h-5 mt-3">
                {SPEED_STEPS.map((s, i) => {
                  const pct = (i / (SPEED_STEPS.length - 1)) * 100;
                  return (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      style={{ left: `${pct}%` }}
                      className={`absolute top-0 -translate-x-1/2 text-[11px] font-medium transition-all duration-150 hover:scale-110 ${
                        speed === s
                          ? 'text-[#ff5c00] font-bold drop-shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s === 1 ? '1x' : `${s}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QUALITY POPOVER - FLOATING CLEANLY ABOVE TIMELINE */}
        {showQualityMenu && (
          <div
            className="absolute right-4 sm:right-6 bottom-20 sm:bottom-24 bg-[#0e0e14]/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 min-w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] z-30 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200"
          >
            {/* Title & Badge */}
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-semibold text-zinc-200">
                Качество
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#ff5c00]/25 text-[#ff5c00] border border-[#ff5c00]/40">
                {currentQualityLabel}
              </span>
            </div>

            {/* Interactive Stepped Slider Track with Full Native Swipe & Drag Support */}
            <div className="relative w-full py-1 mb-1">
              <div className="relative w-full h-2 bg-white/15 rounded-full">
                {/* Active Progress Fill */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff5c00] to-[#ff7a29] rounded-full shadow-[0_0_10px_rgba(255,92,0,0.8)] pointer-events-none"
                  style={{ width: `${qualityPercent}%` }}
                />

                {/* Range Input for 100% native smooth swipe & drag */}
                <input
                  type="range"
                  min={0}
                  max={QUALITY_STEPS.length - 1}
                  step={1}
                  value={qualityIndex}
                  onChange={(e) => handleQualityChange(QUALITY_STEPS[parseInt(e.target.value)].id)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Stepped Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 border-[#ff5c00] shadow-[0_0_12px_rgba(255,92,0,1)] pointer-events-none transition-transform duration-100"
                  style={{ left: `${qualityPercent}%` }}
                />
              </div>

              {/* Step Marks & Labels - Absolute Centered under each exact tick */}
              <div className="relative w-full h-5 mt-3">
                {QUALITY_STEPS.map((q, i) => {
                  const pct = (i / (QUALITY_STEPS.length - 1)) * 100;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQualityChange(q.id)}
                      style={{ left: `${pct}%` }}
                      className={`absolute top-0 -translate-x-1/2 text-[10px] font-medium transition-all duration-150 hover:scale-110 ${
                        quality === q.id
                          ? 'text-[#ff5c00] font-bold drop-shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 1. SCRUBBER TIMELINE */}
        <div
          ref={scrubberTrackRef}
          onMouseDown={handleSeekStart}
          onMouseMove={handleSeekHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-7 flex items-center cursor-pointer group/scrub mb-2 sm:mb-3"
        >
          {/* Rich Floating Video Frame Preview Card with Timecode */}
          {hoverTime !== null && (() => {
            const hoverFrac = effectiveDuration > 0 ? Math.max(0, Math.min(0.999, hoverTime / effectiveDuration)) : 0;
            const frameIdx = Math.floor(hoverFrac * 100);
            const col = frameIdx % 10;
            const row = Math.floor(frameIdx / 10);
            const bgPosX = (col / 9) * 100;
            const bgPosY = (row / 9) * 100;

            return (
              <div
                className="absolute -top-[128px] -translate-x-1/2 w-44 rounded-xl overflow-hidden bg-[#0c0c12]/92 backdrop-blur-2xl border border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] pointer-events-none p-1 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150 z-30"
                style={{
                  left: `${Math.max(90, Math.min(trackWidth - 90, hoverPos))}px`,
                }}
              >
                <div className="w-full h-24 rounded-lg overflow-hidden bg-black/90 relative flex items-center justify-center border border-white/10">
                  {isStoryboardLoaded ? (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${storyboardUrl})`,
                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                        backgroundSize: '1000% 1000%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  ) : (
                    <img
                      src={currentEpisode.thumbnail || project.poster}
                      alt="Превью кадра"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-1 text-[11px] font-bold text-white tracking-wider px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15">
                  {formatTime(hoverTime)}
                </div>
              </div>
            );
          })()}

          {/* Background Track with overflow-hidden for crisp pill contour */}
          <div className="relative w-full h-1.5 group-hover/scrub:h-2 rounded-full bg-white/15 overflow-hidden transition-[height] duration-150">
            {/* Multi-Segment Buffered Bars */}
            {bufferedRanges.map((range, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 bg-white/30"
                style={{
                  left: `${range.startPct}%`,
                  width: `${range.widthPct}%`,
                }}
              />
            ))}

            {/* Ghost Hover Highlight Bar expanding smoothly to cursor */}
            {hoverPercent !== null && (
              <div
                className="absolute top-0 bottom-0 left-0 bg-white/25 pointer-events-none"
                style={{ width: `${hoverPercent}%` }}
              />
            )}

            {/* Played Progress Bar with Orange Glow - Instant 60FPS sync */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff5c00] to-[#ff7a29] shadow-[0_0_12px_rgba(255,92,0,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Ghost Hover Knob following the cursor along the track */}
          {hoverPercent !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white/80 border border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.7)] pointer-events-none"
              style={{ left: `${hoverPercent}%` }}
            />
          )}

          {/* Interactive Active Scrubber Thumb - Centered exactly on the tip with ZERO lag */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 group-hover/scrub:w-4.5 group-hover/scrub:h-4.5 rounded-full bg-white border-2 border-[#ff5c00] shadow-[0_0_12px_rgba(255,92,0,1)] pointer-events-none transition-[width,height] duration-150 ease-out"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* 2. CONTROLS BAR */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 text-zinc-100">
          {/* Left Controls: Play, Skip 10s SVGs, Unified Volume Capsule, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
              title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <PlayIcon className="w-4 h-4 fill-current" />
              )}
            </button>

            {/* Skip -10s with SVG Circular Arrow */}
            <button
              onClick={() => skip(-10)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
              title="Назад на 10 сек (←)"
            >
              <Rewind10Icon className="w-5 h-5 text-zinc-100 hover:text-white" />
            </button>

            {/* Skip +10s with SVG Circular Arrow */}
            <button
              onClick={() => skip(10)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
              title="Вперёд на 10 сек (→)"
            >
              <Forward10Icon className="w-5 h-5 text-zinc-100 hover:text-white" />
            </button>

            {/* Volume Control Unified Frosted Glass Capsule */}
            <div className="flex items-center h-10 px-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-200 gap-2.5 shadow-lg shadow-black/20 group/volume">
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="w-5 h-5 flex items-center justify-center text-zinc-100 hover:text-white transition-transform active:scale-90"
                title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume > 0.5 ? (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                )}
              </button>

              {/* Volume Track inside Unified Capsule */}
              <div className="relative w-16 sm:w-20 h-5 flex items-center cursor-pointer">
                {/* Background Track */}
                <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden relative pointer-events-none">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff5c00] to-[#ff7a29] rounded-full shadow-[0_0_8px_rgba(255,92,0,0.8)]"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>

                {/* Range Input for full mouse dragging support */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {/* Centered Thumb Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#ff5c00] shadow-[0_0_8px_rgba(255,92,0,1)] pointer-events-none transition-transform duration-100 group-hover/volume:scale-110"
                  style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {/* Time Stamp (Click to switch current / remaining time) */}
            <button
              onClick={() => setShowRemainingTime((r) => !r)}
              className="text-xs font-medium text-zinc-300 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
              title="Нажмите для переключения формата времени"
            >
              {showRemainingTime ? (
                <span>
                  -{formatTime(Math.max(0, effectiveDuration - currentTime))}
                  <span className="text-zinc-500 ml-1">/ {formatTime(effectiveDuration)}</span>
                </span>
              ) : (
                <span>
                  {formatTime(currentTime)}
                  <span className="text-zinc-500 mx-1">/</span>
                  {formatTime(effectiveDuration)}
                </span>
              )}
            </button>
          </div>

          {/* Right Controls: Quality Slider, Speed Slider, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Button */}
            <button
              onClick={() => {
                setShowSpeedMenu((s) => !s);
                setShowQualityMenu(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${glassBtnClass} ${
                showSpeedMenu ? 'bg-white/25 border-white/40 text-white' : ''
              }`}
              title="Скорость воспроизведения"
            >
              {speed === 1 ? '1x' : `${speed}x`}
            </button>

            {/* Quality Button */}
            <button
              onClick={() => {
                setShowQualityMenu((q) => !q);
                setShowSpeedMenu(false);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${glassBtnClass} ${
                showQualityMenu ? 'bg-white/25 border-white/40 text-white' : ''
              }`}
              title="Качество видео"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              <span>{currentQualityLabel}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
              title={isFullscreen ? 'Выйти из полноэкранного режима (F)' : 'Полноэкранный режим (F)'}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
