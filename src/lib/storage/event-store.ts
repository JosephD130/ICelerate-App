// src/lib/storage/event-store.ts
// IndexedDB-backed persistent storage for DecisionEvents.
// Mirrors the pattern from document-store.ts.

import { openDB, type IDBPDatabase } from "idb";
import type { DecisionEvent } from "@/lib/models/decision-event";

interface StoredEvent {
  id: string;
  projectId: string;
  event: DecisionEvent;
}

const DB_NAME = "icelerate-events";
const DB_VERSION = 1;
const EVENTS_STORE = "events";
const META_STORE = "meta";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const store = db.createObjectStore(EVENTS_STORE, { keyPath: "id" });
          store.createIndex("byProject", "projectId", { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

/** Upsert a single event. */
export async function putEvent(
  projectId: string,
  event: DecisionEvent,
): Promise<void> {
  const db = await getDb();
  const stored: StoredEvent = { id: event.id, projectId, event };
  await db.put(EVENTS_STORE, stored);
}

/** Bulk upsert events (used for seeding). */
export async function putEvents(
  projectId: string,
  events: DecisionEvent[],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(EVENTS_STORE, "readwrite");
  const store = tx.objectStore(EVENTS_STORE);
  for (const event of events) {
    const stored: StoredEvent = { id: event.id, projectId, event };
    await store.put(stored);
  }
  await tx.done;
}

/** Load all events for a project, returning DecisionEvent[]. */
export async function getEventsByProject(
  projectId: string,
): Promise<DecisionEvent[]> {
  const db = await getDb();
  const rows: StoredEvent[] = await db.getAllFromIndex(
    EVENTS_STORE,
    "byProject",
    projectId,
  );
  return rows.map((r) => r.event);
}

/** Delete a single event by id. */
export async function deleteEvent(eventId: string): Promise<void> {
  const db = await getDb();
  await db.delete(EVENTS_STORE, eventId);
}

/** Delete all events for a project. */
export async function clearProjectEvents(projectId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(EVENTS_STORE, "readwrite");
  const store = tx.objectStore(EVENTS_STORE);
  const idx = store.index("byProject");
  let cursor = await idx.openCursor(projectId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Check whether demo events have been seeded for this project. */
export async function isProjectSeeded(projectId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.get(META_STORE, `seeded-${projectId}`);
  return !!row;
}

/** Mark a project as seeded so we don't re-seed on next load. */
export async function markProjectSeeded(projectId: string): Promise<void> {
  const db = await getDb();
  await db.put(META_STORE, { key: `seeded-${projectId}`, seededAt: new Date().toISOString() });
}
