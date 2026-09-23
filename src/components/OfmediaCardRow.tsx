import React, { useRef, useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import { OfmediaMovieCard } from './OfmediaMovieCard';

interface OfmediaCardRowProps {
  title: string;
  subtitle?: string;
  projects: Project[];
  onPlay: (project: Project) => void;
  onOpenDetails: (project: Project) => void;
  favorites: string[];
  onToggleFavorite: (projectId: string) => void;
  showRemainingBadge?: boolean;
  remainingMinutesMap?: Record<string, number>;
}

export const OfmediaCardRow: React.FC<OfmediaCardRowProps> = ({
  title,
  subtitle,
  projects,
  onPlay,
  onOpenDetails,
  favorites,
  onToggleFavorite,
  showRemainingBadge = false,
  remainingMinutesMap,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Smooth horizontal wheel scroll only when user holds Shift or uses trackpad horizontal delta
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user holds Shift, translate deltaY into horizontal carousel movement
      if (e.shiftKey && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
      }
      // Standard vertical wheel scroll without Shift is left completely untouched
      // so the page scrolls vertically with zero hindrance
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  if (projects.length === 0) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !rowRef.current) return;
    isDownRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeftRef.current = rowRef.current.scrollLeft;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.6;
    if (Math.abs(walk) > 6) {
      hasMovedRef.current = true;
    }
    rowRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleHeaderClick = (project: Project) => {
    if (hasMovedRef.current) return;
    onOpenDetails(project);
  };

  const scrollRow = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const scrollAmount = direction === 'left' ? -650 : 650;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="py-2 sm:py-3 relative group/section">
      {/* Row Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div>
          <button
            onClick={() => handleHeaderClick(projects[0])}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight group-hover:text-[#ff5c00] transition-colors duration-200">
              {title}
            </h2>
            <svg
              className="w-4 h-4 fill-zinc-400 group-hover:fill-[#ff5c00] group-hover:translate-x-1.5 transition-all duration-200"
              viewBox="0 0 24 24"
            >
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5 font-normal">{subtitle}</p>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">

          {/* Smooth Scroll Navigation Buttons */}
          <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scrollRow('left')}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-[#ff5c00] text-zinc-300 hover:text-white border border-white/15 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md backdrop-blur-xl"
              title="Прокрутить влево"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={() => scrollRow('right')}
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-[#ff5c00] text-zinc-300 hover:text-white border border-white/15 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md backdrop-blur-xl"
              title="Прокрутить вправо"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Swipe / Drag Cards Track (with vertical breathing room for floating hover expansion) */}
      <div
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        data-lenis-prevent-horizontal="true"
        className={`flex items-start gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-3 sm:py-5 select-none no-scrollbar [&::-webkit-scrollbar]:hidden transition-cursor duration-150 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => {
          const isFav = favorites.includes(project.id);

          return (
            <div
              key={project.id}
              className="flex-none w-[260px] sm:w-[300px] md:w-[320px] aspect-video relative hover:z-50 focus-within:z-50 transition-all"
            >
              <OfmediaMovieCard
                project={project}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                isFavorite={isFav}
                onToggleFavorite={onToggleFavorite}
                isDragging={isDragging}
                showRemainingBadge={showRemainingBadge}
                remainingMinutes={remainingMinutesMap?.[project.id]}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
