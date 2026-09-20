import type { Project } from '../data/projects';

export interface OfflineMovie {
  id: string;
  title: string;
  year: string;
  duration: string;
  poster: string;
  backdrop: string;
  description: string;
  downloadedAt: number;
  fileSizeMb: number;
  project: Project;
}

const STORAGE_KEY = 'ofmedia_offline_movies';

export const getOfflineMovies = (): OfflineMovie[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isMovieOffline = (id: string): boolean => {
  const movies = getOfflineMovies();
  return movies.some((m) => m.id === id);
};

export const downloadMovieForOffline = async (
  project: Project,
  onProgress?: (percent: number) => void
): Promise<OfflineMovie> => {
  // Simulate progressive chunk caching with real storage save
  for (let pct = 10; pct <= 100; pct += 15) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (onProgress) onProgress(Math.min(100, pct));
  }

  const durationNum = parseInt(project.duration) || 25;
  const estimatedSizeMb = Math.round(durationNum * 4.8); // e.g. ~120MB for 25 min

  const offlineItem: OfflineMovie = {
    id: project.id,
    title: project.title,
    year: String(project.year),
    duration: project.duration,
    poster: project.poster,
    backdrop: project.backdrop,
    description: project.description,
    downloadedAt: Date.now(),
    fileSizeMb: estimatedSizeMb,
    project,
  };

  const existing = getOfflineMovies().filter((m) => m.id !== project.id);
  existing.unshift(offlineItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  window.dispatchEvent(new Event('ofmedia_offline_updated'));
  return offlineItem;
};

export const removeOfflineMovie = (id: string) => {
  const remaining = getOfflineMovies().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new Event('ofmedia_offline_updated'));
};