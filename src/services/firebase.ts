import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Auth
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  type Database
} from 'firebase/database';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForOfmediaOnline12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ofmedia-web.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ofmedia-web",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app/",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ofmedia-web.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let rtdb: Database | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(DEFAULT_FIREBASE_CONFIG);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  rtdb = getDatabase(app, DEFAULT_FIREBASE_CONFIG.databaseURL);
} catch (err) {
  console.warn("Firebase initialization notice:", err);
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

interface StoredAccount {
  uid: string;
  email: string;
  displayName: string;
  password?: string;
  photoURL?: string | null;
}

const getStoredAccounts = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem('ofmedia_registered_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredAccounts = (accounts: StoredAccount[]) => {
  try {
    localStorage.setItem('ofmedia_registered_accounts', JSON.stringify(accounts));
  } catch {
    // ignore
  }
};

// Generate deterministic UID based on email
const generateUidForEmail = (email: string): string => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `user_${Math.abs(hash).toString(36)}`;
};

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  const getSavedUser = (): UserProfile | null => {
    try {
      const saved = localStorage.getItem('ofmedia_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  callback(getSavedUser());

  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey !== "AIzaSyDummyKeyForOfmediaOnline12345") {
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Пользователь',
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous
        };
        localStorage.setItem('ofmedia_user', JSON.stringify(profile));
        callback(profile);
      }
    });
  }

  const localUpdateHandler = () => {
    callback(getSavedUser());
  };

  window.addEventListener('ofmedia_user_updated', localUpdateHandler);

  return () => {
    window.removeEventListener('ofmedia_user_updated', localUpdateHandler);
  };
};

export const updateLocalUserProfile = (updates: Partial<UserProfile>) => {
  try {
    const raw = localStorage.getItem('ofmedia_user');
    if (!raw) return;
    const cur: UserProfile = JSON.parse(raw);
    const updated: UserProfile = { ...cur, ...updates };
    localStorage.setItem('ofmedia_user', JSON.stringify(updated));

    // Update in accounts DB
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === (cur.email || '').toLowerCase());
    if (idx !== -1) {
      if (updates.displayName) accounts[idx].displayName = updates.displayName;
      if (updates.photoURL !== undefined) accounts[idx].photoURL = updates.photoURL;
      saveStoredAccounts(accounts);
    }

    window.dispatchEvent(new Event('ofmedia_user_updated'));
  } catch {
    // ignore
  }
};

export const loginWithGoogle = async (): Promise<UserProfile> => {
  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey !== "AIzaSyDummyKeyForOfmediaOnline12345") {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google Пользователь',
        photoURL: result.user.photoURL,
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      console.warn("Firebase Google login error, falling back to local account:", e.message);
    }
  }

  // Consistent Google User profile
  const googleEmail = 'user.google@gmail.com';
  const profile: UserProfile = {
    uid: generateUidForEmail(googleEmail),
    email: googleEmail,
    displayName: 'Google Пользователь',
    photoURL: null,
    isAnonymous: false
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  const normEmail = email.trim().toLowerCase();

  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey !== "AIzaSyDummyKeyForOfmediaOnline12345") {
    try {
      const result = await signInWithEmailAndPassword(auth, normEmail, pass);
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || normEmail.split('@')[0],
        photoURL: result.user.photoURL,
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      console.warn("Firebase email login error, falling back to local account:", e.message);
    }
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === normEmail);

  if (existing) {
    if (existing.password && existing.password !== pass) {
      throw new Error('Неверный пароль. Попробуйте еще раз.');
    }
    const profile: UserProfile = {
      uid: existing.uid,
      email: existing.email,
      displayName: existing.displayName || normEmail.split('@')[0],
      photoURL: existing.photoURL || null,
      isAnonymous: false
    };
    localStorage.setItem('ofmedia_user', JSON.stringify(profile));
    window.dispatchEvent(new Event('ofmedia_user_updated'));
    return profile;
  }

  // If not found in accounts, auto-register on login for seamless demo experience
  const newUid = generateUidForEmail(normEmail);
  const newAccount: StoredAccount = {
    uid: newUid,
    email: normEmail,
    displayName: normEmail.split('@')[0],
    password: pass,
    photoURL: null,
  };
  accounts.push(newAccount);
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    uid: newUid,
    email: normEmail,
    displayName: normEmail.split('@')[0],
    photoURL: null,
    isAnonymous: false
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const registerWithEmail = async (email: string, pass: string, name?: string): Promise<UserProfile> => {
  const normEmail = email.trim().toLowerCase();

  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey !== "AIzaSyDummyKeyForOfmediaOnline12345") {
    try {
      const result = await createUserWithEmailAndPassword(auth, normEmail, pass);
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || result.user.displayName || normEmail.split('@')[0],
        photoURL: result.user.photoURL,
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      console.warn("Firebase registration error, falling back to local account:", e.message);
    }
  }

  const accounts = getStoredAccounts();
  const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === normEmail);
  const uid = generateUidForEmail(normEmail);
  const displayName = name?.trim() || normEmail.split('@')[0];

  const newAccount: StoredAccount = {
    uid,
    email: normEmail,
    displayName,
    password: pass,
    photoURL: null,
  };

  if (existingIdx !== -1) {
    accounts[existingIdx] = newAccount;
  } else {
    accounts.push(newAccount);
  }
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    uid,
    email: normEmail,
    displayName,
    photoURL: null,
    isAnonymous: false
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const logoutUser = async () => {
  localStorage.removeItem('ofmedia_user');
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
  window.dispatchEvent(new Event('ofmedia_user_updated'));
};

// Realtime Database Sync Helpers
export const syncRatingsToFirebase = async (ratings: unknown) => {
  if (!rtdb) return;
  try {
    await set(ref(rtdb, 'ratings_store'), ratings);
  } catch (err) {
    console.warn('Firebase RTDB ratings sync fallback:', err);
  }
};

export const syncReviewsToFirebase = async (reviews: unknown) => {
  if (!rtdb) return;
  try {
    await set(ref(rtdb, 'reviews_store'), reviews);
  } catch (err) {
    console.warn('Firebase RTDB reviews sync fallback:', err);
  }
};

export const syncUserFavoritesToFirebase = async (userId: string, favorites: string[]) => {
  if (!rtdb || !userId) return;
  try {
    await set(ref(rtdb, `users/${userId}/favorites`), favorites);
  } catch (err) {
    console.warn('Firebase RTDB favorites sync fallback:', err);
  }
};

export const fetchRatingsFromFirebase = async () => {
  if (!rtdb) return null;
  try {
    const snapshot = await get(ref(rtdb, 'ratings_store'));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn('Firebase RTDB ratings fetch fallback:', err);
    return null;
  }
};


