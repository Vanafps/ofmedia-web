import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import type { Project, Episode } from '../data/projects';
import { saveWatchProgress, getWatchProgress } from '../services/watchHistoryService';
import { isMobileApp } from '../services/platform';
import { SpeakerVolumeIcon } from './SpeakerVolumeIcon';

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
  { id: '144p', label: 'Эко' },
  { id: '240p', label: 'LD' },
  { id: '360p', label: 'LQ' },
  { id: '480p', label: 'SD' },
  { id: '720p', label: 'HD' },
  { id: '1080p', label: 'FHD' },
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

// Modern Geometric Play SVG Icon - Optically Centered
export const ModernPlayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 6.2c0-.95 1.05-1.53 1.85-1.02l10.2 6.3c.78.48.78 1.56 0 2.04l-10.2 6.3c-.8.5-1.85-.07-1.85-1.02V6.2z" />
  </svg>
);

// Picture-in-Picture Icon
export const PipIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <rect x="12" y="11" width="8" height="7" rx="1.5" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

// Modern Geometric Pause SVG Icon
export const PauseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1.5" />
    <rect x="14" y="4" width="4" height="16" rx="1.5" />
  </svg>
);

// Pure Vector Circular 10s Rewind SVG Icon (High contrast, no system text dependency)
export const Rewind10Icon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* High-visibility counter-clockwise circular arc */}
    <path
      d="M12.5 4.5A7.5 7.5 0 1 0 20 12"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    {/* Directional arrowhead */}
    <path
      d="M13 1.8L8.5 4.5l4.5 2.7V1.8z"
      fill="currentColor"
    />
    {/* Vector '1' */}
    <path
      d="M9.6 11.2L11 10.3v5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Vector '0' */}
    <rect
      x="12.8"
      y="10.3"
      width="3.4"
      height="5.5"
      rx="1.7"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </svg>
);

// Pure Vector Circular 10s Forward SVG Icon (High contrast, no system text dependency)
export const Forward10Icon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {/* High-visibility clockwise circular arc */}
    <path
      d="M11.5 4.5A7.5 7.5 0 1 1 4 12"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    {/* Directional arrowhead */}
    <path
      d="M11 1.8l4.5 2.7-4.5 2.7V1.8z"
      fill="currentColor"
    />
    {/* Vector '1' */}
    <path
      d="M8.6 11.2L10 10.3v5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Vector '0' */}
    <rect
      x="11.8"
      y="10.3"
      width="3.4"
      height="5.5"
      rx="1.7"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </svg>
);

// Okko Hexagon Settings Nut Icon
export const OkkoSettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.5l8 4.62v9.24L12 21L4 16.36V7.12L12 2.5zm0 6.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);

// Monitor / Display SVG Icon for Video Quality
export const MonitorIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// Microphone SVG Icon for Audio
export const MicIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// Subtitles Rectangular SVG Icon
export const SubtitlesIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <line x1="6" y1="10" x2="11" y2="10" />
    <line x1="13" y1="10" x2="18" y2="10" />
    <line x1="6" y1="14" x2="14" y2="14" />
    <line x1="16" y1="14" x2="18" y2="14" />
  </svg>
);

// Speedometer Gauge SVG Icon
export const SpeedometerIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4a8 8 0 0 0-8 8c0 2.2.9 4.2 2.3 5.7" />
    <path d="M12 4a8 8 0 0 1 8 8c0 2.2-.9 4.2-2.3 5.7" />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
    <line x1="12" y1="14" x2="16" y2="9" />
  </svg>
);

export { SpeakerVolumeIcon } from './SpeakerVolumeIcon';

// Fullscreen Expand / Compress SVG Icon
export const ModernFullscreenIcon: React.FC<{ isFullscreen: boolean; className?: string }> = ({ isFullscreen, className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {isFullscreen ? (
      <>
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </>
    ) : (
      <>
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </>
    )}
  </svg>
);

// Elastic Active Checkmark Icon with Bounce Pop Animation
const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-[#ff5c00]' }) => (
  <svg className={`${className} animate-check-pop`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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

  // Gesture & PiP States
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{
    side: 'left' | 'right';
    count: number;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; side: 'left' | 'right' }>({ time: 0, x: 0, side: 'left' });
  const doubleTapTimerRef = useRef<any>(null);
  const singleTapTimerRef = useRef<any>(null);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

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

  // Screen Wake Lock API (keeps mobile screen awake during movie playback)
  useEffect(() => {
    let wakeLockSentinel: any = null;
    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isPlaying && document.visibilityState === 'visible') {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // WakeLock unsupported or rejected
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && isMounted) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Toggle remaining time mode (-00:09 vs 00:25)
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  // Transient Pop Feedback on Toggle (Center Pop Animation)
  const [flashFeedback, setFlashFeedback] = useState<{ type: 'play' | 'pause'; id: number } | null>(null);

  // Quality & Speed & Settings Menus (Okko style)
  const [quality, setQuality] = useState<VideoQuality>('1080p');
  const [currentAutoHeight, setCurrentAutoHeight] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'quality' | 'speed' | 'audio' | 'subtitles'>('main');
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>(
    project.audioTracks?.[0] || '1. Русский'
  );
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
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
        setShowSettingsMenu(false);
        setSettingsSubView('main');
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

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
      } else if ((video as any).webkitSetPresentationMode) {
        const currentMode = (video as any).webkitPresentationMode;
        (video as any).webkitSetPresentationMode(currentMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
        setIsPipActive(currentMode !== 'picture-in-picture');
      }
    } catch (err) {
      console.warn('Picture in picture error:', err);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const isCurrentlyFs = Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      isFullscreen
    );

    try {
      if (!isCurrentlyFs) {
        try {
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            await (container as any).webkitRequestFullscreen();
          } else if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        } catch (domFsErr) {
          console.warn('DOM requestFullscreen handled:', domFsErr);
        }

        if ((window as any)?.AndroidScreen?.enterFullscreen) {
          try {
            (window as any).AndroidScreen.enterFullscreen();
          } catch {}
        }

        try {
          (window.screen?.orientation as any)?.lock?.('landscape')?.catch?.(() => {});
        } catch {}

        if (isMobileApp()) {
          try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.hide();
          } catch {}
        }
        setIsFullscreen(true);
      } else {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        } catch (exitFsErr) {
          console.warn('DOM exitFullscreen handled:', exitFsErr);
        }

        if ((window as any)?.AndroidScreen?.exitFullscreen) {
          try {
            (window as any).AndroidScreen.exitFullscreen();
          } catch {}
        }

        try {
          (window.screen?.orientation as any)?.unlock?.();
        } catch {}

        if (isMobileApp()) {
          try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.show();
          } catch {}
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle error:', e);
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleScreenClick = (e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e
      ? ((e as React.TouchEvent).touches[0] || (e as any).changedTouches?.[0])?.clientX
      : (e as React.MouseEvent).clientX;
    if (clientX === undefined) return;

    const side = clientX < rect.left + rect.width / 2 ? 'left' : 'right';
    const now = Date.now();

    if (now - lastTapRef.current.time < 320 && lastTapRef.current.side === side) {
      // Double Tap detected: skip 10s and cancel single-click play/pause
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);

      if (side === 'left') {
        skip(-10);
      } else {
        skip(10);
      }

      setDoubleTapFeedback((prev) => ({
        side,
        count: prev && prev.side === side ? prev.count + 10 : 10,
      }));

      doubleTapTimerRef.current = setTimeout(() => {
        setDoubleTapFeedback(null);
      }, 700);

      lastTapRef.current = { time: 0, x: clientX, side };
    } else {
      lastTapRef.current = { time: now, x: clientX, side };
      // Single tap: toggle Play/Pause and show controls after delay if not followed by second tap
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        togglePlay();
        setShowControls(true);
      }, 260);
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

  const getQualityBadge = (h: number): string => {
    if (h >= 1080) return 'FHD';
    if (h >= 720) return 'HD';
    if (h >= 480) return 'SD';
    if (h >= 360) return 'LQ';
    return 'LD';
  };

  const currentQualityLabel =
    quality === 'auto'
      ? currentAutoHeight
        ? `Авто (${getQualityBadge(currentAutoHeight)})`
        : 'Авто'
      : QUALITY_STEPS.find((q) => q.id === quality)?.label || 'FHD';

  // Glassmorphism button base class
  const glassBtnClass =
    'backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 text-zinc-100 hover:text-white transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow-lg shadow-black/20';

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
            backBufferLength: 30,
            maxBufferLength: 60,
            maxMaxBufferLength: 90,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 10,
          });
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          let hasRestored = false;
          const tryRestore = () => {
            if (!hasRestored && video) {
              const saved = getWatchProgress(project.id);
              if (saved && saved.currentTime > 5) {
                video.currentTime = saved.currentTime;
                setCurrentTime(saved.currentTime);
              }
              hasRestored = true;
            }
          };

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            tryRestore();
            video.play().catch(() => {});
          });

          video.addEventListener('loadedmetadata', tryRestore, { once: true });

          // Level Switch Tracking for live resolution UI badge
          hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
            if (hls.levels && hls.levels[data.level]) {
              setCurrentAutoHeight(hls.levels[data.level].height);
            }
          });

          // Dynamically sync exact HLS stream duration from playlist manifest
          hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
            if (data.details && data.details.totalduration && isFinite(data.details.totalduration)) {
              setDuration(data.details.totalduration);
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
          const saved = getWatchProgress(project.id);
          if (saved && saved.currentTime > 5) {
            video.currentTime = saved.currentTime;
            setCurrentTime(saved.currentTime);
          }
          video.play().catch(() => {});
        }
      } else {
        video.src = videoSrc;
        video.preload = 'auto';
        const saved = getWatchProgress(project.id);
        if (saved && saved.currentTime > 5) {
          video.currentTime = saved.currentTime;
          setCurrentTime(saved.currentTime);
        }
        video.play().catch(() => {});
      }
    }

    const saveInterval = setInterval(() => {
      if (video && !video.paused && video.duration > 0) {
        saveWatchProgress(project.id, video.currentTime, video.duration);
      }
    }, 2000);

    return () => {
      clearInterval(saveInterval);
      if (video && video.duration > 0) {
        saveWatchProgress(project.id, video.currentTime, video.duration);
      }
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

    const onLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        updateBufferedRanges(video, video.duration);
      }
    };

    const onDurationChange = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
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
    video.addEventListener('durationchange', onDurationChange);
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
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [currentEpisode.id, currentEpisode.videoUrl, project.id, effectiveDuration]);

  // Fullscreen and Picture-in-Picture event listeners
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const hasDocPip = 'pictureInPictureEnabled' in document && Boolean((document as any).pictureInPictureEnabled);
      const video = videoRef.current;
      const hasVideoPip = video && typeof (video as any).requestPictureInPicture === 'function';
      const hasWebkitPip = video && typeof (video as any).webkitSupportsPresentationMode === 'function';
      setIsPipSupported(Boolean(hasDocPip || hasVideoPip || hasWebkitPip || isMobileApp()));
    }

    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if ((window as any)?.AndroidScreen?.exitFullscreen) {
        try {
          (window as any).AndroidScreen.exitFullscreen();
        } catch {}
      }
      try {
        (window.screen?.orientation as any)?.unlock?.();
      } catch {}
    };
  }, []);

  // Keep playback rate synced across episode changes and video reloads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, currentEpisode.id, currentEpisode.videoUrl]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleScreenClick}
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

      {/* DOUBLE TAP SEEK FEEDBACK OVERLAYS - CINEMATIC SOFT GRADIENT (NO HARD BLACK BARS) */}
      {doubleTapFeedback && (
        <div
          className={`absolute top-0 bottom-0 ${
            doubleTapFeedback.side === 'left'
              ? 'left-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent'
              : 'right-0 bg-gradient-to-l from-black/85 via-black/40 to-transparent'
          } w-1/2 sm:w-2/5 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-300`}
        >
          <div className="flex flex-col items-center gap-3 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#101012]/85 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(255,92,0,0.4)] animate-pulse">
              {doubleTapFeedback.side === 'left' ? (
                <Rewind10Icon className="w-9 h-9 text-[#ff5c00]" />
              ) : (
                <Forward10Icon className="w-9 h-9 text-[#ff5c00]" />
              )}
            </div>
            <span className="text-base sm:text-lg font-heading font-bold tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {doubleTapFeedback.side === 'left' ? `-${doubleTapFeedback.count} сек` : `+${doubleTapFeedback.count} сек`}
            </span>
          </div>
        </div>
      )}

      {/* DYNAMIC QUALITY TOAST NOTIFICATION (Top Right) */}
      {qualityToast && (
        <div className="absolute top-20 right-6 z-30 px-3.5 py-1.5 rounded-full bg-[#101012]/90 backdrop-blur-xl border border-white/15 text-xs font-semibold text-[#ff5c00] shadow-[0_8px_24px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-200">
          {qualityToast}
        </div>
      )}

      {/* DYNAMIC CENTER FLASH POP ANIMATION (Upon Play / Pause Toggle) */}
      {flashFeedback && (
        <div
          key={flashFeedback.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#101012]/90 backdrop-blur-2xl border-2 border-white/25 flex items-center justify-center text-white shadow-[0_0_45px_rgba(255,92,0,0.5)] animate-center-pop">
            {flashFeedback.type === 'play' ? (
              <ModernPlayIcon className="w-10 h-10 text-white" />
            ) : (
              <PauseIcon className="w-10 h-10 text-white" />
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-all duration-300 z-20 ${
          showControls ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${glassBtnClass}`}
            title="Закрыть плеер (Esc)"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 z-20 ${
          showControls ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* OKKO SETTINGS POPOVER (Positioned directly above the Settings button) */}
        {showSettingsMenu && (
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="absolute left-2 sm:left-6 bottom-16 sm:bottom-24 bg-[#101012]/98 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-3xl p-3 sm:p-4 w-[280px] sm:w-[320px] max-h-[min(340px,calc(100dvh-5.5rem))] overflow-y-auto custom-scrollbar shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(255,92,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] z-30 animate-settings-pop text-white transition-all"
          >
            {settingsSubView === 'main' && (
              <div className="flex flex-col py-1 space-y-1 animate-settings-slide-back">
                {/* 1. Качество */}
                <button
                  type="button"
                  onClick={() => setSettingsSubView('quality')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/12 active:scale-[0.98] transition-all duration-150 text-left group/row cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <MonitorIcon className="w-4 h-4 text-zinc-300 group-hover/row:text-white transition-colors" />
                    <span className="text-xs sm:text-sm font-medium text-white">Качество</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 group-hover/row:text-white transition-colors">
                    <span>{currentQualityLabel}</span>
                    <span className="text-zinc-500 group-hover/row:text-zinc-300 font-bold transition-transform group-hover/row:translate-x-0.5 duration-150">›</span>
                  </div>
                </button>

                {/* 2. Звук (низкоконтрастный текст если нет вариаций как в Okko) */}
                {(!project.audioTracks || project.audioTracks.length <= 1) ? (
                  <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-default opacity-80 select-none">
                    <div className="flex items-center gap-3">
                      <MicIcon className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs sm:text-sm font-medium text-zinc-300">Звук</span>
                    </div>
                    <div className="text-xs font-normal text-zinc-500">
                      {project.audioTracks?.[0] || '1. Русский'}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('audio')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/12 active:scale-[0.98] transition-all duration-150 text-left group/row cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MicIcon className="w-4 h-4 text-zinc-300 group-hover/row:text-white transition-colors" />
                      <span className="text-xs sm:text-sm font-medium text-white">Звук</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 group-hover/row:text-white transition-colors">
                      <span>{selectedAudioTrack}</span>
                      <span className="text-zinc-500 group-hover/row:text-zinc-300 font-bold transition-transform group-hover/row:translate-x-0.5 duration-150">›</span>
                    </div>
                  </button>
                )}

                {/* 3. Субтитры (низкоконтрастный текст если нет вариаций как в Okko) */}
                {(!project.subtitles || project.subtitles.length === 0) ? (
                  <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-default opacity-80 select-none">
                    <div className="flex items-center gap-3">
                      <SubtitlesIcon className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs sm:text-sm font-medium text-zinc-300">Субтитры</span>
                    </div>
                    <div className="text-xs font-normal text-zinc-500">
                      Без субтитров
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('subtitles')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/12 active:scale-[0.98] transition-all duration-150 text-left group/row cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <SubtitlesIcon className="w-4 h-4 text-zinc-300 group-hover/row:text-white transition-colors" />
                      <span className="text-xs sm:text-sm font-medium text-white">Субтитры</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 group-hover/row:text-white transition-colors">
                      <span>{selectedSubtitle === 'off' ? 'Без субтитров' : selectedSubtitle}</span>
                      <span className="text-zinc-500 group-hover/row:text-zinc-300 font-bold transition-transform group-hover/row:translate-x-0.5 duration-150">›</span>
                    </div>
                  </button>
                )}

                {/* 4. Скорость */}
                <button
                  type="button"
                  onClick={() => setSettingsSubView('speed')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/12 active:scale-[0.98] transition-all duration-150 text-left group/row cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <SpeedometerIcon className="w-4 h-4 text-zinc-300 group-hover/row:text-white transition-colors" />
                    <span className="text-xs sm:text-sm font-medium text-white">Скорость</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 group-hover/row:text-white transition-colors">
                    <span>{speed === 1 ? '1x' : `${speed}x`}</span>
                    <span className="text-zinc-500 group-hover/row:text-zinc-300 font-bold transition-transform group-hover/row:translate-x-0.5 duration-150">›</span>
                  </div>
                </button>
              </div>
            )}

            {/* Quality Submenu - Classic Vertical List with Sliding Transition */}
            {settingsSubView === 'quality' && (
              <div className="flex flex-col animate-settings-slide-in">
                <div className="flex items-center gap-2 pb-2 mb-1.5 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('main')}
                    className="p-1 -ml-1 rounded-lg hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                    title="Назад"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-white">Качество</span>
                </div>
                <div
                  data-lenis-prevent="true"
                  onWheel={(e) => e.stopPropagation()}
                  className="flex flex-col space-y-0.5 max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar pr-1 overscroll-contain"
                >
                  {QUALITY_STEPS.map((q) => {
                    const isSelected = quality === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          handleQualityChange(q.id);
                          setSettingsSubView('main');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff5c00]/25 text-white font-semibold shadow-[0_0_18px_rgba(255,92,0,0.25)] border border-[#ff5c00]/30'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{q.label}</span>
                          <span className="text-[10px] text-zinc-400">
                            {q.id === '1080p' ? '(1080p)' : q.id === '720p' ? '(720p)' : q.id === '480p' ? '(480p)' : q.id === '360p' ? '(360p)' : q.id === '240p' ? '(240p)' : q.id === '144p' ? '(144p)' : ''}
                          </span>
                        </div>
                        {isSelected && <CheckIcon className="w-4 h-4 text-[#ff5c00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Speed Submenu - Classic Vertical List with Sliding Transition */}
            {settingsSubView === 'speed' && (
              <div className="flex flex-col animate-settings-slide-in">
                <div className="flex items-center gap-2 pb-2 mb-1.5 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('main')}
                    className="p-1 -ml-1 rounded-lg hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                    title="Назад"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-white">Скорость</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  {SPEED_STEPS.map((s) => {
                    const isSelected = speed === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          handleSpeedChange(s);
                          setSettingsSubView('main');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff5c00]/25 text-white font-semibold shadow-[0_0_18px_rgba(255,92,0,0.25)] border border-[#ff5c00]/30'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                        }`}
                      >
                        <span>{s === 1 ? '1x (Обычная)' : `${s}x`}</span>
                        {isSelected && <CheckIcon className="w-4 h-4 text-[#ff5c00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audio Submenu if multiple */}
            {settingsSubView === 'audio' && (
              <div className="flex flex-col animate-settings-slide-in">
                <div className="flex items-center gap-2 pb-2 mb-1.5 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('main')}
                    className="p-1 -ml-1 rounded-lg hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                    title="Назад"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-white">Звук</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  {(project.audioTracks || ['1. Русский']).map((track) => {
                    const isSelected = selectedAudioTrack === track;
                    return (
                      <button
                        key={track}
                        type="button"
                        onClick={() => {
                          setSelectedAudioTrack(track);
                          setSettingsSubView('main');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff5c00]/25 text-white font-semibold shadow-[0_0_18px_rgba(255,92,0,0.25)] border border-[#ff5c00]/30'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                        }`}
                      >
                        <span>{track}</span>
                        {isSelected && <CheckIcon className="w-4 h-4 text-[#ff5c00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subtitles Submenu */}
            {settingsSubView === 'subtitles' && (
              <div className="flex flex-col animate-settings-slide-in">
                <div className="flex items-center gap-2 pb-2 mb-1.5 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setSettingsSubView('main')}
                    className="p-1 -ml-1 rounded-lg hover:bg-white/12 text-zinc-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                    title="Назад"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-xs sm:text-sm font-semibold text-white">Субтитры</span>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubtitle('off');
                      setSettingsSubView('main');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                      selectedSubtitle === 'off'
                        ? 'bg-[#ff5c00]/25 text-white font-semibold shadow-[0_0_18px_rgba(255,92,0,0.25)] border border-[#ff5c00]/30'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                    }`}
                  >
                    <span>Отключены</span>
                    {selectedSubtitle === 'off' && <CheckIcon className="w-4 h-4 text-[#ff5c00]" />}
                  </button>
                  {(project.subtitles || []).map((sub: string) => {
                    const isSelected = selectedSubtitle === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSelectedSubtitle(sub);
                          setSettingsSubView('main');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff5c00]/25 text-white font-semibold shadow-[0_0_18px_rgba(255,92,0,0.25)] border border-[#ff5c00]/30'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                        }`}
                      >
                        <span>{sub}</span>
                        {isSelected && <CheckIcon className="w-4 h-4 text-[#ff5c00]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                className="absolute -top-[132px] -translate-x-1/2 w-44 rounded-2xl overflow-hidden bg-black/45 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.25)] pointer-events-none p-1.5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150 z-30"
                style={{
                  left: `${Math.max(90, Math.min(trackWidth - 90, hoverPos))}px`,
                }}
              >
                <div className="w-full h-24 rounded-xl overflow-hidden bg-black/50 relative flex items-center justify-center border border-white/10 shadow-inner">
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
                {/* Clean timecode without rectangular dark background box */}
                <span className="pt-1.5 pb-0.5 text-xs font-heading font-semibold text-white tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] select-none">
                  {formatTime(hoverTime)}
                </span>
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
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 text-zinc-100 min-w-0">
          {/* Left Controls: Play, Skip 10s SVGs, Okko Settings Button, Time */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-visible py-1">
            {/* Play/Pause Button - Optically Centered with Spring Scale Interaction */}
            <button
              onClick={togglePlay}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer active:scale-95 hover:scale-105 transition-transform duration-150 shrink-0 ${glassBtnClass}`}
              title={isPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)'}
            >
              {isPlaying ? (
                <PauseIcon className="w-4 h-4 text-white" />
              ) : (
                <ModernPlayIcon className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Skip -10s with Interactive Rotation Micro-Animation */}
            <button
              onClick={() => skip(-10)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer active:scale-95 active:-rotate-15 hover:scale-105 transition-all duration-150 shrink-0 ${glassBtnClass} group/rewind`}
              title="Назад на 10 сек (←)"
            >
              <Rewind10Icon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 group-hover/rewind:text-white transition-colors" />
            </button>

            {/* Skip +10s with Interactive Rotation Micro-Animation */}
            <button
              onClick={() => skip(10)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer active:scale-95 active:rotate-15 hover:scale-105 transition-all duration-150 shrink-0 ${glassBtnClass} group/forward`}
              title="Вперёд на 10 сек (→)"
            >
              <Forward10Icon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-100 group-hover/forward:text-white transition-colors" />
            </button>

            {/* Unified Okko Settings Button [ Settings ] with 90deg Rotation Transition */}
            <button
              onClick={() => {
                setShowSettingsMenu((prev) => !prev);
                setSettingsSubView('main');
              }}
              className={`h-8 sm:h-10 px-2 sm:px-3.5 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-95 shrink-0 ${
                showSettingsMenu
                  ? 'bg-white/25 border border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.25)] ring-2 ring-white/20'
                  : glassBtnClass
              }`}
              title="Настройки плеера"
            >
              <span className={`inline-flex transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : 'rotate-0'}`}>
                {showSettingsMenu ? (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <OkkoSettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-200" />
                )}
              </span>
              <span className="hidden sm:inline">Настройки</span>
            </button>

            {/* Time Stamp (Click to switch current / remaining time) */}
            <button
              onClick={() => setShowRemainingTime((r) => !r)}
              className="text-[11px] sm:text-xs font-medium text-zinc-300 hover:text-white px-1.5 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Нажмите для переключения формата времени"
            >
              {showRemainingTime ? (
                <span>
                  -{formatTime(Math.max(0, effectiveDuration - currentTime))}
                  <span className="text-zinc-500 ml-1 hidden xs:inline">/ {formatTime(effectiveDuration)}</span>
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

          {/* Right Controls: Volume Capsule, PiP, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Volume Control Unified Frosted Glass Capsule */}
            <div className="flex items-center h-8 sm:h-10 w-8 sm:w-auto justify-center px-0 sm:px-3 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-200 gap-0 sm:gap-2.5 shadow-lg shadow-black/20 group/volume">
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-zinc-100 hover:text-white transition-transform active:scale-85 cursor-pointer"
                title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'}
              >
                <SpeakerVolumeIcon isMuted={isMuted} volume={volume} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>

              {/* Volume Track inside Unified Capsule - hidden on mobile so PiP and Fullscreen buttons fit */}
              <div className="hidden sm:flex relative w-12 sm:w-20 h-4 sm:h-5 items-center cursor-pointer">
                {/* Background Track */}
                <div className="w-full h-1 sm:h-1.5 rounded-full bg-white/20 overflow-hidden relative pointer-events-none">
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
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-[#ff5c00] sm:border-2 shadow-[0_0_8px_rgba(255,92,0,1)] pointer-events-none transition-transform duration-100 group-hover/volume:scale-110"
                  style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {/* Picture-in-Picture Button */}
            {isPipSupported && (
              <button
                onClick={togglePictureInPicture}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 transition-all duration-150 ${glassBtnClass} ${
                  isPipActive ? 'bg-[#ff5c00]/30 border-[#ff5c00]' : ''
                }`}
                title={isPipActive ? 'Вернуть видео в окно' : 'Картинка в картинке (PiP)'}
              >
                <PipIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>
            )}

            {/* Modern Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer active:scale-90 hover:scale-105 transition-all duration-150 ${glassBtnClass}`}
              title={isFullscreen ? 'Выйти из полноэкранного режима (F)' : 'Полноэкранный режим (F)'}
            >
              <ModernFullscreenIcon isFullscreen={isFullscreen} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
