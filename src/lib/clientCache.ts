"use client";

type CacheEntry<T> = { value: T; savedAt: number };

export function readClientCache<T>(key: string, ttl: number) {
  try {
    const raw = localStorage.getItem(`task-web:${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.savedAt !== "number") return null;
    return { value: entry.value, fresh: Date.now() - entry.savedAt < ttl };
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(`task-web:${key}`, JSON.stringify({ value, savedAt: Date.now() }));
  } catch {
    // Analytics must still work when storage is disabled or full.
  }
}

export function areCacheValuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) return true;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}
