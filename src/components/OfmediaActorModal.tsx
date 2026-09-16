import React, { useEffect } from 'react';
import type { Actor } from '../data/actors';
import type { Project } from '../data/projects';
import { PROJECTS_DATA } from '../data/projects';
import { OfmediaMovieCard } from './OfmediaMovieCard';

interface OfmediaActorModalProps {
  actor: Actor | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onPlayProject: (project: Project) => void;
  favorites?: string[];
  onToggleFavorite?: (projectId: string) => void;
}

export const OfmediaActorModal: React.FC<OfmediaActorModalProps> = ({
  actor,
  isOpen,
  onClose,
  onSelectProject,
  onPlayProject,
  favorites = [],
  onToggleFavorite = () => {},
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !actor) return null;

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-[120] bg-[#070709] overflow-y-auto custom-scrollbar text-white flex flex-col animate-in fade-in duration-300 select-none"
    >
      {/* Top Floating Cinema Navigation Bar */}
      <div className="sticky top-0 z-50 w-full bg-[#070709]/90 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-12 lg:px-16 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-[#ff5c00] transition-colors group cursor-pointer"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Назад</span>
        </button>

        <span className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
          Персональная страница создателя
        </span>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="Закрыть (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Main Fullscreen Body */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-12 lg:px-16 py-8 sm:py-12 space-y-10 sm:space-y-14">
        {/* Creator Hero Header in Pure Deep Black */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10 pb-10 border-b border-white/10 text-center md:text-left">
          {/* Large High-Resolution Portrait / Avatar */}
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl bg-[#121216] border-2 border-[#ff5c00]/50 overflow-hidden flex items-center justify-center text-white font-heading font-bold text-4xl sm:text-5xl shadow-[0_0_40px_rgba(255,92,0,0.2)] shrink-0">
            {actor.photo ? (
              <img
                src={actor.photo}
                alt={actor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              actor.initials
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Biography & Metadata */}
          <div className="space-y-4 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
                {actor.name}
              </h1>
              <span className="px-3.5 py-1 rounded-full bg-[#ff5c00]/15 border border-[#ff5c00]/35 text-[#ff5c00] text-xs sm:text-sm font-semibold">
                {actor.filmsCount} {actor.filmsCount === 1 ? 'релиз' : actor.filmsCount < 5 ? 'релиза' : 'релизов'} в OFMEDIA
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#ff5c00] font-medium tracking-wide">
              {actor.mainRole}
            </p>

            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-3xl">
              {actor.bio}
            </p>
          </div>
        </div>

        {/* Filmography Section with Modern Movie Cards */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/5 pb-4">
            <div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
                Фильмография в OFMEDIA
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">
                Все проекты и авторские работы создателя
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Всего работ: {actor.filmography.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-7">
            {actor.filmography.map((item, idx) => {
              const fullProject = PROJECTS_DATA.find((p) => p.id === item.projectId || p.slug === item.projectSlug);

              if (fullProject) {
                return (
                  <div key={idx} className="flex flex-col space-y-2.5">
                    {/* Modern Movie Card */}
                    <OfmediaMovieCard
                      project={fullProject}
                      onPlay={(p) => {
                        onPlayProject(p);
                        onClose();
                      }}
                      onOpenDetails={(p) => {
                        onSelectProject(p);
                        onClose();
                      }}
                      isFavorite={favorites.includes(fullProject.id)}
                      onToggleFavorite={onToggleFavorite}
                    />

                    {/* Actor Role Badge in this project */}
                    <div className="px-3 py-2 rounded-xl bg-[#121216] border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 truncate">
                        Роль: <span className="text-zinc-200 font-medium">{item.role}</span>
                      </span>
                      <span className="text-zinc-400 text-[11px] shrink-0 ml-2">
                        {item.year}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#121216] border border-white/10 flex gap-4 items-center shadow-lg"
                >
                  <img
                    src={item.poster}
                    alt={item.projectTitle}
                    className="w-24 aspect-video rounded-xl object-cover bg-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-sm font-medium text-white truncate">
                      {item.projectTitle}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      Роль: <span className="text-zinc-300">{item.role}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {item.year}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
