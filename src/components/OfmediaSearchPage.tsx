import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Project } from '../data/projects';
import { PROJECTS_DATA } from '../data/projects';
import { ACTORS_DATA, type Actor } from '../data/actors';
import { OfmediaMovieCard } from './OfmediaMovieCard';

interface OfmediaSearchPageProps {
  onSelectProject: (project: Project) => void;
  onPlayProject: (project: Project) => void;
  onSelectActor: (actor: Actor) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  initialQuery?: string;
}

const QUICK_CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'comedy', label: 'Комедии' },
  { id: 'music', label: 'Клипы и музыка' },
  { id: 'shows', label: 'Шоу и блоги' },
  { id: 'drama', label: 'Драмы' },
];

export const OfmediaSearchPage: React.FC<OfmediaSearchPageProps> = ({
  onSelectProject,
  onPlayProject,
  onSelectActor,
  favorites,
  onToggleFavorite,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount for instant mobile typing
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const queryNorm = query.trim().toLowerCase();

  // Filter projects
  const filteredProjects = useMemo(() => {
    return PROJECTS_DATA.filter((p) => {
      // Category filter
      if (activeCategory === 'comedy' && !p.genres.some((g) => g.toLowerCase().includes('комед'))) {
        return false;
      }
      if (activeCategory === 'music' && !p.genres.some((g) => g.toLowerCase().includes('музык') || g.toLowerCase().includes('клип'))) {
        return false;
      }
      if (activeCategory === 'shows' && !p.genres.some((g) => g.toLowerCase().includes('шоу') || g.toLowerCase().includes('постановк') || g.toLowerCase().includes('влог'))) {
        return false;
      }
      if (activeCategory === 'drama' && !p.genres.some((g) => g.toLowerCase().includes('драм'))) {
        return false;
      }

      // Query filter
      if (!queryNorm) return true;

      const matchTitle = p.title.toLowerCase().includes(queryNorm);
      const matchGenre = p.genres.some((g) => g.toLowerCase().includes(queryNorm));
      const matchDesc = p.description.toLowerCase().includes(queryNorm);
      const matchCast = p.cast.some((c) => c.name.toLowerCase().includes(queryNorm));
      const matchDir = p.directors.some((d) => d.toLowerCase().includes(queryNorm));

      return matchTitle || matchGenre || matchDesc || matchCast || matchDir;
    });
  }, [queryNorm, activeCategory]);

  // Filter actors
  const filteredActors = useMemo(() => {
    if (!queryNorm) return [];
    return ACTORS_DATA.filter((a) => {
      return (
        a.name.toLowerCase().includes(queryNorm) ||
        a.mainRole.toLowerCase().includes(queryNorm) ||
        a.bio.toLowerCase().includes(queryNorm)
      );
    });
  }, [queryNorm]);

  const hasQuery = queryNorm.length > 0;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in duration-200 select-none pb-24">
      {/* Search Header Bar */}
      <div className="space-y-4">
        <div className="relative flex items-center">
          <svg
            className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Фильмы, сериалы, режиссёры, актёры..."
            className="w-full h-13 sm:h-15 pl-12 pr-12 rounded-2xl sm:rounded-3xl bg-[#121214] border border-white/15 focus:border-[#ff5c00] text-white text-sm sm:text-base placeholder-zinc-500 shadow-2xl focus:outline-none transition-all"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Очистить поиск"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#ff5c00] text-white shadow-md shadow-[#ff5c00]/30 scale-102'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actors Section (if query matches any) */}
      {filteredActors.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#ff5c00]">
              Актёры и создатели ({filteredActors.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                onClick={() => onSelectActor(actor)}
                className="p-3 rounded-2xl bg-[#121214] border border-white/10 hover:border-[#ff5c00]/50 flex flex-col items-center text-center gap-2 cursor-pointer transition-all duration-200 group hover:scale-102"
              >
                {actor.photo ? (
                  <img
                    src={actor.photo}
                    alt={actor.name}
                    className="w-16 h-16 rounded-full object-cover border border-white/15 group-hover:border-[#ff5c00] transition-colors shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/15 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {actor.initials}
                  </div>
                )}
                <div className="w-full">
                  <div className="font-semibold text-xs sm:text-sm text-white group-hover:text-[#ff5c00] transition-colors truncate">
                    {actor.name}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {actor.mainRole}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movies Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg sm:text-xl text-white">
            {hasQuery
              ? `Найдено фильмов: ${filteredProjects.length}`
              : activeCategory !== 'all'
              ? 'Фильмы по выбранной категории'
              : 'Каталог фильмов и спецвыпусков'}
          </h2>
          {hasQuery && filteredProjects.length > 0 && (
            <span className="text-xs text-zinc-400 font-mono">
              {filteredProjects.length} из {PROJECTS_DATA.length}
            </span>
          )}
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="aspect-video w-full">
                <OfmediaMovieCard
                  project={project}
                  onPlay={onPlayProject}
                  onOpenDetails={onSelectProject}
                  isFavorite={favorites.includes(project.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-[#101012] border border-white/10 rounded-3xl p-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-base text-white">Ничего не найдено</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Попробуйте изменить формулировку запроса или выбрать другую категорию в фильтрах выше.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setActiveCategory('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold shadow-md shadow-[#ff5c00]/30 transition-all cursor-pointer"
            >
              Сбросить поиск
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
