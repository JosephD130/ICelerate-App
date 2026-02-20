// src/lib/storage/document-store.ts
// IndexedDB-backed persistent storage for uploaded document chunks.
// Uses the `idb` library (already installed).

import { openDB, type IDBPDatabase } from "idb";

export interface StoredChunk {
  id: string;
  projectId: string;
  source: "demo" | "uploaded";
  fileName: string;
  title: string;
  section: string;
  content: string;
  keywords: string[];
  uploadedAt: string;
}

const DB_NAME = "icelerate-docs";
const DB_VERSION = 1;
const STORE_NAME = "chunks";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("byProject", "projectId", { unique: false });
          store.createIndex("byFile", ["projectId", "fileName"], {
            unique: false,
          });
        }
      },
    });
  }
  return dbPromise;
}

/** Add an array of chunks to the store. Skips duplicates by id. */
export async function addChunks(chunks: StoredChunk[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const chunk of chunks) {
    const existing = await store.get(chunk.id);
    if (!existing) {
      await store.put(chunk);
    }
  }
  await tx.done;
}

/** Get all uploaded chunks for a given project. */
export async function getChunksByProject(
  projectId: string,
): Promise<StoredChunk[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, "byProject", projectId);
}

/** Delete all chunks associated with a specific file in a project. */
export async function deleteByFile(
  projectId: string,
  fileName: string,
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const idx = store.index("byFile");
  let cursor = await idx.openCursor([projectId, fileName]);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Delete all chunks for a project. */
export async function clearProject(projectId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const idx = store.index("byProject");
  let cursor = await idx.openCursor(projectId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** List distinct uploaded file names for a project. */
export async function getUploadedFiles(
  projectId: string,
): Promise<{ fileName: string; chunkCount: number; uploadedAt: string }[]> {
  const chunks = await getChunksByProject(projectId);
  const map = new Map<string, { count: number; uploadedAt: string }>();
  for (const c of chunks) {
    if (c.source !== "uploaded") continue;
    const entry = map.get(c.fileName);
    if (entry) {
      entry.count++;
    } else {
      map.set(c.fileName, { count: 1, uploadedAt: c.uploadedAt });
    }
  }
  return Array.from(map.entries()).map(([fileName, v]) => ({
    fileName,
    chunkCount: v.count,
    uploadedAt: v.uploadedAt,
  }));
}
