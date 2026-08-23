export type RatingColorTier = 'green' | 'lime' | 'yellow' | 'orange' | 'red' | 'scarlet' | 'neutral';

export interface RatingColorInfo {
  tier: RatingColorTier;
  label: string;
  colorHex: string;
  bgClass: string;
  textClass: string;
  glowClass: string;
}

export interface MovieRatingStats {
  score: number | null; // null if 0 votes
  scoreFormatted: string; // e.g. "9.0" or "—"
  count: number; // exact real count of submitted votes (0, 1, 2...)
  countFormatted: string; // e.g. "1 оценка", "3 оценки", "Нет оценок"
  userRating: number | null; // current user's star rating (1..10) or null
  votes: Record<string, number>; // userId -> score (1..10)
  histogram: Record<number, number>; // star (1..10) -> count
  percentages: Record<number, number>; // star (1..10) -> percentage (0..100)
  colorInfo: RatingColorInfo;
  colorClass: string;
  colorHex: string;
}

// Storage keys
const REAL_RATINGS_STORAGE_KEY = 'ofmedia_real_ratings_store_v2';
const USER_RATINGS_STORAGE_KEY = 'ofmedia_my_ratings_v2';

/**
 * 6-Tier Rating Color Scale:
 * 1. Зелёный (9.0 - 10.0) -> #00b050
 * 2. Салатовый (7.5 - 8.9) -> #70c020
 * 3. Жёлтый (6.0 - 7.4)   -> #eab308
 * 4. Оранжевый (4.5 - 5.9) -> #f97316
 * 5. Красный (3.0 - 4.4)  -> #dc2626
 * 6. Алый (1.0 - 2.9)     -> #881337 / #be123c
 */
export const getRatingColorInfo = (score: number | null): RatingColorInfo => {
  if (score === null) {
    return {
      tier: 'neutral',
      label: 'Нет оценок',
      colorHex: '#71717a',
      bgClass: 'bg-white/10 border border-white/15 text-zinc-300',
      textClass: 'text-zinc-400',
      glowClass: 'shadow-none',
    };
  }

  // 1. Зелёный
  if (score >= 9.0) {
    return {
      tier: 'green',
      label: 'Зелёный (9.0–10)',
      colorHex: '#00b050',
      bgClass: 'bg-[#00b050] text-white shadow-[0_0_12px_rgba(0,176,80,0.5)]',
      textClass: 'text-[#00b050]',
      glowClass: 'shadow-[0_0_12px_rgba(0,176,80,0.5)]',
    };
  }

  // 2. Салатовый
  if (score >= 7.5) {
    return {
      tier: 'lime',
      label: 'Салатовый (7.5–8.9)',
      colorHex: '#70c020',
      bgClass: 'bg-[#70c020] text-white shadow-[0_0_12px_rgba(112,192,32,0.5)]',
      textClass: 'text-[#70c020]',
      glowClass: 'shadow-[0_0_12px_rgba(112,192,32,0.5)]',
    };
  }

  // 3. Жёлтый
  if (score >= 6.0) {
    return {
      tier: 'yellow',
      label: 'Жёлтый (6.0–7.4)',
      colorHex: '#eab308',
      bgClass: 'bg-[#eab308] text-black font-bold shadow-[0_0_12px_rgba(234,179,8,0.5)]',
      textClass: 'text-[#eab308]',
      glowClass: 'shadow-[0_0_12px_rgba(234,179,8,0.5)]',
    };
  }

  // 4. Оранжевый
  if (score >= 4.5) {
    return {
      tier: 'orange',
      label: 'Оранжевый (4.5–5.9)',
      colorHex: '#f97316',
      bgClass: 'bg-[#f97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]',
      textClass: 'text-[#f97316]',
      glowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]',
    };
  }

  // 5. Красный
  if (score >= 3.0) {
    return {
      tier: 'red',
      label: 'Красный (3.0–4.4)',
      colorHex: '#dc2626',
      bgClass: 'bg-[#dc2626] text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]',
      textClass: 'text-[#dc2626]',
      glowClass: 'shadow-[0_0_12px_rgba(220,38,38,0.5)]',
    };
  }

  // 6. Алый
  return {
    tier: 'scarlet',
    label: 'Алый (1.0–2.9)',
    colorHex: '#991b1b',
    bgClass: 'bg-[#991b1b] text-white border border-rose-500/40 shadow-[0_0_12px_rgba(153,27,27,0.6)]',
    textClass: 'text-[#fb7185]',
    glowClass: 'shadow-[0_0_12px_rgba(153,27,27,0.6)]',
  };
};

export const getStarColorInfo = (star: number): RatingColorInfo => {
  return getRatingColorInfo(star);
};

// Helper to get or create persistent user ID
export const getCurrentUserId = (): string => {
  try {
    const savedUser = localStorage.getItem('ofmedia_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.uid) return parsed.uid;
    }
  } catch {
    // ignore
  }

  let deviceId = localStorage.getItem('ofmedia_device_uid');
  if (!deviceId) {
    deviceId = 'usr_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('ofmedia_device_uid', deviceId);
  }
  return deviceId;
};

// Load all real ratings
export const getAllRealRatingsDB = (): Record<string, Record<string, number>> => {
  try {
    const raw = localStorage.getItem(REAL_RATINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

const saveAllRealRatingsDB = (data: Record<string, Record<string, number>>) => {
  try {
    localStorage.setItem(REAL_RATINGS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const formatVoteCount = (count: number): string => {
  if (count === 0) return 'Нет оценок';
  const rem10 = count % 10;
  const rem100 = count % 100;

  if (rem100 >= 11 && rem100 <= 19) {
    return `${count} оценок`;
  }
  if (rem10 === 1) {
    return `${count} оценка`;
  }
  if (rem10 >= 2 && rem10 <= 4) {
    return `${count} оценки`;
  }
  return `${count} оценок`;
};

// Compute real stats strictly from real submitted user votes
export const getMovieRating = (projectId: string): MovieRatingStats => {
  const db = getAllRealRatingsDB();
  const movieVotes = db[projectId] || {};
  const currentUserId = getCurrentUserId();
  const userScore = movieVotes[currentUserId] ?? null;

  const userIds = Object.keys(movieVotes);
  const totalCount = userIds.length;

  const histogram: Record<number, number> = {
    10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
  };

  let totalPoints = 0;
  for (const uid of userIds) {
    const s = movieVotes[uid];
    if (s >= 1 && s <= 10) {
      histogram[s] = (histogram[s] || 0) + 1;
      totalPoints += s;
    }
  }

  const score = totalCount > 0 ? Math.round((totalPoints / totalCount) * 10) / 10 : null;
  const scoreFormatted = score !== null ? score.toFixed(1) : '—';
  const countFormatted = formatVoteCount(totalCount);
  const colorInfo = getRatingColorInfo(score);

  const percentages: Record<number, number> = {};
  for (let star = 1; star <= 10; star++) {
    percentages[star] = totalCount > 0 ? Math.round((histogram[star] / totalCount) * 100) : 0;
  }

  return {
    score,
    scoreFormatted,
    count: totalCount,
    countFormatted,
    userRating: userScore,
    votes: movieVotes,
    histogram,
    percentages,
    colorInfo,
    colorClass: colorInfo.bgClass,
    colorHex: colorInfo.colorHex,
  };
};

export const getUserRatings = (): Record<string, number> => {
  const db = getAllRealRatingsDB();
  const currentUserId = getCurrentUserId();
  const result: Record<string, number> = {};

  for (const [projectId, votes] of Object.entries(db)) {
    if (votes[currentUserId] !== undefined) {
      result[projectId] = votes[currentUserId];
    }
  }
  return result;
};

export const submitMovieRating = (projectId: string, score: number): MovieRatingStats => {
  const db = getAllRealRatingsDB();
  if (!db[projectId]) {
    db[projectId] = {};
  }
  const currentUserId = getCurrentUserId();
  db[projectId][currentUserId] = score;

  saveAllRealRatingsDB(db);

  try {
    const userRatings = getUserRatings();
    localStorage.setItem(USER_RATINGS_STORAGE_KEY, JSON.stringify(userRatings));
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event('ofmedia_ratings_updated'));
  return getMovieRating(projectId);
};

export const deleteMovieRating = (projectId: string): MovieRatingStats => {
  const db = getAllRealRatingsDB();
  const currentUserId = getCurrentUserId();

  if (db[projectId] && db[projectId][currentUserId] !== undefined) {
    delete db[projectId][currentUserId];
    if (Object.keys(db[projectId]).length === 0) {
      delete db[projectId];
    }
    saveAllRealRatingsDB(db);
  }

  try {
    const userRatings = getUserRatings();
    localStorage.setItem(USER_RATINGS_STORAGE_KEY, JSON.stringify(userRatings));
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event('ofmedia_ratings_updated'));
  return getMovieRating(projectId);
};
