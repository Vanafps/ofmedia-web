import { getCurrentUserId } from './ratingService';

export type ReviewType = 'positive' | 'neutral' | 'negative';

export interface Review {
  id: string;
  projectId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorInitials: string;
  title: string;
  text: string;
  type: ReviewType;
  ratingScore?: number; // 1..10 star rating
  createdAt: string;
  helpfulCount: number;
  unhelpfulCount: number;
  votedUsers: Record<string, 'helpful' | 'unhelpful'>;
}

export interface MovieReviewStats {
  total: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercentage: number;
  reviews: Review[];
}

const REVIEWS_STORAGE_KEY = 'ofmedia_real_reviews_store_v1';

// Initial real store (Starts clean, empty until real users write)
const getStoredReviews = (): Record<string, Review[]> => {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

const saveStoredReviews = (data: Record<string, Review[]>) => {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const getMovieReviews = (projectId: string): MovieReviewStats => {
  const allReviews = getStoredReviews();
  const list = allReviews[projectId] || [];

  const positiveCount = list.filter((r) => r.type === 'positive').length;
  const neutralCount = list.filter((r) => r.type === 'neutral').length;
  const negativeCount = list.filter((r) => r.type === 'negative').length;
  const total = list.length;
  const positivePercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 0;

  // Sort: newest first
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    total,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePercentage,
    reviews: sorted,
  };
};

export const getAllUserReviews = (userId?: string): Review[] => {
  const currentUid = userId || getCurrentUserId();
  const allReviews = getStoredReviews();
  const userReviews: Review[] = [];

  for (const list of Object.values(allReviews)) {
    for (const r of list) {
      if (r.userId === currentUid) {
        userReviews.push(r);
      }
    }
  }
  return userReviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const submitMovieReview = (
  projectId: string,
  data: {
    title: string;
    text: string;
    type: ReviewType;
    ratingScore?: number;
    authorName?: string;
    authorAvatar?: string;
  }
): Review => {
  const allReviews = getStoredReviews();
  if (!allReviews[projectId]) {
    allReviews[projectId] = [];
  }

  const userId = getCurrentUserId();
  const authorName = data.authorName || 'Зритель OFMEDIA';
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Check if user already reviewed this movie - update if so
  const existingIdx = allReviews[projectId].findIndex((r) => r.userId === userId);

  const reviewEntry: Review = {
    id: existingIdx !== -1 ? allReviews[projectId][existingIdx].id : 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    projectId,
    userId,
    authorName,
    authorAvatar: data.authorAvatar,
    authorInitials,
    title: data.title.trim(),
    text: data.text.trim(),
    type: data.type,
    ratingScore: data.ratingScore,
    createdAt: new Date().toISOString(),
    helpfulCount: existingIdx !== -1 ? allReviews[projectId][existingIdx].helpfulCount : 0,
    unhelpfulCount: existingIdx !== -1 ? allReviews[projectId][existingIdx].unhelpfulCount : 0,
    votedUsers: existingIdx !== -1 ? allReviews[projectId][existingIdx].votedUsers : {},
  };

  if (existingIdx !== -1) {
    allReviews[projectId][existingIdx] = reviewEntry;
  } else {
    allReviews[projectId].unshift(reviewEntry);
  }

  saveStoredReviews(allReviews);
  window.dispatchEvent(new Event('ofmedia_reviews_updated'));
  return reviewEntry;
};

export const voteMovieReview = (
  projectId: string,
  reviewId: string,
  vote: 'helpful' | 'unhelpful'
): Review | null => {
  const allReviews = getStoredReviews();
  const list = allReviews[projectId];
  if (!list) return null;

  const review = list.find((r) => r.id === reviewId);
  if (!review) return null;

  const currentUserId = getCurrentUserId();
  const previousVote = review.votedUsers[currentUserId];

  if (previousVote === vote) {
    // Toggle off vote
    delete review.votedUsers[currentUserId];
    if (vote === 'helpful') review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    if (vote === 'unhelpful') review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
  } else {
    // Switch or new vote
    if (previousVote === 'helpful') review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    if (previousVote === 'unhelpful') review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);

    review.votedUsers[currentUserId] = vote;
    if (vote === 'helpful') review.helpfulCount += 1;
    if (vote === 'unhelpful') review.unhelpfulCount += 1;
  }

  saveStoredReviews(allReviews);
  window.dispatchEvent(new Event('ofmedia_reviews_updated'));
  return review;
};

export const deleteMovieReview = (projectId: string, reviewId: string): boolean => {
  const allReviews = getStoredReviews();
  if (!allReviews[projectId]) return false;

  const initialLen = allReviews[projectId].length;
  allReviews[projectId] = allReviews[projectId].filter((r) => r.id !== reviewId);

  if (allReviews[projectId].length !== initialLen) {
    saveStoredReviews(allReviews);
    window.dispatchEvent(new Event('ofmedia_reviews_updated'));
    return true;
  }
  return false;
};
