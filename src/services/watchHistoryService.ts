import { PROJECTS_DATA, type Project } from '../data/projects';

export interface WatchProgress {
  projectId: string;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
}

export interface ContinueWatchingItem {
  project: Project;
  progress: WatchProgress;
  remainingMinutes: number;
}

const STORAGE_KEY = 'ofmedia_watch_history';

export const saveWatchProgress = (projectId: string, currentTime: number, duration: number) => {
  if (!projectId || !duration || duration <= 0) return;

  const percentage = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: Record<string, WatchProgress> = raw ? JSON.parse(raw) : {};

    // If watched to >= 95%, also mark as fully watched in ofmedia_watched
    if (percentage >= 95) {
      try {
        const watchedRaw = localStorage.getItem('ofmedia_watched');
        const watchedList: string[] = watchedRaw ? JSON.parse(watchedRaw) : [];
        if (!watchedList.includes(projectId)) {
          watchedList.push(projectId);
          localStorage.setItem('ofmedia_watched', JSON.stringify(watchedList));
        }
      } catch {
        // ignore
      }
    }

    history[projectId] = {
      projectId,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      percentage: Math.round(percentage),
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('ofmedia_history_updated'));
  } catch {
    // ignore
  }
};

export const getWatchProgress = (projectId: string): WatchProgress | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const history: Record<string, WatchProgress> = JSON.parse(raw);
    return history[projectId] || null;
  } catch {
    return null;
  }
};

export const getContinueWatchingProjects = (): ContinueWatchingItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const history: Record<string, WatchProgress> = JSON.parse(raw);

    const items: ContinueWatchingItem[] = [];

    for (const [projId, progress] of Object.entries(history)) {
      // Must have watched at least 1% and less than 95%
      if (progress.percentage >= 1 && progress.percentage < 95) {
        const project = PROJECTS_DATA.find((p) => p.id === projId || p.slug === projId);
        if (project) {
          const remainingSec = Math.max(0, progress.duration - progress.currentTime);
          const remainingMinutes = Math.max(1, Math.ceil(remainingSec / 60));
          items.push({
            project,
            progress,
            remainingMinutes,
          });
        }
      }
    }

    return items.sort((a, b) => b.progress.updatedAt - a.progress.updatedAt);
  } catch {
    return [];
  }
};

export const clearWatchProgress = (projectId: string) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const history: Record<string, WatchProgress> = JSON.parse(raw);
    delete history[projectId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('ofmedia_history_updated'));
  } catch {
    // ignore
  }
};