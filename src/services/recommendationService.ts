import type { Project } from '../data/projects';
import { PROJECTS_DATA } from '../data/projects';
import { getMovieRating } from './ratingService';

export interface RecommendedRow {
  id: string;
  title: string;
  subtitle?: string;
  reason?: string;
  projects: Project[];
}

export const calculateSimilarityScore = (p1: Project, p2: Project): number => {
  if (p1.id === p2.id) return -1;

  let score = 0;

  // 1. Shared genres (up to 40 pts)
  const sharedGenres = p1.genres.filter((g) => p2.genres.includes(g));
  score += sharedGenres.length * 15;

  // 2. Shared cast / creators (up to 45 pts)
  const p1CastNames = p1.cast.map((c) => c.name.toLowerCase());
  const p2CastNames = p2.cast.map((c) => c.name.toLowerCase());
  const sharedCast = p1CastNames.filter((name) => p2CastNames.includes(name));
  score += sharedCast.length * 20;

  // 3. Close release years (up to 15 pts)
  const yearDiff = Math.abs(p1.year - p2.year);
  if (yearDiff === 0) score += 15;
  else if (yearDiff === 1) score += 10;
  else if (yearDiff === 2) score += 5;

  return score;
};

export const getSimilarProjects = (currentProject: Project, limit = 5): Project[] => {
  const scored = PROJECTS_DATA
    .filter((p) => p.id !== currentProject.id)
    .map((p) => ({
      project: p,
      score: calculateSimilarityScore(currentProject, p),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.project);
};

export const getPersonalizedRecommendations = (): RecommendedRow[] => {
  const rows: RecommendedRow[] = [];

  // Get user watch history
  let watchedIds: string[] = [];
  try {
    const raw = localStorage.getItem('ofmedia_watched');
    if (raw) watchedIds = JSON.parse(raw);
  } catch {
    watchedIds = [];
  }

  // Get user bookmarks
  let favIds: string[] = [];
  try {
    const raw = localStorage.getItem('ofmedia_favs');
    if (raw) favIds = JSON.parse(raw);
  } catch {
    favIds = [];
  }

  // 1. "Потому что вы смотрели [Фильм]" (if user watched at least 1 film)
  if (watchedIds.length > 0) {
    const lastWatchedId = watchedIds[watchedIds.length - 1];
    const baseProject = PROJECTS_DATA.find((p) => p.id === lastWatchedId);
    if (baseProject) {
      const similar = getSimilarProjects(baseProject, 4);
      if (similar.length > 0) {
        rows.push({
          id: 'because-you-watched',
          title: `Потому что вы смотрели «${baseProject.title}»`,
          subtitle: 'Похожие фильмы и клипы на основе жанров и состава создателей',
          reason: 'На основе истории просмотров',
          projects: similar,
        });
      }
    }
  }

  // 2. "Рекомендовано вам" (personalized by bookmarks / top ratings)
  const interestProjects = PROJECTS_DATA.filter(
    (p) => favIds.includes(p.id) || watchedIds.includes(p.id)
  );

  if (interestProjects.length > 0) {
    // Collect all genres the user interacts with
    const genreCounts: Record<string, number> = {};
    for (const p of interestProjects) {
      for (const g of p.genres) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }

    const topGenres = Object.keys(genreCounts).sort(
      (a, b) => genreCounts[b] - genreCounts[a]
    );

    if (topGenres.length > 0) {
      const recommended = PROJECTS_DATA.filter(
        (p) =>
          !watchedIds.includes(p.id) &&
          p.genres.some((g) => topGenres.slice(0, 2).includes(g))
      );

      if (recommended.length >= 2) {
        rows.push({
          id: 'recommended-for-you',
          title: 'Рекомендовано для вас',
          subtitle: `Подборка на основе ваших любимых жанров: ${topGenres.slice(0, 2).join(', ')}`,
          reason: 'Персональная подборка',
          projects: recommended,
        });
      }
    }
  }

  // 3. "Топ по рейтингу зрителей" (highest rated)
  const topRated = [...PROJECTS_DATA]
    .filter((p) => {
      const r = getMovieRating(p.id);
      return r.score !== null && r.score >= 6.0;
    })
    .sort((a, b) => {
      const rA = getMovieRating(a.id).score || 0;
      const rB = getMovieRating(b.id).score || 0;
      return rB - rA;
    });

  if (topRated.length > 0) {
    rows.push({
      id: 'top-rated',
      title: 'Топ сообщества OFMEDIA',
      subtitle: 'Релизы с наивысшими оценками от реальных зрителей',
      reason: 'Высокий рейтинг',
      projects: topRated,
    });
  }

  return rows;
};
