import React, { useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import type { Actor } from '../data/actors';
import { ACTORS_DATA } from '../data/actors';
import type { UserProfile } from '../services/firebase';

interface OfmediaHeaderProps {
  activeTab: 'main' | 'search' | 'favorites';
  setActiveTab: (tab: 'main' | 'search' | 'favorites') => void;
  onSelectProject: (project: Project) => void;
  onSelectActor: (actor: Actor) => void;
  projects: Project[];
  favoritesCount: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout?: () => void;
}

export const OfmediaHeader: React.FC<OfmediaHeaderProps> = ({
  activeTab,
  setActiveTab,
  onSelectProject,
  onSelectActor,
  projects,
  favoritesCount,
  user,
  onOpenAuth,
  onOpenProfile,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleGlobalOpenSearch = () => {
      setActiveTab('search');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('ofmedia_open_search', handleGlobalOpenSearch);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('ofmedia_open_search', handleGlobalOpenSearch);
    };
  }, [setActiveTab]);

  const queryNorm = searchQuery.trim().toLowerCase();

  const projectResults = queryNorm
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(queryNorm) ||
          p.genres.some((g) => g.toLowerCase().includes(queryNorm)) ||
          p.description.toLowerCase().includes(queryNorm)
      )
    : [];

  const actorResults = queryNorm
    ? ACTORS_DATA.filter(
        (a) =>
          a.name.toLowerCase().includes(queryNorm) ||
          a.mainRole.toLowerCase().includes(queryNorm) ||
          a.bio.toLowerCase().includes(queryNorm)
      )
    : [];

  const hasAnyResults = projectResults.length > 0 || actorResults.length > 0;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled
          ? 'glass-header py-3 sm:py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-3.5 sm:py-4 backdrop-blur-md'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('main')}
            className="flex items-center group text-left focus:outline-none"
          >
            <img
              src="/logos/ofmediawhite_clean.png"
              alt="OFMEDIA"
              className="h-5 sm:h-7 w-auto object-contain group-hover:brightness-110 transition-all drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full glass-pill text-sm font-medium">
            <button
              onClick={() => setActiveTab('main')}
              className={`relative px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'main'
                  ? 'bg-white/20 text-white font-medium shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Главная
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`relative px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-white/20 text-white font-medium shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Поиск
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-white/20 text-white font-medium shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Моё
              {favoritesCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] bg-white/20 text-white rounded-full font-semibold shadow-sm border border-white/20">
                  {favoritesCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center gap-2 bg-black/75 backdrop-blur-3xl border border-white/25 rounded-full px-3.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in">
                <svg className="w-4 h-4 fill-zinc-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z" />
                </svg>
                <input
                  type="text"
                  placeholder="Фильмы, актёры, создатели..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none w-36 sm:w-64"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-zinc-400 hover:text-white text-xs px-1 cursor-pointer flex items-center justify-center"
                  title="Очистить и закрыть"
                >
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-pill text-zinc-200 hover:text-white transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                title="Поиск фильмов и актёров"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z" />
                </svg>
              </button>
            )}

            {/* Smart Search Dropdown with Real Frosted Glass */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 glass-dropdown rounded-3xl p-3.5 z-[110] space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 shadow-2xl">
                {actorResults.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-[#ff5c00] uppercase tracking-wide flex items-center justify-between">
                      <span>Актёры и создатели</span>
                      <span>({actorResults.length})</span>
                    </div>
                    {actorResults.map((actor) => (
                      <div
                        key={actor.id}
                        onClick={() => {
                          onSelectActor(actor);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded-2xl hover:bg-white/10 flex items-center gap-3 cursor-pointer transition-all group border border-transparent hover:border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border border-white/15 group-hover:border-[#ff5c00]/50 flex items-center justify-center text-white font-semibold text-xs shadow shrink-0">
                          {actor.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-white group-hover:text-[#ff5c00] transition-colors truncate">
                            {actor.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal truncate">
                            {actor.mainRole}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 rounded bg-white/10 shrink-0 border border-white/10">
                          {actor.filmsCount} {actor.filmsCount === 1 ? 'фильм' : 'фильма'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {projectResults.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide flex items-center justify-between">
                      <span>Фильмы и релизы</span>
                      <span>({projectResults.length})</span>
                    </div>
                    {projectResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectProject(item);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2 rounded-2xl hover:bg-white/10 flex items-center gap-3 cursor-pointer transition-all group border border-transparent hover:border-white/10"
                      >
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-12 aspect-video rounded-lg object-cover bg-zinc-800 shrink-0 shadow"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-white group-hover:text-[#ff5c00] transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal truncate">
                            {item.genres.join(', ')} • {item.year}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium px-1.5 py-0.5 rounded bg-black/60 shrink-0 border border-white/10">
                          {item.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {!hasAnyResults && (
                  <div className="py-6 text-center text-xs text-zinc-400 font-normal">
                    Ничего не найдено по запросу «{searchQuery}»
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="h-9 sm:h-10 flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3.5 rounded-full glass-pill text-white transition-all shadow-lg hover:scale-102 active:scale-95 cursor-pointer border border-white/15 hover:border-[#ff5c00]/50"
              title="Личный кабинет и настройки"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-7 h-7 rounded-full object-cover border border-white/25 shadow-sm shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#ff5c00] text-white font-semibold text-xs flex items-center justify-center shadow shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium max-w-[110px] truncate hidden md:block">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="h-9 sm:h-10 px-4 rounded-full font-medium text-xs bg-[#ff5c00] hover:bg-[#e05200] text-white shadow-lg shadow-[#ff5c00]/30 hover:scale-103 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span>Войти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
