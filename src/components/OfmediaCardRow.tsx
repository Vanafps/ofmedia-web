import React, { useRef, useState } from 'react';
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
}

export const OfmediaCardRow: React.FC<OfmediaCardRowProps> = ({
  title,
  subtitle,
  projects,
  onPlay,
  onOpenDetails,
  favorites,
  onToggleFavorite,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

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
    <section className="space-y-1 py-1 relative group/section">
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

        {/* Drag Hint & Navigation Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400 font-normal select-none px-3 py-1 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10">
            <svg className="w-3.5 h-3.5 fill-current opacity-70" viewBox="0 0 24 24">
              <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74 0-2.49-2.01-4.5-4.5S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.02-.24-.02-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.43 1.06.43h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.06.01-.13.01-.2 0-.49-.24-.93-.65-1.19z" />
            </svg>
            <span>Перетягивайте ленту</span>
          </div>

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
        className={`flex items-start gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pt-5 pb-28 -mt-2 -mb-24 select-none transition-cursor duration-150 scroll-smooth ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => {
          const isFav = favorites.includes(project.id);

          return (
            <div
              key={project.id}
              className="flex-none w-[260px] sm:w-[300px] md:w-[320px] aspect-video relative"
            >
              <OfmediaMovieCard
                project={project}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                isFavorite={isFav}
                onToggleFavorite={onToggleFavorite}
                isDragging={isDragging}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
