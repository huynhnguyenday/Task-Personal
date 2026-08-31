"use client";

import { useEffect, useState } from "react";
import { readClientCache, writeClientCache } from "@/lib/clientCache";

export type WorkloadMetric = "total" | "monthly" | "weekly" | "daily";
export const RECORDING_START = "2026-08-14";
export function getToday() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); }

const CACHE_TTL = 60_000;
const metricCache = new Map<string, { value: number; expiresAt: number }>();
const pendingRequests = new Map<string, Promise<number>>();

function loadMetric(metric: WorkloadMetric, date: string) {
  const key = `${metric}:${date}`;
  const cached = metricCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  const stored = readClientCache<number>(`analytics:metric:${key}`, CACHE_TTL);
  if (stored?.fresh) {
    metricCache.set(key, { value: stored.value, expiresAt: Date.now() + CACHE_TTL });
    return Promise.resolve(stored.value);
  }

  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = fetch(`/api/analytics/workload-comparison?metric=${metric}&date=${date}`)
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể tải chỉ số");
      metricCache.set(key, { value: result.value, expiresAt: Date.now() + CACHE_TTL });
      writeClientCache(`analytics:metric:${key}`, result.value);
      return result.value as number;
    })
    .finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
}

export function useWorkloadMetric(metric: WorkloadMetric, date: string) {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    let active = true;
    const key = `${metric}:${date}`;
    const stored = readClientCache<number>(`analytics:metric:${key}`, CACHE_TTL);
    const cached = metricCache.get(key) ?? (stored ? { value: stored.value, expiresAt: stored.fresh ? Date.now() + CACHE_TTL : 0 } : undefined);
    queueMicrotask(() => {
      if (!active) return;
      if (cached) setValue(cached.value);
      if (!cached) setLoading(true);
      setError("");
    });
    loadMetric(metric, date)
      .then((result) => { if (active) setValue(result); })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Không thể tải chỉ số");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, metric, refreshKey]);

  return { value, loading, error, reload: () => { setLoading(true); setError(""); setRefreshKey((current) => current + 1); } };
}
