/**
 * IndexedDB persistence service for R2 ULTRA
 * Stores imported audio Blobs (so audio files persist across app reloads)
 * and application state (queue, playlists, track playback positions, preferences).
 */

const DB_NAME = 'r2_ultra_db';
const DB_VERSION = 1;
const STORE_TRACKS = 'imported_tracks';
const STORE_STATE = 'app_state';

export interface StoredAudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  folder: string;
  duration: number;
  bpm: number;
  bitrate: string;
  sampleRate: string;
  coverArt: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    glowRgba: string;
    violetRgba: string;
  };
  isFavorite: boolean;
  addedAt: number;
  lastPlayedAt?: number;
  blob: Blob;
  mimeType: string;
  fileName: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

export async function saveImportedAudioTrack(track: StoredAudioTrack): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS], 'readwrite');
    const store = tx.objectStore(STORE_TRACKS);
    store.put(track);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to commit audio file to IndexedDB'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB audio transaction aborted'));
  });
}

export async function getAllImportedAudioTracks(): Promise<StoredAudioTrack[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS], 'readonly');
    const store = tx.objectStore(STORE_TRACKS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error('Failed to load audio files from IndexedDB'));
  });
}

export async function deleteImportedAudioTrack(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TRACKS], 'readwrite');
    const store = tx.objectStore(STORE_TRACKS);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to commit track deletion to IndexedDB'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB deletion transaction aborted'));
  });
}

export async function setStoredItem<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_STATE], 'readwrite');
    const store = tx.objectStore(STORE_STATE);
    store.put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error(`Failed to commit state key "${key}" to IndexedDB`));
    tx.onabort = () => reject(tx.error || new Error(`IndexedDB transaction aborted for key "${key}"`));
  });
}

export async function getStoredItem<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_STATE], 'readonly');
    const store = tx.objectStore(STORE_STATE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error || new Error(`Failed to read state key: ${key}`));
  });
}
