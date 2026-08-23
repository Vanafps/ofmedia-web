import React, { useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import type { Actor } from '../data/actors';
import { ACTORS_DATA } from '../data/actors';
import type { UserProfile } from '../services/firebase';
import { getUserRatings } from '../services/ratingService';

interface OfmediaHeaderProps {
  activeTab: 'main' | 'favorites';
  setActiveTab: (tab: 'main' | 'favorites') => void;
  onSelectProject: (project: Project) => void;
  onSelectActor: (actor: Actor) => void;
  projects: Project[];
  favoritesCount: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
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
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userRatingsCount, setUserRatingsCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const r = getUserRatings();
      setUserRatingsCount(Object.keys(r).length);
    };
    updateCount();
    window.addEventListener('ofmedia_ratings_updated', updateCount);
    return () => window.removeEventListener('ofmedia_ratings_updated', updateCount);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            title="OFMEDIA Главная"
          >
            <img
              src="/logos/ofmediawhite_clean.png"
              alt="OFMEDIA"
              className="h-5 sm:h-7 w-auto object-contain group-hover:brightness-110 transition-all drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
            />
          </button>

          <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-full glass-pill text-sm font-medium">
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
              onClick={() => setActiveTab('favorites')}
              className={`relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-white/20 text-white font-medium shadow-sm border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Моё
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-white/25 text-white rounded-full font-bold shadow-sm border border-white/20">
                  {favoritesCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative">
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
                  className="text-zinc-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-full glass-pill text-zinc-200 hover:text-white transition-all shadow-md"
                title="Поиск фильмов и актёров"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 14z" />
                </svg>
              </button>
            )}

            {/* Smart Search Dropdown with Real Frosted Glass */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-dropdown rounded-3xl p-3.5 z-50 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
                {actorResults.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-[#ff5c00] uppercase tracking-wider flex items-center justify-between">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 border border-white/15 group-hover:border-[#ff5c00]/50 flex items-center justify-center text-white font-bold text-xs shadow shrink-0">
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
                    <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
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
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3.5 rounded-full glass-pill text-white transition-all shadow-lg hover:scale-102 active:scale-95"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#ff5c00] text-white font-bold text-xs flex items-center justify-center shadow">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium max-w-[90px] truncate hidden md:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <svg className="w-3.5 h-3.5 fill-zinc-400 hidden sm:block" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>

              {/* Profile Dropdown with Hardware-Accelerated Frosted Glass */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 glass-dropdown rounded-3xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-2xl bg-[#ff5c00] text-white font-bold text-sm flex items-center justify-center shadow shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">
                        {user.displayName || 'Пользователь'}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-normal truncate">
                        {user.email || 'Авторизован'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        onOpenProfile();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-[#ff5c00]/20 hover:text-[#ff5c00] text-zinc-200 text-xs font-medium transition-colors text-left flex items-center justify-between border border-transparent hover:border-[#ff5c00]/30"
                    >
                      <span>Личный кабинет и настройки</span>
                      <span>→</span>
                    </button>
                    <div className="flex items-center justify-between px-3 py-1.5 text-zinc-400 text-[11px] font-normal">
                      <span>Мои оценки:</span>
                      <span className="font-bold text-[#ff5c00]">{userRatingsCount}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 text-zinc-400 text-[11px] font-normal">
                      <span>В закладках:</span>
                      <span className="font-bold text-[#ff5c00]">{favoritesCount}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-medium transition-colors text-center"
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-full font-medium text-xs bg-[#ff5c00] hover:bg-[#e05200] text-white shadow-lg shadow-[#ff5c00]/30 hover:scale-103 active:scale-95 transition-all flex items-center gap-1.5"
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
