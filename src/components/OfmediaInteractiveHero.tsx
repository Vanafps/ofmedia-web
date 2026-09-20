import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Project } from '../data/projects';
import { PlayIcon } from './PlayIcon';

interface OfmediaInteractiveHeroProps {
  projects: Project[];
  onOpenDetails: (project: Project) => void;
  onPlay: (project: Project) => void;
  onScrollToCatalog?: () => void;
  onOpenAuth?: () => void;
}

export const OfmediaInteractiveHero: React.FC<OfmediaInteractiveHeroProps> = ({
  projects,
  onOpenDetails,
  onPlay,
  onScrollToCatalog,
  onOpenAuth,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lerpPos, setLerpPos] = useState({ x: 0, y: 0 });

  // Smooth mouse parallax lerp loop
  useEffect(() => {
    let animId: number;
    const updateLerp = () => {
      setLerpPos((prev) => ({
        x: prev.x + (mousePos.x - prev.x) * 0.08,
        y: prev.y + (mousePos.y - prev.y) * 0.08,
      }));
      animId = requestAnimationFrame(updateLerp);
    };
    animId = requestAnimationFrame(updateLerp);
    return () => cancelAnimationFrame(animId);
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Split projects into 2 rich ribbon rows with loops
  const row1Projects = useMemo(() => {
    const base = projects.length > 0 ? projects : [];
    return [...base, ...base, ...base];
  }, [projects]);

  const row2Projects = useMemo(() => {
    const reversed = [...projects].reverse();
    return [...reversed, ...reversed, ...reversed];
  }, [projects]);

  const handleRandomPlay = () => {
    if (!projects.length) return;
    const randomIdx = Math.floor(Math.random() * projects.length);
    onOpenDetails(projects[randomIdx]);
  };

  const scrollToCatalog = () => {
    if (onScrollToCatalog) {
      onScrollToCatalog();
      return;
    }
    const elem = document.getElementById('catalog-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Upcoming Premieres & Events Ticker
  const [eventIndex, setEventIndex] = useState(0);
  const [isEventPaused, setIsEventPaused] = useState(false);

  const events = useMemo(() => [
    {
      id: 'ng2',
      tag: 'СКОРО',
      title: '«Новый Год в Москве 2»',
      desc: 'Премьера продолжения зимой 2026',
      icon: (
        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 text-[#ff5c00]" viewBox="0 0 24 24">
          <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => {
        const found = projects.find((p) => p.id === 'ng');
        if (found) onOpenDetails(found);
      },
    },
    {
      id: 'nalim-4k',
      tag: '4K ULTRA HD',
      title: '«Налим» в 4K & Dolby Atmos',
      desc: 'Оригинальный ремастеринг классики',
      icon: (
        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 text-amber-400" viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => {
        const found = projects.find((p) => p.id === 'nalim');
        if (found) onOpenDetails(found);
      },
    },
    {
      id: 'android-apk',
      tag: 'ПРИЛОЖЕНИЕ',
      title: 'OFMEDIA для Android',
      desc: 'Оффлайн-загрузка, PiP и быстрый запуск',
      icon: (
        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 text-emerald-400" viewBox="0 0 24 24">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      action: () => {
        window.location.href = '/app/apk';
      },
    },
    {
      id: 'vkid-login',
      tag: 'VK ID',
      title: 'Быстрый вход через VK ID',
      desc: 'Синхронизация профиля и оценок',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current text-[#ff5c00]" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-2v-6h2v1.1c.45-.65 1.25-1.1 2-1.1 1.66 0 3 1.34 3 3v3z" />
        </svg>
      ),
      action: () => {
        if (onOpenAuth) {
          onOpenAuth();
        } else {
          window.dispatchEvent(new CustomEvent('ofmedia_open_auth'));
        }
      },
    },
  ], [projects, onOpenDetails, onOpenAuth]);

  useEffect(() => {
    if (isEventPaused || events.length === 0) return;
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % events.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isEventPaused, events.length]);

  // 3D Tilt calculation
  const tiltX = -lerpPos.y * 10;
  const tiltY = lerpPos.x * 12;
  const spotlightX = 50 + lerpPos.x * 25;
  const spotlightY = 50 + lerpPos.y * 25;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[85vh] lg:min-h-[90vh] overflow-hidden bg-[#070709] select-none flex items-center justify-center pt-24 pb-14 sm:pt-28 sm:pb-20 md:pt-32"
    >
      {/* Dynamic Ambient Parallax Spotlight Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(800px circle at ${spotlightX}% ${spotlightY}%, rgba(255, 92, 0, 0.18), transparent 60%),
            radial-gradient(600px circle at ${100 - spotlightX}% ${80 - spotlightY}%, rgba(255, 140, 0, 0.08), transparent 50%),
            radial-gradient(900px circle at 15% 30%, rgba(255, 92, 0, 0.12), transparent 70%)
          `,
        }}
      />

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-[#070709]/70 pointer-events-none z-10" />
      <div className="absolute inset-y-0 left-0 w-32 sm:w-64 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-[#070709] to-transparent pointer-events-none z-10" />

      {/* Subtle Cinematic Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main Grid Content */}
      <div className="relative z-20 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: The Bold Typography & Brand Manifesto */}
        <div
          className="lg:col-span-5 flex flex-col justify-center space-y-6 sm:space-y-7 transition-transform duration-300 ease-out z-30"
          style={{
            transform: `translate3d(${lerpPos.x * -12}px, ${lerpPos.y * -8}px, 0)`,
          }}
        >
          {/* Live Events & Upcoming Premieres Ribbon / Ticker */}
          {events.length > 0 && (
            <div
              onMouseEnter={() => setIsEventPaused(true)}
              onMouseLeave={() => setIsEventPaused(false)}
              onClick={events[eventIndex].action}
              className="self-start inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 hover:border-[#ff5c00]/50 transition-all duration-300 backdrop-blur-xl shadow-lg cursor-pointer group select-none max-w-full"
              title="Нажмите, чтобы узнать подробнее"
            >
              {/* Tag badge with vector icon */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#ff5c00] bg-[#ff5c00]/15 border border-[#ff5c00]/30 shrink-0">
                {events[eventIndex].icon}
                <span>{events[eventIndex].tag}</span>
              </span>

              {/* Event Title & Description */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm truncate">
                <span className="text-white font-semibold group-hover:text-[#ff5c00] transition-colors truncate">
                  {events[eventIndex].title}
                </span>
                <span className="text-zinc-500 hidden sm:inline">•</span>
                <span className="text-zinc-400 font-normal hidden sm:inline truncate">
                  {events[eventIndex].desc}
                </span>
              </div>

              {/* Arrow */}
              <svg
                className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}

          {/* Grand Heading: 'ТВОЙ НОВЫЙ' in Bebas Neue + OFMEDIA Logo */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-bebas text-6xl sm:text-7xl md:text-8xl lg:text-[92px] xl:text-[104px] tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 leading-[0.9] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              ТВОЙ НОВЫЙ
            </h1>
            <div className="flex items-center gap-4 pt-1">
              <img
                src="/logos/ofmediawhite_clean.png"
                alt="OFMEDIA"
                className="h-11 sm:h-14 md:h-16 lg:h-20 w-auto object-contain filter drop-shadow-[0_10px_35px_rgba(255,255,255,0.3)] hover:scale-102 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Manifesto / Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-normal leading-relaxed max-w-lg drop-shadow-md">
            Новый уровень кинематографичного стриминга. Все эксклюзивные премьеры, оригинальные фильмы, музыкальные клипы и шоу — в едином интерактивном пространстве.
          </p>

          {/* Feature Specs Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-zinc-300 pt-1">
            <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-sm font-medium">
              4K Ultra HD & 60 FPS
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-sm font-medium">
              Без рекламы
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-sm font-medium text-orange-400 border-orange-500/30">
              8 эксклюзивов
            </span>
          </div>

          {/* Call to Actions (CTA) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3">
            {/* Primary Orange Button: Scroll into Catalog */}
            <button
              onClick={scrollToCatalog}
              className="group px-7 py-4 rounded-2xl font-semibold text-sm bg-[#ff5c00] hover:bg-[#ff6d1a] text-white shadow-[0_0_30px_rgba(255,92,0,0.45)] hover:shadow-[0_0_45px_rgba(255,92,0,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 border border-white/25"
            >
              <span>Перейти в каталог</span>
              <svg
                className="w-4 h-4 fill-none stroke-current stroke-2 group-hover:translate-y-0.5 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Secondary Glass Button: Random Premiere */}
            <button
              onClick={handleRandomPlay}
              className="group px-6 py-4 rounded-2xl font-medium text-sm bg-white/[0.06] hover:bg-white/[0.14] text-white border border-white/15 hover:border-white/30 backdrop-blur-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 shadow-lg"
              title="Выбрать случайный фильм или клип"
            >
              <svg
                className="w-4 h-4 fill-none stroke-current stroke-2 text-orange-400 group-hover:rotate-180 transition-transform duration-500"
                viewBox="0 0 24 24"
              >
                <path d="M4 4h4l8 16h4M4 20h4l4-8M16 4h4l-3 6" />
              </svg>
              <span>Случайный релиз</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Rotating Film Ribbons */}
        <div className="lg:col-span-7 relative w-full overflow-visible perspective-1200 py-6">
          <div
            className="preserve-3d transition-transform duration-500 ease-out space-y-4 sm:space-y-6"
            style={{
              transform: `rotateY(${tiltY - 14}deg) rotateX(${tiltX + 8}deg) rotateZ(-3deg) scale(1.05)`,
            }}
          >
            {/* ROW 1: Running Left */}
            <div
              className="overflow-hidden w-full py-2 -mx-4 px-4"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            >
              <div className="animate-ribbon-left gap-4 sm:gap-6 flex items-center">
                {row1Projects.map((project, idx) => (
                  <div
                    key={`row1-${project.id}-${idx}`}
                    onClick={() => onOpenDetails(project)}
                    className="group relative flex-shrink-0 w-64 sm:w-80 md:w-96 aspect-video rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/10 hover:border-[#ff5c00]/70 hover:shadow-[0_15px_40px_rgba(255,92,0,0.4)] hover:scale-105 transition-all duration-300 select-none"
                  >
                    {/* Background Artwork */}
                    <img
                      src={project.backdrop || project.poster}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Hover Play Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(project);
                      }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]"
                      title={`Смотреть «${project.title}»`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#ff5c00] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,92,0,0.6)] transform scale-75 group-hover:scale-100 hover:scale-110 active:scale-95 transition-transform duration-300">
                        <PlayIcon className="w-5 h-5 fill-white" />
                      </div>
                    </div>

                    {/* Film Info Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                      <div className="space-y-1 max-w-[75%]">
                        {project.titleLogo ? (
                          <img
                            src={project.titleLogo}
                            alt={project.title}
                            className="max-h-7 sm:max-h-9 w-auto object-contain filter drop-shadow"
                          />
                        ) : (
                          <h3 className="text-white font-medium text-sm sm:text-base line-clamp-1 drop-shadow">
                            {project.title}
                          </h3>
                        )}
                        <p className="text-[11px] text-zinc-400 font-normal">
                          {project.year} • {project.genres[0]}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-zinc-300 bg-black/60 backdrop-blur-md border border-white/10">
                        {project.ageRating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: Running Right */}
            <div
              className="overflow-hidden w-full py-2 -mx-4 px-4"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            >
              <div className="animate-ribbon-right gap-4 sm:gap-6 flex items-center">
                {row2Projects.map((project, idx) => (
                  <div
                    key={`row2-${project.id}-${idx}`}
                    onClick={() => onOpenDetails(project)}
                    className="group relative flex-shrink-0 w-64 sm:w-80 md:w-96 aspect-video rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/10 hover:border-[#ff5c00]/70 hover:shadow-[0_15px_40px_rgba(255,92,0,0.4)] hover:scale-105 transition-all duration-300 select-none"
                  >
                    {/* Background Artwork */}
                    <img
                      src={project.backdrop || project.poster}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Hover Play Button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(project);
                      }}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]"
                      title={`Смотреть «${project.title}»`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#ff5c00] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,92,0,0.6)] transform scale-75 group-hover:scale-100 hover:scale-110 active:scale-95 transition-transform duration-300">
                        <PlayIcon className="w-5 h-5 fill-white" />
                      </div>
                    </div>

                    {/* Film Info Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                      <div className="space-y-1 max-w-[75%]">
                        {project.titleLogo ? (
                          <img
                            src={project.titleLogo}
                            alt={project.title}
                            className="max-h-7 sm:max-h-9 w-auto object-contain filter drop-shadow"
                          />
                        ) : (
                          <h3 className="text-white font-medium text-sm sm:text-base line-clamp-1 drop-shadow">
                            {project.title}
                          </h3>
                        )}
                        <p className="text-[11px] text-zinc-400 font-normal">
                          {project.year} • {project.genres[0]}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-zinc-300 bg-black/60 backdrop-blur-md border border-white/10">
                        {project.ageRating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
