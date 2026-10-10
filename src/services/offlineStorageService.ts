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
const DB_NAME = 'ofmedia_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_videos';
export const OFFLINE_CACHE_NAME = 'ofmedia-offline-v1';

// Open or initialize IndexedDB for binary video blob storage
const openOfflineDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

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

/**
 * Custom HLS.js Loader that checks the Cache Storage first,
 * enabling seamless offline playback of HLS streams (.m3u8 + .ts segments) without internet.
 */
export function getOfflineHlsLoaderClass(BaseLoaderClass: any): any {
  return class OfflineHlsLoader extends (BaseLoaderClass || class {}) {
    constructor(config: any) {
      super(config);
      if (!(this as any).stats) {
        (this as any).stats = {
          aborted: false,
          loaded: 0,
          retry: 0,
          total: 0,
          chunkCount: 0,
          bwEstimate: 0,
          loading: { start: 0, first: 0, end: 0 },
          parsing: { start: 0, end: 0 },
          buffering: { start: 0, first: 0, end: 0 },
        };
      }
    }

    load(context: any, config: any, callbacks: any) {
      const url = context.url;
      if (typeof window !== 'undefined' && 'caches' in window) {
        const now = performance.now();
        caches
          .open(OFFLINE_CACHE_NAME)
          .then((cache) => cache.match(url))
          .then((matched) => {
            if (!matched) {
              super.load(context, config, callbacks);
              return;
            }
            const isBinary = context.responseType === 'arraybuffer';
            if (isBinary) {
              matched
                .arrayBuffer()
                .then((buf) => {
                  const stats = (this as any).stats || {
                    trequest: now,
                    tfirst: now + 1,
                    tload: performance.now(),
                    loaded: buf.byteLength,
                    total: buf.byteLength,
                  };
                  callbacks.onSuccess({ url, data: buf }, stats, context, null);
                })
                .catch(() => {
                  super.load(context, config, callbacks);
                });
            } else {
              matched
                .text()
                .then((txt) => {
                  const stats = (this as any).stats || {
                    trequest: now,
                    tfirst: now + 1,
                    tload: performance.now(),
                    loaded: txt.length,
                    total: txt.length,
                  };
                  callbacks.onSuccess({ url, data: txt }, stats, context, null);
                })
                .catch(() => {
                  super.load(context, config, callbacks);
                });
            }
          })
          .catch(() => {
            super.load(context, config, callbacks);
          });
      } else {
        super.load(context, config, callbacks);
      }
    }
  };
}

/**
 * Retrieve local offline Blob URL for playback without internet
 */
export const getOfflineVideoBlobUrl = async (id: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const db = await openOfflineDb();
    const blob: Blob | null = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });

    if (blob && blob.size > 10000 && blob.type.startsWith('video/')) {
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('Error reading video from IndexedDB:', err);
  }

  // Fallback to Cache API if available for direct MP4
  try {
    if ('caches' in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const movies = getOfflineMovies();
      const movie = movies.find((m) => m.id === id);
      if (movie && movie.project.videoUrl && !movie.project.videoUrl.includes('.m3u8')) {
        const cachedRes = await cache.match(movie.project.videoUrl);
        if (cachedRes) {
          const cachedBlob = await cachedRes.blob();
          if (cachedBlob.size > 10000) {
            return URL.createObjectURL(cachedBlob);
          }
        }
      }
    }
  } catch (cacheErr) {
    console.warn('Error reading video from Cache Storage:', cacheErr);
  }

  return null;
};

/**
 * Offline download for both HLS streams (.m3u8 with segments) and MP4 direct videos
 */
export const downloadMovieForOffline = async (
  project: Project,
  onProgress?: (percent: number) => void
): Promise<OfflineMovie> => {
  if (onProgress) onProgress(5);

  let downloadedBytes = 0;
  const isHls = project.videoUrl.includes('.m3u8');

  if (isHls && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(OFFLINE_CACHE_NAME);

      // 1. Fetch Master Playlist
      const masterRes = await fetch(project.videoUrl);
      if (!masterRes.ok) throw new Error(`HTTP ${masterRes.status} fetching master playlist`);
      const masterText = await masterRes.text();
      downloadedBytes += masterText.length;
      await cache.put(
        project.videoUrl,
        new Response(masterText, {
          headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
        })
      );
      if (onProgress) onProgress(10);

      // 2. Extract Sub-playlist (select 720p or 480p for high-quality, efficient offline size)
      const lines = masterText.split('\n').map((l) => l.trim()).filter(Boolean);
      let targetSubPath = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('720p') || line.includes('480p') || line.endsWith('.m3u8')) {
          if (!line.startsWith('#')) {
            targetSubPath = line;
            break;
          }
        }
      }
      if (!targetSubPath) {
        targetSubPath = lines.find((l) => !l.startsWith('#') && l.endsWith('.m3u8')) || '';
      }

      if (targetSubPath) {
        const subPlaylistUrl = new URL(targetSubPath, project.videoUrl).href;
        const subRes = await fetch(subPlaylistUrl);
        if (subRes.ok) {
          const subText = await subRes.text();
          downloadedBytes += subText.length;
          await cache.put(
            subPlaylistUrl,
            new Response(subText, {
              headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
            })
          );
          if (onProgress) onProgress(15);

          // 3. Extract TS segments
          const subLines = subText.split('\n').map((l) => l.trim()).filter(Boolean);
          const segmentFiles = subLines.filter((l) => !l.startsWith('#') && l.endsWith('.ts'));

          for (let sIdx = 0; sIdx < segmentFiles.length; sIdx++) {
            const segFile = segmentFiles[sIdx];
            const segUrl = new URL(segFile, subPlaylistUrl).href;
            try {
              const segRes = await fetch(segUrl);
              if (segRes.ok) {
                const segBuf = await segRes.arrayBuffer();
                downloadedBytes += segBuf.byteLength;
                await cache.put(
                  segUrl,
                  new Response(segBuf, {
                    headers: { 'Content-Type': 'video/mp2t' }
                  })
                );
              }
            } catch (segErr) {
              console.warn(`Segment download error ${segFile}:`, segErr);
            }
            const pct = Math.min(95, Math.round((sIdx / Math.max(1, segmentFiles.length)) * 80) + 15);
            if (onProgress) onProgress(pct);
          }
        }
      }
    } catch (hlsErr) {
      console.warn('HLS cache download notice:', hlsErr);
    }
  } else {
    // Direct MP4 video download with chunk streaming and IndexedDB binary storage
    let videoBlob: Blob | null = null;
    try {
      const response = await fetch(project.videoUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} fetching video`);
      }

      const contentLength = Number(response.headers.get('content-length')) || 0;
      if (response.body && contentLength > 0) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            downloadedBytes += value.length;
            const pct = Math.min(95, Math.round((downloadedBytes / contentLength) * 90) + 5);
            if (onProgress) onProgress(pct);
          }
        }
        videoBlob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
      } else {
        videoBlob = await response.blob();
        downloadedBytes = videoBlob.size;
      }

      if (videoBlob) {
        const db = await openOfflineDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const putReq = store.put({
            id: project.id,
            blob: videoBlob,
            downloadedAt: Date.now(),
            size: downloadedBytes,
          });
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        });
      }
    } catch (fetchErr) {
      console.warn('Direct stream fetch failed:', fetchErr);
    }
  }

  // Cache poster & backdrop in Cache Storage
  try {
    if ('caches' in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      if (project.poster) cache.add(project.poster).catch(() => {});
      if (project.backdrop) cache.add(project.backdrop).catch(() => {});
    }
  } catch {}

  const sizeMb = Math.max(1, Math.round(downloadedBytes / (1024 * 1024))) || 45;

  const offlineItem: OfflineMovie = {
    id: project.id,
    title: project.title,
    year: String(project.year),
    duration: project.duration,
    poster: project.poster,
    backdrop: project.backdrop,
    description: project.description,
    downloadedAt: Date.now(),
    fileSizeMb: sizeMb,
    project,
  };

  const existing = getOfflineMovies().filter((m) => m.id !== project.id);
  existing.unshift(offlineItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  if (onProgress) onProgress(100);
  window.dispatchEvent(new Event('ofmedia_offline_updated'));
  return offlineItem;
};

/**
 * Remove movie from offline storage (IndexedDB and metadata)
 */
export const removeOfflineMovie = async (id: string): Promise<void> => {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('Error deleting from IndexedDB:', err);
  }

  const remaining = getOfflineMovies().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  window.dispatchEvent(new Event('ofmedia_offline_updated'));
};