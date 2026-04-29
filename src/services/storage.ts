import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PhotoData } from '../types';

interface LapkinDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoData;
    indexes: { 'by-report': string };
  };
}

let dbInstance: IDBPDatabase<LapkinDB> | null = null;

async function getDB(): Promise<IDBPDatabase<LapkinDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<LapkinDB>('lapkin-penyuluh-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('photos', { keyPath: 'id' });
      store.createIndex('by-report', 'reportId');
    },
  });
  return dbInstance;
}

export async function savePhoto(photo: PhotoData): Promise<void> {
  const db = await getDB();
  await db.put('photos', photo);
}

export async function getPhoto(id: string): Promise<PhotoData | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getPhotosByReport(reportId: string): Promise<PhotoData[]> {
  const db = await getDB();
  return db.getAllFromIndex('photos', 'by-report', reportId);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

export async function deletePhotosByReport(reportId: string): Promise<void> {
  const db = await getDB();
  const photos = await db.getAllFromIndex('photos', 'by-report', reportId);
  const tx = db.transaction('photos', 'readwrite');
  for (const photo of photos) {
    await tx.store.delete(photo.id);
  }
  await tx.done;
}

export async function getAllPhotos(): Promise<PhotoData[]> {
  const db = await getDB();
  return db.getAll('photos');
}

export async function clearAllPhotos(): Promise<void> {
  const db = await getDB();
  await db.clear('photos');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
