import { openDB } from 'idb';

async function getDB() {
  return openDB('usageDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function logLocalEvent(type: string): Promise<void> {
  const db = await getDB();
  await db.add('events', {
    type,
    timestamp: new Date().toISOString(),
  });
}

export async function getEventCount(type: string): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('events') as unknown[];
  return all.filter((e) => {
    if (typeof e !== 'object' || e === null) return false;
    const ev = e as { type?: unknown };
    return typeof ev.type === 'string' && ev.type === type;
  }).length;
}

export default logLocalEvent;
