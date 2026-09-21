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

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJYIBwtTk17jV7P5KB62wKuT1RBgRCGjw",
  authDomain: "ofmedia-web.firebaseapp.com",
  projectId: "ofmedia-web",
  databaseURL: "https://ofmedia-web-default-rtdb.europe-west1.firebasedatabase.app",
  storageBucket: "ofmedia-web.firebasestorage.app",
  messagingSenderId: "355690410762",
  appId: "1:355690410762:web:3fcb211aaba30808e480f3"
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
  if (DEFAULT_FIREBASE_CONFIG.databaseURL) {
    rtdb = getDatabase(app, DEFAULT_FIREBASE_CONFIG.databaseURL);
  }
} catch (err) {
  console.warn("Firebase initialization notice:", err);
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  avatarIcon?: string | null;
  username?: string | null;
  isAnonymous?: boolean;
}

export interface StoredAccount {
  uid: string;
  identifier: string; // username or email in lowercase
  email?: string;
  displayName: string;
  password?: string;
  photoURL?: string | null;
  avatarIcon?: string | null;
}

export const CINEMA_AVATARS = [
  { id: 'popcorn', label: 'Попкорн', src: '/avatars/avatar_popcorn.jpg', bg: 'from-orange-500 to-amber-600' },
  { id: 'clapper', label: 'Хлопушка', src: '/avatars/avatar_clapper.jpg', bg: 'from-zinc-700 to-zinc-900' },
  { id: 'camera', label: 'Камера', src: '/avatars/avatar_camera.jpg', bg: 'from-zinc-700 to-zinc-800' },
  { id: 'star', label: 'Звезда', src: '/avatars/avatar_star.jpg', bg: 'from-amber-400 to-orange-500' },
  { id: 'ticket', label: 'Билеты', src: '/avatars/avatar_ticket.jpg', bg: 'from-amber-500 to-yellow-600' },
  { id: 'headphones', label: 'Звук', src: '/avatars/avatar_headphones.jpg', bg: 'from-zinc-800 to-black' },
];

export const getStoredAccounts = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem('ofmedia_registered_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredAccounts = (accounts: StoredAccount[]) => {
  try {
    localStorage.setItem('ofmedia_registered_accounts', JSON.stringify(accounts));
  } catch {
    // ignore
  }
};

// Generate deterministic UID based on string identifier
const generateUidForId = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `user_${Math.abs(hash).toString(36)}`;
};

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  const getSavedUser = (): UserProfile | null => {
    try {
      const saved = localStorage.getItem('ofmedia_user');
      if (!saved) return null;
      const parsed: UserProfile = JSON.parse(saved);
      if (!parsed.avatarIcon && !parsed.photoURL) {
        parsed.avatarIcon = 'popcorn';
      }
      return parsed;
    } catch {
      return null;
    }
  };

  callback(getSavedUser());

  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Dummy')) {
    onAuthStateChanged(auth, (firebaseUser: User | null) => {
      const saved = getSavedUser();
      // Never overwrite active VK ID, registered Email, or Guest session
      if (saved && (saved.uid?.startsWith('vk_') || saved.uid?.startsWith('user_') || saved.uid?.startsWith('guest_') || saved.isAnonymous)) {
        return;
      }
      if (firebaseUser && !saved) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Пользователь',
          photoURL: firebaseUser.photoURL,
          avatarIcon: 'popcorn',
          isAnonymous: firebaseUser.isAnonymous
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
  window.addEventListener('storage', (e) => {
    if (e.key === 'ofmedia_user') {
      callback(getSavedUser());
    }
  });

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
    const idx = accounts.findIndex((a) => a.uid === cur.uid);
    if (idx !== -1) {
      if (updates.displayName) accounts[idx].displayName = updates.displayName;
      if (updates.photoURL !== undefined) accounts[idx].photoURL = updates.photoURL;
      if (updates.avatarIcon !== undefined) accounts[idx].avatarIcon = updates.avatarIcon;
      saveStoredAccounts(accounts);
    }

    window.dispatchEvent(new Event('ofmedia_user_updated'));
  } catch {
    // ignore
  }
};

export const loginWithGoogle = async (): Promise<UserProfile> => {
  if (auth && DEFAULT_FIREBASE_CONFIG.apiKey && !DEFAULT_FIREBASE_CONFIG.apiKey.includes('Dummy')) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Пользователь',
        photoURL: result.user.photoURL,
        avatarIcon: 'star',
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      console.warn("Firebase Google login error, falling back to local account:", e.message);
    }
  }

  // Quick Google-style login
  const googleEmail = 'user.google@gmail.com';
  const profile: UserProfile = {
    uid: generateUidForId(googleEmail),
    email: googleEmail,
    displayName: 'Google Пользователь',
    photoURL: null,
    avatarIcon: 'star',
    isAnonymous: false
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const loginAsGuest = async (): Promise<UserProfile> => {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const profile: UserProfile = {
    uid: `guest_${guestNumber}`,
    email: null,
    displayName: `Гость #${guestNumber}`,
    photoURL: null,
    avatarIcon: 'popcorn',
    isAnonymous: true
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const loginWithEmail = async (identifier: string, pass: string): Promise<UserProfile> => {
  const normId = identifier.trim().toLowerCase();
  if (!normId) throw new Error('Введите логин или email');
  if (!pass) throw new Error('Введите пароль');

  const email = normId.includes('@') ? normId : `${normId}@ofmedia.ru`;

  if (auth) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || normId.split('@')[0],
        photoURL: result.user.photoURL,
        avatarIcon: 'popcorn',
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        throw new Error('Неверный пароль. Пожалуйста, проверьте ввод.');
      }
      if (e.code === 'auth/user-not-found') {
        throw new Error('Пользователь не найден. Зарегистрируйтесь во вкладке «Регистрация».');
      }
      console.warn("Firebase email login notice:", e.message);
    }
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find(
    (a) =>
      a.identifier.toLowerCase() === normId ||
      (a.email && a.email.toLowerCase() === normId) ||
      a.displayName.toLowerCase() === normId
  );

  if (!existing) {
    throw new Error('Аккаунт с таким логином или email не найден. Зарегистрируйтесь во вкладке «Регистрация».');
  }

  if (existing.password && existing.password !== pass) {
    throw new Error('Неверный пароль. Пожалуйста, проверьте ввод.');
  }

  const profile: UserProfile = {
    uid: existing.uid,
    email: existing.email || normId,
    displayName: existing.displayName || normId.split('@')[0],
    photoURL: existing.photoURL || null,
    avatarIcon: existing.avatarIcon || 'popcorn',
    isAnonymous: false
  };
  localStorage.setItem('ofmedia_user', JSON.stringify(profile));
  window.dispatchEvent(new Event('ofmedia_user_updated'));
  return profile;
};

export const registerWithEmail = async (
  identifier: string,
  pass: string,
  name?: string,
  avatarIcon?: string
): Promise<UserProfile> => {
  const normId = identifier.trim().toLowerCase();
  if (!normId) throw new Error('Введите логин или email');
  if (!pass || pass.length < 4) throw new Error('Пароль должен быть не менее 4 символов');

  const email = normId.includes('@') ? normId : `${normId}@ofmedia.ru`;

  if (auth) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || result.user.displayName || normId.split('@')[0],
        photoURL: result.user.photoURL,
        avatarIcon: avatarIcon || 'popcorn',
        isAnonymous: false
      };
      localStorage.setItem('ofmedia_user', JSON.stringify(profile));
      window.dispatchEvent(new Event('ofmedia_user_updated'));
      return profile;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        throw new Error('Аккаунт с таким логином или email уже зарегистрирован. Перейдите на вкладку «Войти».');
      }
      if (e.code === 'auth/weak-password') {
        throw new Error('Пароль слишком простой (минимум 6 символов).');
      }
      console.warn("Firebase registration notice:", e.message);
    }
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find(
    (a) =>
      a.identifier.toLowerCase() === normId ||
      (a.email && a.email.toLowerCase() === normId)
  );

  if (existing) {
    throw new Error('Аккаунт с таким логином или email уже зарегистрирован. Перейдите на вкладку «Войти».');
  }

  const uid = generateUidForId(normId);
  const displayName = name?.trim() || normId.split('@')[0];

  const newAccount: StoredAccount = {
    uid,
    identifier: normId,
    email: normId.includes('@') ? normId : undefined,
    displayName,
    password: pass,
    photoURL: null,
    avatarIcon: avatarIcon || 'popcorn',
  };

  accounts.push(newAccount);
  saveStoredAccounts(accounts);

  const profile: UserProfile = {
    uid,
    email: newAccount.email || null,
    displayName,
    photoURL: null,
    avatarIcon: avatarIcon || 'popcorn',
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


