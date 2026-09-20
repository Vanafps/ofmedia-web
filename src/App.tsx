import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { PROJECTS_DATA } from './data/projects';
import type { Project, Episode } from './data/projects';
import type { Actor } from './data/actors';
import { ACTORS_DATA } from './data/actors';
import { OfmediaHeader } from './components/OfmediaHeader';
import { OfmediaInteractiveHero } from './components/OfmediaInteractiveHero';
import { OfmediaCardRow } from './components/OfmediaCardRow';
import { OfmediaMovieCard } from './components/OfmediaMovieCard';
import { OfmediaDetailModal } from './components/OfmediaDetailModal';
import { OfmediaPlayer } from './components/OfmediaPlayer';
import { OfmediaGenreCards, type GenreCategoryId } from './components/OfmediaGenreCards';
import { OfmediaAuthModal } from './components/OfmediaAuthModal';
import { OfmediaActorModal } from './components/OfmediaActorModal';
import { OfmediaProfileModal } from './components/OfmediaProfileModal';
import { OfmediaMobileNav } from './components/OfmediaMobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadApkPage } from './components/DownloadApkPage';
import { AppLandingPage } from './components/AppLandingPage';
import { OfmediaMobileAppNotice } from './components/OfmediaMobileAppNotice';
import { CustomSelect } from './components/ui/CustomSelect';
import { subscribeToAuth, logoutUser, type UserProfile } from './services/firebase';
import { getUserRatings, getMovieRating } from './services/ratingService';
import { getPersonalizedRecommendations, type RecommendedRow } from './services/recommendationService';
import { getContinueWatchingProjects, type ContinueWatchingItem } from './services/watchHistoryService';
import { checkAndHandleVkRedirect, isNativeAndroid } from './services/vkIdService';
import { checkForAppUpdate, triggerApkDownload, type AppVersionInfo } from './services/updateService';

export function App() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';

  const isApkDownloadRoute = typeof window !== 'undefined' && (
    currentPath.startsWith('/app/apk') ||
    currentPath === '/apk' ||
    currentPath.startsWith('/apk/') ||
    currentSearch.includes('download=apk') ||
    currentPath.endsWith('/app/apk')
  );

  const isAppLandingRoute = typeof window !== 'undefined' && (
    currentPath === '/app' ||
    currentPath === '/app/'
  );

  if (isApkDownloadRoute) {
    return <DownloadApkPage />;
  }

  if (isAppLandingRoute) {
    return <AppLandingPage />;
  }

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
  const [continueWatchingList, setContinueWatchingList] = useState<ContinueWatchingItem[]>(() =>
    getContinueWatchingProjects()
  );

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
    setContinueWatchingList(getContinueWatchingProjects());
  };

  useEffect(() => {
    refreshUserData();
    window.addEventListener('ofmedia_ratings_updated', refreshUserData);
    window.addEventListener('ofmedia_reviews_updated', refreshUserData);
    window.addEventListener('ofmedia_history_updated', refreshUserData);
    return () => {
      window.removeEventListener('ofmedia_ratings_updated', refreshUserData);
      window.removeEventListener('ofmedia_reviews_updated', refreshUserData);
      window.removeEventListener('ofmedia_history_updated', refreshUserData);
    };
  }, []);

  const [showAuthBanner, setShowAuthBanner] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  useEffect(() => {
    // Show auth prompt to unauthenticated visitors after 5 seconds
    const isDismissed = sessionStorage.getItem('ofmedia_auth_prompt_dismissed');
    if (!user && !isDismissed) {
      const timer = setTimeout(() => {
        setShowAuthBanner(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowAuthBanner(false);
    }
  }, [user]);

  const handleDismissAuthBanner = () => {
    setShowAuthBanner(false);
    sessionStorage.setItem('ofmedia_auth_prompt_dismissed', 'true');
  };

  const isAnyModalOpen = isDetailModalOpen || isActorModalOpen || isPlayerOpen || isAuthModalOpen || isProfileModalOpen;

  // Butter-Smooth Kinetic Inertia Scrolling via Lenis (DESKTOP ONLY)
  useEffect(() => {
    // Disable Lenis on touch screens and mobile to eliminate rubber-band bounce
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || isNativeAndroid() || window.innerWidth < 768);
    if (isTouchDevice) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
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

    // Check VK ID redirect return from OAuth
    checkAndHandleVkRedirect().then((vkUser) => {
      if (vkUser) setUser(vkUser);
    });

    // Check for APK updates ONLY inside native Android app
    if (isNativeAndroid()) {
      checkForAppUpdate().then((res) => {
        if (res.updateAvailable && res.latestVersion) {
          setUpdateInfo(res.latestVersion);
          setShowUpdateModal(true);
        }
      });
    }

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // URL Router: Sync route from location (handles direct links, page refresh, and back/forward browser history)
  const syncRouteFromLocation = () => {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(window.location.search);

    // Support legacy query params (?film=... or ?actor=...)
    const filmQuery = params.get('film');
    const actorQuery = params.get('actor');
    if (filmQuery) {
      const match = PROJECTS_DATA.find((p) => p.slug === filmQuery || p.id === filmQuery);
      if (match) {
        setSelectedProject(match);
        setIsDetailModalOpen(true);
        setIsPlayerOpen(false);
        setIsActorModalOpen(false);
        return;
      }
    }
    if (actorQuery) {
      const match = ACTORS_DATA.find((a) => a.slug === actorQuery || a.id === actorQuery);
      if (match) {
        setSelectedActor(match);
        setIsActorModalOpen(true);
        setIsDetailModalOpen(false);
        setIsPlayerOpen(false);
        return;
      }
    }

    // Route: /my or /favorites
    if (pathname === '/my' || pathname === '/favorites') {
      setActiveTab('favorites');
      setIsDetailModalOpen(false);
      setIsPlayerOpen(false);
      setIsActorModalOpen(false);
      return;
    }

    // Route: /actor/:slug
    if (pathname.startsWith('/actor/')) {
      const actorSlug = decodeURIComponent(pathname.replace('/actor/', ''));
      const match = ACTORS_DATA.find((a) => a.slug === actorSlug || a.id === actorSlug);
      if (match) {
        setSelectedActor(match);
        setIsActorModalOpen(true);
        setIsDetailModalOpen(false);
        setIsPlayerOpen(false);
        return;
      }
    }

    // Route: /:slug/player
    const playerMatch = pathname.match(/^\/([^/]+)\/player$/);
    if (playerMatch) {
      const filmSlug = decodeURIComponent(playerMatch[1]);
      const match = PROJECTS_DATA.find((p) => p.slug === filmSlug || p.id === filmSlug);
      if (match) {
        setSelectedProject(match);
        setSelectedEpisode(match.episodes?.[0]);
        setIsPlayerOpen(true);
        setIsDetailModalOpen(false);
        setIsActorModalOpen(false);
        return;
      }
    }

    // Route: /:slug (Direct film page)
    const singleSlug = decodeURIComponent(pathname.replace(/^\//, ''));
    if (singleSlug && singleSlug !== 'main') {
      const match = PROJECTS_DATA.find((p) => p.slug === singleSlug || p.id === singleSlug);
      if (match) {
        setSelectedProject(match);
        setIsDetailModalOpen(true);
        setIsPlayerOpen(false);
        setIsActorModalOpen(false);
        return;
      }
    }

    // Default route: / (Catalog)
    setActiveTab('main');
    setIsDetailModalOpen(false);
    setIsPlayerOpen(false);
    setIsActorModalOpen(false);
  };

  useEffect(() => {
    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, []);

  const toggleFavorite = (projectId: string) => {
    setFavorites((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSelectTab = (tab: 'main' | 'favorites') => {
    setActiveTab(tab);
    if (isDetailModalOpen) setIsDetailModalOpen(false);
    if (isPlayerOpen) setIsPlayerOpen(false);
    if (isActorModalOpen) setIsActorModalOpen(false);
    window.history.pushState(null, '', tab === 'favorites' ? '/my' : '/');
  };

  const handlePlayProject = (project: Project, episode?: Episode) => {
    setSelectedProject(project);
    setSelectedEpisode(episode || project.episodes?.[0]);
    setIsPlayerOpen(true);
    setIsDetailModalOpen(false);
    setIsActorModalOpen(false);
    window.history.pushState({ type: 'player', slug: project.slug }, '', `/${project.slug || project.id}/player`);
  };

  const handleOpenDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
    setIsPlayerOpen(false);
    setIsActorModalOpen(false);
    window.history.pushState({ type: 'film', slug: project.slug }, '', `/${project.slug || project.id}`);
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
    window.history.pushState(null, '', activeTab === 'favorites' ? '/my' : '/');
  };

  const handleSelectGenre = (genre: string) => {
    setActiveTab('main');
    const gLower = genre.toLowerCase();
    if (gLower.includes('ком')) {
      setSelectedCategory('comedy');
    } else if (gLower.includes('муз') || gLower.includes('клип') || gLower.includes('концерт')) {
      setSelectedCategory('music');
    } else if (gLower.includes('шоу') || gLower.includes('постан') || gLower.includes('скетч')) {
      setSelectedCategory('shows');
    } else if (gLower.includes('приключ') || gLower.includes('влог') || gLower.includes('экскурс')) {
      setSelectedCategory('adventure');
    } else {
      setSelectedCategory('none');
    }
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    if (selectedProject) {
      setIsDetailModalOpen(true);
      window.history.pushState({ type: 'film', slug: selectedProject.slug }, '', `/${selectedProject.slug || selectedProject.id}`);
    } else {
      window.history.pushState(null, '', activeTab === 'favorites' ? '/my' : '/');
    }
  };

  const handleOpenActor = (actor: Actor) => {
    setSelectedActor(actor);
    setIsActorModalOpen(true);
    setIsDetailModalOpen(false);
    setIsPlayerOpen(false);
    window.history.pushState({ type: 'actor', slug: actor.slug }, '', `/actor/${actor.slug || actor.id}`);
  };

  const handleCloseActor = () => {
    setIsActorModalOpen(false);
    setSelectedActor(null);
    window.history.pushState(null, '', activeTab === 'favorites' ? '/my' : '/');
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
        setActiveTab={handleSelectTab}
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
            {/* Interactive 3D Hero Banner: ТВОЙ НОВЫЙ OFMEDIA */}
            <OfmediaInteractiveHero
              projects={PROJECTS_DATA}
              onOpenDetails={handleOpenDetails}
              onPlay={handlePlayProject}
            />

            {/* Genre Navigation System */}
            <section id="catalog-section" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <OfmediaGenreCards
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                counts={categoryCounts}
              />
            </section>

            {/* Dynamic Recommendations & Curated Feeds */}
            <div className="space-y-8 sm:space-y-12">
              {/* CONTINUE WATCHING (FIRST ROW BEFORE RECOMMENDATIONS) */}
              {continueWatchingList.length > 0 && (
                <OfmediaCardRow
                  title="Вы смотрели"
                  subtitle="Продолжите просмотр с того момента, где остановились"
                  projects={continueWatchingList.map((c) => c.project)}
                  showRemainingBadge={true}
                  remainingMinutesMap={Object.fromEntries(
                    continueWatchingList.map((c) => [c.project.id, c.remainingMinutes])
                  )}
                  onOpenDetails={handleOpenDetails}
                  onPlay={handlePlayProject}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              )}

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
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs hidden md:inline">Сортировка:</span>
                  <CustomSelect
                    value={sortOrder}
                    onChange={(val) => setSortOrder(val as any)}
                    options={[
                      { value: 'rating_desc', label: 'По рейтингу' },
                      { value: 'year_desc', label: 'По году выпуска' },
                      { value: 'title_asc', label: 'По алфавиту' },
                    ]}
                    triggerClassName="rounded-2xl px-3.5 py-2 bg-[#101012]/90 border border-white/10 text-xs shadow-md"
                  />
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
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-2xl bg-[#101012]/70 backdrop-blur-xl border border-white/10 text-[11px] text-zinc-300 shadow-md">
                <span className="font-semibold text-white uppercase text-[11px] tracking-wide">Шкала цветов:</span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 pt-4 pb-24">
                    {favoriteProjects.map((project) => (
                      <div key={project.id} className="relative aspect-video w-full">
                        <OfmediaMovieCard
                          project={project}
                          onPlay={(p) => handlePlayProject(p)}
                          onOpenDetails={(p) => handleOpenDetails(p)}
                          isFavorite={favorites.includes(project.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 sm:py-20 text-center bg-[#101012] rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto p-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {ratedProjects.map((project) => {
                      const userScore = userRatings[project.id];
                      return (
                        <div key={project.id} className="flex flex-col space-y-2.5">
                          <OfmediaMovieCard
                            project={project}
                            onPlay={(p) => handlePlayProject(p)}
                            onOpenDetails={(p) => handleOpenDetails(p)}
                            isFavorite={favorites.includes(project.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                          <div className="px-3.5 py-2 rounded-xl bg-[#08080a] border border-white/10 flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Ваша оценка:</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#ff5c00]/20 text-[#ff5c00] border border-[#ff5c00]/30 shadow-[0_0_10px_rgba(255,92,0,0.2)]">
                              ★ {userScore} / 10
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 sm:py-20 text-center bg-[#101012] rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto p-6">
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
        onClose={handleCloseDetails}
        onPlay={handlePlayProject}
        onOpenActor={handleOpenActor}
        isFavorite={selectedProject ? favorites.includes(selectedProject.id) : false}
        onToggleFavorite={toggleFavorite}
        onSelectProject={handleOpenDetails}
        onSelectGenre={handleSelectGenre}
        favorites={favorites}
      />

      {/* Actor & Creator Profile Fullscreen Page */}
      <OfmediaActorModal
        actor={selectedActor}
        isOpen={isActorModalOpen}
        onClose={handleCloseActor}
        onSelectProject={handleOpenDetails}
        onPlayProject={handlePlayProject}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
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
          onClose={handleClosePlayer}
          onSelectNext={handleSelectNextEpisode}
        />
      )}

      {/* Firebase Auth Modal */}
      <OfmediaAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      {/* Floating Smart Auth Reminder for Unauthenticated Users with Smooth AnimatePresence */}
      <AnimatePresence>
        {showAuthBanner && !user && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[95] max-w-sm w-[calc(100%-2rem)] bg-[#101012] border border-white/15 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] select-none"
          >
            <button
              onClick={handleDismissAuthBanner}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors text-xs"
              title="Закрыть"
            >
              ✕
            </button>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">🍿</span>
              <div className="space-y-1 pr-4">
                <div className="font-heading font-bold text-xs sm:text-sm text-white">
                  Войдите в OFMEDIA
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Сохраняйте историю просмотров, оценки и продолжайте кино на любых устройствах.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleDismissAuthBanner();
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold shadow-md shadow-[#ff5c00]/30 transition-all hover:scale-103 active:scale-95 cursor-pointer"
                  >
                    Войти
                  </button>
                  <button
                    onClick={handleDismissAuthBanner}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Позже
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Update Modal with Smooth AnimatePresence */}
      <AnimatePresence>
        {showUpdateModal && updateInfo && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowUpdateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#101012] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ff5c00]/20 border border-[#ff5c00]/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">Доступно обновление OFMEDIA</h3>
                  <p className="text-xs text-[#ff5c00] font-mono font-semibold">Версия {updateInfo.versionName}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/8 text-xs text-zinc-300 space-y-1.5 whitespace-pre-line font-normal leading-relaxed">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Что нового:</div>
                {updateInfo.releaseNotes}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    triggerApkDownload(updateInfo.apkUrl);
                    setShowUpdateModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#ff5c00]/30 transition-all active:scale-95 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Скачать и обновить APK</span>
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Позже
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile App Smart Notice (Floating above navigation) */}
      <OfmediaMobileAppNotice />

      {/* Mobile Bottom Navigation Bar */}
      <OfmediaMobileNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        favoritesCount={favorites.length}
        onOpenSearch={() => {
          window.dispatchEvent(new CustomEvent('ofmedia_open_search'));
        }}
        onOpenProfile={() => {
          if (user) {
            setIsProfileModalOpen(true);
          } else {
            setIsAuthModalOpen(true);
          }
        }}
        isLoggedIn={!!user}
        isProfileOpen={isProfileModalOpen}
        onGoHome={() => {
          setIsProfileModalOpen(false);
          setIsDetailModalOpen(false);
          setIsAuthModalOpen(false);
          setIsActorModalOpen(false);
          setActiveTab('main');
        }}
      />

      {/* Footer & App promo: STRICTLY HIDDEN in Native Android App AND on Mobile screens */}
      {!isNativeAndroid() && (
        <div className="hidden md:block">
          {/* Mobile App Download Callout in Footer */}
          <section className="border-t border-white/8 bg-[#09090b] py-8 sm:py-10 text-white select-none">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#ff5c00]/15 border border-[#ff5c00]/25 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  📱
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                    Мобильное приложение OFMEDIA
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Смотрите фильмы и сериалы без рекламы, скачивайте для оффлайн-просмотра и включайте фоновый режим
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <a
                  href="https://www.rustore.ru/catalog/app/ru.ofmedia.app"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/12 text-white text-xs font-semibold flex items-center gap-2 transition-all hover:scale-102 active:scale-98"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                  </svg>
                  <span>RuStore</span>
                </a>

                <a
                  href="/apk"
                  className="px-4 py-2.5 rounded-xl bg-[#ff5c00] hover:bg-[#e05200] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-[#ff5c00]/25 transition-all hover:scale-102 active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Скачать APK</span>
                </a>

                <a
                  href="/app"
                  className="px-3.5 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
                >
                  Подробнее о приложении
                </a>
              </div>
            </div>
          </section>

          {/* Desktop Footer */}
          <footer className="border-t border-white/8 bg-[#08080a] py-8 sm:py-10 text-zinc-400 text-xs">
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
                <button onClick={() => { handleSelectTab('main'); setSelectedCategory('none'); }} className="hover:text-white transition-colors">
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

                {/* Mirror / Primary Switch Button with Clean SVGs (Vercel Primary <-> Netlify Mirror) */}
                {typeof window !== 'undefined' && window.location.hostname.includes('netlify.app') ? (
                  <a
                    href="https://ofmedia.vercel.app"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 text-[11px] group"
                    title="Перейти на основной сайт (Vercel)"
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
                    href="https://ofmedia.netlify.app"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 text-[11px] group"
                    title="Перейти на резервное зеркало (Netlify)"
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
      )}
    </div>
  );
}

export default App;
