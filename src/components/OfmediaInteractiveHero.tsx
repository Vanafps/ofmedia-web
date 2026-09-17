import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Project } from '../data/projects';
import { PlayIcon } from './PlayIcon';

interface OfmediaInteractiveHeroProps {
  projects: Project[];
  onOpenDetails: (project: Project) => void;
  onPlay: (project: Project) => void;
  onScrollToCatalog?: () => void;
}

export const OfmediaInteractiveHero: React.FC<OfmediaInteractiveHeroProps> = ({
  projects,
  onOpenDetails,
  onPlay,
  onScrollToCatalog,
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
      className="relative w-full min-h-[82vh] lg:min-h-[88vh] overflow-hidden bg-[#070709] select-none flex items-center justify-center pt-20 pb-12 sm:pt-24 sm:pb-16"
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
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl w-fit shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#ff5c00] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#ff5c00] -ml-4" />
            <span className="text-[11px] sm:text-xs font-medium tracking-wider text-zinc-300 uppercase">
              Обновление платформы • 2026
            </span>
          </div>

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
                        <PlayIcon className="w-5 h-5 fill-white ml-0.5" />
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
                        <PlayIcon className="w-5 h-5 fill-white ml-0.5" />
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
