import React, { useRef, useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import { getMovieRating } from '../services/ratingService';
import { PlayIcon } from './PlayIcon';

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
  const [, setRatingsTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRatingsTick((t) => t + 1);
    window.addEventListener('ofmedia_ratings_updated', handleUpdate);
    return () => window.removeEventListener('ofmedia_ratings_updated', handleUpdate);
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

  const handleCardClick = (project: Project) => {
    if (hasMovedRef.current) return;
    onOpenDetails(project);
  };

  const scrollRow = (direction: 'left' | 'right') => {
    if (!rowRef.current) return;
    const scrollAmount = direction === 'left' ? -650 : 650;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="space-y-2.5 py-2 relative group/section">
      {/* Row Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div>
          <button
            onClick={() => handleCardClick(projects[0])}
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

      {/* Swipe / Drag Cards Track */}
      <div
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-start gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pb-4 pt-1 select-none transition-cursor duration-150 scroll-smooth ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => {
          const isFav = favorites.includes(project.id);
          const ratingStats = getMovieRating(project.id);

          return (
            <div
              key={project.id}
              onClick={() => handleCardClick(project)}
              className="flex-none w-[260px] sm:w-[300px] group cursor-pointer space-y-2 relative cinema-card"
            >
              {/* Card Thumbnail Box with Glass Hover Glow & Specular Sweep */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#101014] border border-white/10 group-hover:border-[#ff5c00]/60 transition-all duration-400 shadow-md">
                <img
                  src={project.poster}
                  alt={project.title}
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106 select-none"
                />

                {/* Light Reflection Sweep */}
                <div className="shimmer-effect" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-300" />

                {/* Top Badges with Frosted Glass */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/15 text-[10px] font-medium text-white shadow">
                    {project.year}
                  </span>
                  {ratingStats.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-xl shadow ${ratingStats.colorClass}`}>
                      ★ {ratingStats.scoreFormatted}
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/15 text-[10px] font-medium text-zinc-300 shadow">
                    {project.ageRating}
                  </span>
                </div>

                {/* Bottom Badges with Frosted Glass & Micro-Interactions */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(project.id);
                    }}
                    className={`pointer-events-auto p-2 rounded-xl backdrop-blur-2xl transition-all shadow-lg border active:scale-90 ${
                      isFav
                        ? 'bg-[#ff5c00] text-white border-[#ff5c00] shadow-[0_0_15px_rgba(255,92,0,0.6)] animate-pop-bounce'
                        : 'bg-black/60 hover:bg-black/85 text-zinc-200 hover:text-white border-white/20 hover:scale-110'
                    }`}
                    title={isFav ? 'В закладках' : 'Добавить в закладки'}
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(project);
                    }}
                    className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-[11px] font-medium shadow-lg hover:shadow-[0_0_16px_rgba(255,92,0,0.6)] hover:scale-106 active:scale-95 transition-all duration-200 border border-white/20"
                  >
                    <PlayIcon className="w-3 h-3 fill-white" />
                    <span>{project.duration}</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Description */}
              <div className="space-y-0.5 px-0.5">
                <h3 className="font-heading font-medium text-sm text-white group-hover:text-[#ff5c00] transition-colors duration-200 truncate">
                  {project.title}
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal truncate">
                  {project.genres.join(' • ')} • {project.year}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
