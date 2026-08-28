import React from 'react';
import type { Project } from '../data/projects';
import { PlayIcon } from './PlayIcon';

interface OfmediaHeroProps {
  project: Project;
  onPlay: (project: Project) => void;
  onOpenDetails: (project: Project) => void;
  isFavorite: boolean;
  onToggleFavorite: (projectId: string) => void;
}

export const OfmediaHero: React.FC<OfmediaHeroProps> = ({
  project,
  onPlay,
  onOpenDetails,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div className="relative w-full h-[78vh] sm:h-[86vh] overflow-hidden bg-[#070709] select-none">
      {/* Background Poster / Backdrop with Smooth Parallax Zoom */}
      <img
        src={project.backdrop || project.poster}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover object-center scale-100 hover:scale-102 transition-transform duration-1000 ease-out"
      />

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070709]/95 via-[#070709]/50 to-transparent" />

      {/* Dynamic Ambient Breathing Glow Blobs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-[#ff5c00]/20 blur-[140px] pointer-events-none animate-ambient-float" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none animate-ambient-float" style={{ animationDelay: '-3.5s' }} />

      {/* Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto h-full flex flex-col justify-end px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-from-bottom duration-700">
          {/* Logo Tag / Status with WHITE OFMEDIA Originals Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logos/ofmediaoriginalswhite_clean.png"
              alt="OFMEDIA Originals"
              className="h-6 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
            />
            <span className="text-zinc-500">|</span>
            <span className="text-xs text-zinc-300 font-medium tracking-wider">
              Главная премьера года
            </span>
          </div>

          {/* Title / Title Logo */}
          {project.titleLogo ? (
            <div className="py-1">
              <img
                src={project.titleLogo}
                alt={project.title}
                className="max-h-20 sm:max-h-28 max-w-full w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] hover:scale-102 transition-transform duration-500"
              />
              <h1 className="sr-only">{project.title}</h1>
            </div>
          ) : (
            <h1 className="font-heading font-bold text-4xl sm:text-6xl text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {project.title}
            </h1>
          )}

          {/* Metadata Badges with Frosted Glass */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300 font-normal">
            <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-2xl border border-white/20 text-white font-medium shadow">
              {project.year}
            </span>
            <span>•</span>
            <span>{project.genres.join(', ')}</span>
            <span>•</span>
            <span>{project.duration}</span>
            <span>•</span>
            <span>{project.country}</span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium text-zinc-200 border border-white/20 bg-black/50 backdrop-blur-2xl shadow">
              {project.ageRating}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-zinc-200 line-clamp-3 leading-relaxed font-normal max-w-xl drop-shadow">
            {project.description}
          </p>

          {/* Cast Preview */}
          <div className="text-xs text-zinc-400 font-normal">
            <span className="text-zinc-500">В ролях: </span>
            <span>{project.cast.slice(0, 4).map((c) => c.name).join(', ')}</span>
          </div>

          {/* Action Buttons Row with Frosted Glass & Smooth Micro-animations */}
          <div className="flex items-center gap-3 sm:gap-4 pt-2">
            {/* Primary Orange Play Button with Centered PlayIcon */}
            <button
              onClick={() => onPlay(project)}
              className="group px-7 py-3.5 rounded-full font-medium text-sm bg-[#ff5c00] hover:bg-[#e05200] text-white shadow-[0_0_25px_rgba(255,92,0,0.45)] hover:shadow-[0_0_40px_rgba(255,92,0,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 border border-white/20"
            >
              <PlayIcon className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              <span>Смотреть онлайн</span>
            </button>

            {/* Details Button */}
            <button
              onClick={() => onOpenDetails(project)}
              className="px-6 py-3.5 rounded-full font-medium text-sm glass-pill text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <svg className="w-4 h-4 fill-current text-zinc-300" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>О фильме</span>
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => onToggleFavorite(project.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 glass-pill hover:scale-110 active:scale-90 shadow-lg ${
                isFavorite
                  ? 'text-[#ff5c00] border-[#ff5c00]/60 shadow-[0_0_15px_rgba(255,92,0,0.5)] animate-pop-bounce'
                  : 'text-zinc-300 hover:text-white border-white/15'
              }`}
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <svg
                className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'fill-none stroke-current stroke-2'}`}
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
