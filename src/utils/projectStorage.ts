import type { Project } from '../types/studio';

const DB_NAME = 'ai_storyboard_video_studio_v1';
const STORE_NAME = 'projects';
const ACTIVE_PROJECT_KEY = 'ai_storyboard_active_project_id';

function openStudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadAllProjects(): Promise<Project[]> {
  try {
    const db = await openStudioDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as Project[]) ?? [];
        list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveProjectToDb(project: Project): Promise<void> {
  const updated: Project = {
    ...project,
    updatedAt: new Date().toISOString(),
    // Never store ephemeral object URLs in IndexedDB
    finalVideoUrl: undefined,
  };
  try {
    const db = await openStudioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(updated);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  } catch {
    // Ignore storage failures
  }
}

export async function deleteProjectFromDb(projectId: string): Promise<void> {
  try {
    const db = await openStudioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage failures
  }
}

export function getSavedActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setSavedActiveProjectId(projectId: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  } catch {
    // Ignore
  }
}

export async function readImageFileAsResizedDataUrl(
  file: File,
  maxDimension = 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
