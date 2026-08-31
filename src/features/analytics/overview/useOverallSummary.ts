"use client";

import { useEffect, useState } from "react";
import { readClientCache, writeClientCache } from "@/lib/clientCache";

export type OverallSummary = {
  total: number;
  monthlyAverage: number;
  weeklyAverage: number;
  dailyAverage: number;
};

const EMPTY_SUMMARY: OverallSummary = { total: 0, monthlyAverage: 0, weeklyAverage: 0, dailyAverage: 0 };
const CACHE_KEY = "analytics:overall-summary";
const CACHE_TTL = 5 * 60_000;

export function useOverallSummary() {
  const [data, setData] = useState<OverallSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = readClientCache<OverallSummary>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      queueMicrotask(() => { setData(cached.value); setLoading(false); });
      if (cached.fresh) return;
    }
    const controller = new AbortController();
    fetch("/api/analytics/overall-summary", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể tải thống kê tổng quan");
        setData(result);
        writeClientCache(CACHE_KEY, result);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải thống kê tổng quan");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
