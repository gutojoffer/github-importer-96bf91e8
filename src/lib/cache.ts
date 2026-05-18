// Simple TTL caches: in-memory + sessionStorage.
// Used to throttle repeated Supabase queries across the app.

type Entry<T> = { value: T; expiresAt: number };

const memStore = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function now() {
  return Date.now();
}

/**
 * Cache the result of `fetcher` in memory for `ttlMs`.
 * Concurrent callers share the same in-flight promise.
 */
export async function cacheMemory<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = memStore.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now()) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    try {
      const value = await fetcher();
      memStore.set(key, { value, expiresAt: now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Cache the result in sessionStorage. Good for static reference data. */
export async function cacheSession<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Entry<T>;
      if (parsed.expiresAt > now()) return parsed.value;
    }
  } catch { /* ignore */ }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    try {
      const value = await fetcher();
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ value, expiresAt: now() + ttlMs }),
        );
      } catch { /* quota — ignore */ }
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Invalidate by exact key or prefix. */
export function invalidate(keyOrPrefix: string) {
  for (const k of Array.from(memStore.keys())) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) memStore.delete(k);
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && (k === keyOrPrefix || k.startsWith(keyOrPrefix))) {
        sessionStorage.removeItem(k);
      }
    }
  } catch { /* ignore */ }
}

export function invalidateAll() {
  memStore.clear();
  inflight.clear();
}
