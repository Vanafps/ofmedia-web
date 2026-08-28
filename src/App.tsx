import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { PROJECTS_DATA } from './data/projects';
import type { Project, Episode } from './data/projects';
import type { Actor } from './data/actors';
import { ACTORS_DATA } from './data/actors';
import { OfmediaHeader } from './components/OfmediaHeader';
import { OfmediaHero } from './components/OfmediaHero';
import { OfmediaCardRow } from './components/OfmediaCardRow';
import { OfmediaDetailModal } from './components/OfmediaDetailModal';
import { OfmediaPlayer } from './components/OfmediaPlayer';
import { OfmediaGenreCards, type GenreCategoryId } from './components/OfmediaGenreCards';
import { OfmediaAuthModal } from './components/OfmediaAuthModal';
import { OfmediaActorModal } from './components/OfmediaActorModal';
import { OfmediaProfileModal } from './components/OfmediaProfileModal';
import { OfmediaMobileNav } from './components/OfmediaMobileNav';
import { subscribeToAuth, logoutUser, type UserProfile } from './services/firebase';
import { getUserRatings, getMovieRating } from './services/ratingService';
import { getPersonalizedRecommendations, type RecommendedRow } from './services/recommendationService';

export function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'favorites'>('main');
  const [favoritesSubTab, setFavoritesSubTab] = useState<'favorites' | 'ratings'>('favorites');
  const [sortOrder, setSortOrder] = useState<'rating_desc' | 'year_desc' | 'title_asc'>('rating_desc');
  const [selectedCategory, setSelectedCategory] = useState<GenreCategoryId>('none');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | undefined>(undefined);

  // Modals State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isActorModalOpen, setIsActorModalOpen] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [recommendationRows, setRecommendationRows] = useState<RecommendedRow[]>([]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ofmedia_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const refreshUserData = () => {
    setUserRatings(getUserRatings());
    setRecommendationRows(getPersonalizedRecommendations());
  };

  useEffect(() => {
    refreshUserData();
    window.addEventListener('ofmedia_ratings_updated', refreshUserData);
    window.addEventListener('ofmedia_reviews_updated', refreshUserData);
    return () => {
      window.removeEventListener('ofmedia_ratings_updated', refreshUserData);
      window.removeEventListener('ofmedia_reviews_updated', refreshUserData);
    };
  }, []);

  const isAnyModalOpen = isDetailModalOpen || isActorModalOpen || isPlayerOpen || isAuthModalOpen || isProfileModalOpen;

  // Butter-Smooth Kinetic Inertia Scrolling via Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      autoRaf: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    if (isAnyModalOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    localStorage.setItem('ofmedia_favs', JSON.stringify(favorites));
    refreshUserData();
  }, [favorites]);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Deep Link check (?film=park or ?actor=ivan-lepo)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filmSlug = params.get('film');
    const actorSlug = params.get('actor');

    if (filmSlug) {
      const match = PROJECTS_DATA.find((p) => p.slug === filmSlug || p.id === filmSlug);
      if (match) {
        setSelectedProject(match);
        setIsDetailModalOpen(true);
      }
    } else if (actorSlug) {
      const actorMatch = ACTORS_DATA.find((a) => a.slug === actorSlug || a.id === actorSlug);
      if (actorMatch) {
        setSelectedActor(actorMatch);
        setIsActorModalOpen(true);
      }
    }
  }, []);

  const toggleFavorite = (projectId: string) => {
    setFavorites((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handlePlayProject = (project: Project, episode?: Episode) => {
    setSelectedProject(project);
    setSelectedEpisode(episode || project.episodes?.[0]);
    setIsPlayerOpen(true);
    setIsDetailModalOpen(false);
    setIsActorModalOpen(false);
  };

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const handleOpenActor = (actor: Actor) => {
    setSelectedActor(actor);
    setIsActorModalOpen(true);
  };

  const handleSelectNextEpisode = () => {
    if (!selectedProject || !selectedProject.episodes || selectedProject.episodes.length <= 1) return;
    const currentIdx = selectedProject.episodes.findIndex(
      (ep) => ep.id === selectedEpisode?.id
    );
    if (currentIdx !== -1 && currentIdx + 1 < selectedProject.episodes.length) {
      setSelectedEpisode(selectedProject.episodes[currentIdx + 1]);
    }
  };

  const heroProject = PROJECTS_DATA[0];

  const filterProjectsByCategory = (cat: GenreCategoryId): Project[] => {
    switch (cat) {
      case 'new':
        return PROJECTS_DATA.filter((p) => p.year === 2026);
      case 'comedy':
        return PROJECTS_DATA.filter((p) => p.genres.includes('Комедия'));
      case 'music':
        return PROJECTS_DATA.filter((p) =>
          p.genres.includes('Музыкальное') || p.genres.includes('Клип') || p.genres.includes('Концерт')
        );
      case 'shows':
        return PROJECTS_DATA.filter((p) =>
          p.genres.includes('Постановка') || p.genres.includes('Шоу') || p.genres.includes('Скетч')
        );
      case 'adventure':
        return PROJECTS_DATA.filter((p) =>
          p.genres.includes('Приключения') || p.genres.includes('Влог') || p.genres.includes('Экскурсия')
        );
      case 'none':
      default:
        return PROJECTS_DATA;
    }
  };

  const sortProjects = (list: Project[]): Project[] => {
    return [...list].sort((a, b) => {
      if (sortOrder === 'rating_desc') {
        const rA = getMovieRating(a.id).score ?? -1;
        const rB = getMovieRating(b.id).score ?? -1;
        if (rB !== rA) return rB - rA;
        return b.year - a.year;
      }
      if (sortOrder === 'year_desc') {
        return b.year - a.year;
      }
      return a.title.localeCompare(b.title);
    });
  };

  const newProjects = filterProjectsByCategory('new');
  const comedyProjects = filterProjectsByCategory('comedy');
  const musicProjects = filterProjectsByCategory('music');
  const showProjects = filterProjectsByCategory('shows');
  const adventureProjects = filterProjectsByCategory('adventure');

  const favoriteProjects = sortProjects(PROJECTS_DATA.filter((p) => favorites.includes(p.id)));
  const ratedProjects = sortProjects(PROJECTS_DATA.filter((p) => userRatings[p.id] !== undefined));

  const categoryCounts: Record<GenreCategoryId, number> = {
    none: PROJECTS_DATA.length,
    new: newProjects.length,
    comedy: comedyProjects.length,
    music: musicProjects.length,
    shows: showProjects.length,
    adventure: adventureProjects.length,
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col selection:bg-[#ff5c00] selection:text-white pb-16 sm:pb-0">
      {/* Header with Profile Modal Access */}
      <OfmediaHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectProject={handleOpenDetails}
        onSelectActor={handleOpenActor}
        projects={PROJECTS_DATA}
        favoritesCount={favorites.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={logoutUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* TAB 1: MAIN PAGE */}
        {activeTab === 'main' && (
          <div className="space-y-8 sm:space-y-14">
            {/* Hero Banner */}
            <OfmediaHero
              project={heroProject}
              onPlay={handlePlayProject}
              onOpenDetails={handleOpenDetails}
              isFavorite={favorites.includes(heroProject.id)}
              onToggleFavorite={toggleFavorite}
            />

            {/* Genre Navigation System */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <OfmediaGenreCards
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                counts={categoryCounts}
              />
            </section>

            {/* Dynamic Recommendations & Curated Feeds */}
            <div className="space-y-8 sm:space-y-12">
              {selectedCategory === 'none' ? (
                <>
                  {/* Dynamic Personalized Recommendation Rows */}
                  {recommendationRows.map((row) => (
                    <OfmediaCardRow
                      key={row.id}
                      title={row.title}
                      subtitle={row.subtitle}
                      projects={row.projects}
                      onOpenDetails={handleOpenDetails}
                      onPlay={handlePlayProject}
                      favorites={favorites}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}

                  {/* Standard Feeds */}
                  <OfmediaCardRow
                    title="Новинки и хиты OFMEDIA"
                    projects={PROJECTS_DATA.slice(0, 5)}
                    onOpenDetails={handleOpenDetails}
                    onPlay={handlePlayProject}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />

                  <OfmediaCardRow
                    title="Комедийные релизы"
                    subtitle="Искрометный юмор, динамичные скетчи и приключения"
                    projects={comedyProjects}
                    onOpenDetails={handleOpenDetails}
                    onPlay={handlePlayProject}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />

                  <OfmediaCardRow
                    title="Музыка и клипы"
                    subtitle="Официальные видеоклипы, живые выступления и треки"
                    projects={musicProjects}
                    onOpenDetails={handleOpenDetails}
                    onPlay={handlePlayProject}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />

                  <OfmediaCardRow
                    title="Шоу и приключения"
                    subtitle="Экскурсии, влоги и сценические постановки"
                    projects={[...showProjects, ...adventureProjects]}
                    onOpenDetails={handleOpenDetails}
                    onPlay={handlePlayProject}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                </>
              ) : (
                <OfmediaCardRow
                  title={
                    selectedCategory === 'new'
                      ? 'Новинки 2026 года'
                      : selectedCategory === 'comedy'
                      ? 'Комедии'
                      : selectedCategory === 'music'
                      ? 'Музыкальные релизы'
                      : selectedCategory === 'shows'
                      ? 'Шоу и постановки'
                      : 'Приключения и экскурсии'
                  }
                  subtitle={
                    selectedCategory === 'new'
                      ? 'Все премьеры текущего 2026 года'
                      : undefined
                  }
                  projects={filterProjectsByCategory(selectedCategory)}
                  onOpenDetails={handleOpenDetails}
                  onPlay={handlePlayProject}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FAVORITES & RATINGS ("МОЁ") */}
        {activeTab === 'favorites' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-bold text-xl sm:text-3xl text-white">Моя медиатека</h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-normal">
                  Сохраненные фильмы, клипы и персональные оценки
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#121218]/80 border border-white/10 text-xs shadow-md">
                  <span className="text-zinc-400 hidden md:inline">Сортировка:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="rating_desc" className="bg-[#121218] text-white">
                      По рейтингу (от Зелёного 🟢 к Алому 🩸)
                    </option>
                    <option value="year_desc" className="bg-[#121218] text-white">
                      По году выпуска (новые сначала)
                    </option>
                    <option value="title_asc" className="bg-[#121218] text-white">
                      По алфавиту (А–Я)
                    </option>
                  </select>
                </div>

                <div className="flex p-1 bg-zinc-900/90 rounded-2xl border border-white/10 w-fit">
                  <button
                    onClick={() => setFavoritesSubTab('favorites')}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all ${
                      favoritesSubTab === 'favorites'
                        ? 'bg-[#ff5c00] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    В закладках ({favorites.length})
                  </button>
                  <button
                    onClick={() => setFavoritesSubTab('ratings')}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all ${
                      favoritesSubTab === 'ratings'
                        ? 'bg-[#ff5c00] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Мои оценки ({ratedProjects.length})
                  </button>
                </div>
              </div>
            </div>

            {/* 6-Color Rating Scale Legend */}
            {favoritesSubTab === 'ratings' && ratedProjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-2xl bg-[#121218]/60 backdrop-blur-xl border border-white/10 text-[11px] text-zinc-300 shadow-md">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">Шкала цветов:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b050] shadow-[0_0_6px_#00b050]" />
                  <span>Зелёный (9.0–10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#70c020] shadow-[0_0_6px_#70c020]" />
                  <span>Салатовый (7.5–8.9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]" />
                  <span>Жёлтый (6.0–7.4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_6px_#f97316]" />
                  <span>Оранжевый (4.5–5.9)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shadow-[0_0_6px_#dc2626]" />
                  <span>Красный (3.0–4.4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#991b1b] shadow-[0_0_6px_#991b1b]" />
                  <span>Алый (1.0–2.9)</span>
                </div>
              </div>
            )}

            {/* FAVORITES SUB-VIEW */}
            {favoritesSubTab === 'favorites' && (
              <>
                {favoriteProjects.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                    {favoriteProjects.map((project) => {
                      const ratingStats = getMovieRating(project.id);
                      return (
                        <div
                          key={project.id}
                          onClick={() => handleOpenDetails(project)}
                          className="group space-y-2 cursor-pointer"
                        >
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-800 border border-white/5 group-hover:border-[#ff5c00]/50 transition-all shadow-md">
                            <img
                              src={project.poster}
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                            {ratingStats.count > 0 && (
                              <div className="absolute top-2 left-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ratingStats.colorClass}`}>
                                  ★ {ratingStats.scoreFormatted}
                                </span>
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(project.id);
                              }}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                              title="Удалить из закладок"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                              </svg>
                            </button>
                          </div>
                          <div className="space-y-0.5 px-1">
                            <h3 className="font-heading font-medium text-xs sm:text-sm text-white group-hover:text-[#ff5c00] transition-colors truncate">
                              {project.title}
                            </h3>
                            <div className="text-[11px] text-zinc-400 font-normal truncate">
                              <span>{project.year}</span>
                              <span className="mx-1">•</span>
                              <span>{project.genres.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 sm:py-20 text-center bg-[#101014] rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto p-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-heading font-medium text-base sm:text-lg text-white">У вас пока нет сохраненных закладок</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-normal">
                      Нажимайте на значок закладки на карточке любого фильма, чтобы добавить его в свой персональный список.
                    </p>
                    <button
                      onClick={() => setActiveTab('main')}
                      className="px-6 py-2.5 rounded-full bg-[#ff5c00] text-white text-xs font-medium hover:bg-[#e05200] transition-colors shadow-lg shadow-[#ff5c00]/30"
                    >
                      Смотреть главную
                    </button>
                  </div>
                )}
              </>
            )}

            {/* RATINGS SUB-VIEW */}
            {favoritesSubTab === 'ratings' && (
              <>
                {ratedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {ratedProjects.map((project) => {
                      const userScore = userRatings[project.id];
                      return (
                        <div
                          key={project.id}
                          onClick={() => handleOpenDetails(project)}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#101014] border border-white/5 hover:border-[#ff5c00]/50 transition-all flex gap-3.5 items-center cursor-pointer group shadow-md hover:-translate-y-0.5"
                        >
                          <img
                            src={project.poster}
                            alt={project.title}
                            className="w-20 sm:w-24 aspect-video rounded-xl object-cover bg-zinc-800 shrink-0 group-hover:scale-103 transition-transform"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="font-heading font-medium text-xs sm:text-sm text-white group-hover:text-[#ff5c00] transition-colors truncate">
                              {project.title}
                            </h3>
                            <div className="text-[10px] sm:text-[11px] text-zinc-400 font-normal truncate">
                              {project.genres.slice(0, 2).join(', ')} • {project.year}
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-zinc-400">Ваша оценка:</span>
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#ff5c00]/20 text-[#ff5c00]">
                                ★ {userScore} / 10
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 sm:py-20 text-center bg-[#101014] rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto p-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#ff5c00]">
                      ★
                    </div>
                    <h3 className="font-heading font-medium text-base sm:text-lg text-white">Вы пока не оценили ни одного фильма</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-normal">
                      Открывайте страницы фильмов и ставьте оценки от 1 до 10 звёзд — они сохранятся в вашем профиле.
                    </p>
                    <button
                      onClick={() => setActiveTab('main')}
                      className="px-6 py-2.5 rounded-full bg-[#ff5c00] text-white text-xs font-medium hover:bg-[#e05200] transition-colors shadow-lg shadow-[#ff5c00]/30"
                    >
                      Смотреть фильмы
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Fullscreen Standalone Film Page */}
      <OfmediaDetailModal
        project={selectedProject}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onPlay={handlePlayProject}
        onOpenActor={handleOpenActor}
        isFavorite={selectedProject ? favorites.includes(selectedProject.id) : false}
        onToggleFavorite={toggleFavorite}
      />

      {/* Actor & Creator Profile Modal */}
      <OfmediaActorModal
        actor={selectedActor}
        isOpen={isActorModalOpen}
        onClose={() => setIsActorModalOpen(false)}
        onSelectProject={handleOpenDetails}
        onPlayProject={handlePlayProject}
      />

      {/* User Profile & Dashboard Modal */}
      <OfmediaProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onLogout={logoutUser}
        onSelectProject={handleOpenDetails}
        onPlayProject={handlePlayProject}
      />

      {/* Video Player */}
      {selectedProject && (
        <OfmediaPlayer
          project={selectedProject}
          initialEpisode={selectedEpisode}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          onSelectNext={handleSelectNextEpisode}
        />
      )}

      {/* Firebase Auth Modal */}
      <OfmediaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <OfmediaMobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        onOpenSearch={() => {
          const btn = document.querySelector('header button[title="Поиск фильмов и актёров"]') as HTMLButtonElement;
          if (btn) btn.click();
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        isLoggedIn={!!user}
      />

      {/* Desktop Footer */}
      <footer className="border-t border-white/10 bg-[#070709] py-8 sm:py-10 text-zinc-400 text-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logos/ofmediawhite_clean.png"
              alt="OFMEDIA"
              className="h-4 sm:h-5 w-auto object-contain"
            />
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-normal">© 2024–2026 • Все права защищены</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-normal text-xs">
            <button onClick={() => { setActiveTab('main'); setSelectedCategory('none'); }} className="hover:text-white transition-colors">
              Главная
            </button>
            <button onClick={() => { setActiveTab('main'); setSelectedCategory('comedy'); }} className="hover:text-white transition-colors">
              Комедии
            </button>
            <button onClick={() => { setActiveTab('main'); setSelectedCategory('music'); }} className="hover:text-white transition-colors">
              Музыкальные
            </button>
            <button onClick={() => { setActiveTab('main'); setSelectedCategory('shows'); }} className="hover:text-white transition-colors">
              Шоу
            </button>
            <button onClick={() => { setActiveTab('main'); setSelectedCategory('adventure'); }} className="hover:text-white transition-colors">
              Приключения
            </button>

            {/* Mirror / Primary Switch Button with Clean SVGs */}
            {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? (
              <a
                href="https://ofmedia.pages.dev"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 text-[11px] group"
                title="Перейти на основной домен Cloudflare Pages"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current text-[#ff5c00] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
                <span>Основной сайт</span>
              </a>
            ) : (
              <a
                href="https://ofmedia.vercel.app"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 text-[11px] group"
                title="Перейти на резервное зеркало (Vercel)"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current text-[#ff5c00] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>Зеркало</span>
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
