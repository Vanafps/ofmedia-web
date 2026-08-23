import React, { useEffect } from 'react';
import type { Actor } from '../data/actors';
import type { Project } from '../data/projects';
import { PROJECTS_DATA } from '../data/projects';
import { PlayIcon } from './PlayIcon';

interface OfmediaActorModalProps {
  actor: Actor | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onPlayProject: (project: Project) => void;
}

export const OfmediaActorModal: React.FC<OfmediaActorModalProps> = ({
  actor,
  isOpen,
  onClose,
  onSelectProject,
  onPlayProject,
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

  if (!isOpen || !actor) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      {/* Frosted Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#0c0c14]/85 backdrop-blur-3xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.8)] z-10 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button with Glassmorphism */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-xl transition-all shadow-md hover:scale-105 active:scale-95"
          title="Закрыть (Esc)"
        >
          ✕
        </button>

        {/* Actor Hero / Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 border-b border-white/10 pb-6 text-center sm:text-left">
          {/* Avatar / Photo with Glow */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border-2 border-[#ff5c00]/50 overflow-hidden flex items-center justify-center text-white font-heading font-bold text-2xl sm:text-3xl shadow-[0_0_25px_rgba(255,92,0,0.25)] shrink-0">
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
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
                {actor.name}
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-[#ff5c00]/20 border border-[#ff5c00]/30 text-[#ff5c00] text-xs font-bold backdrop-blur-xl">
                {actor.filmsCount} {actor.filmsCount === 1 ? 'релиз' : actor.filmsCount < 5 ? 'релиза' : 'релизов'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#ff5c00] font-medium">
              {actor.mainRole}
            </p>

            <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
              {actor.bio}
            </p>
          </div>
        </div>

        {/* Filmography Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg sm:text-xl text-white">
              Фильмография в OFMEDIA
            </h3>
            <span className="text-xs text-zinc-400 font-normal">
              Все работы создателя
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actor.filmography.map((item, idx) => {
              const fullProject = PROJECTS_DATA.find((p) => p.id === item.projectId || p.slug === item.projectSlug);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (fullProject) {
                      onSelectProject(fullProject);
                      onClose();
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-3xl border border-white/12 hover:border-[#ff5c00]/50 transition-all flex gap-3.5 items-center cursor-pointer group shadow-lg"
                >
                  <img
                    src={item.poster}
                    alt={item.projectTitle}
                    className="w-20 aspect-video rounded-xl object-cover bg-zinc-800 shrink-0 shadow"
                  />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-xs sm:text-sm font-medium text-white group-hover:text-[#ff5c00] transition-colors truncate">
                      {item.projectTitle}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-normal truncate">
                      Роль: <span className="text-zinc-300">{item.role}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-normal">
                      {item.year}
                    </div>
                  </div>

                  {fullProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayProject(fullProject);
                        onClose();
                      }}
                      className="w-8 h-8 rounded-full bg-[#ff5c00] hover:bg-[#e05200] text-white flex items-center justify-center shadow-lg shrink-0 border border-white/20"
                      title="Смотреть"
                    >
                      <PlayIcon className="w-3.5 h-3.5 fill-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
