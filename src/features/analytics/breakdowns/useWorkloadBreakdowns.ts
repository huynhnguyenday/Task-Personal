"use client";

import { useEffect, useState } from "react";
import { readClientCache, writeClientCache } from "@/lib/clientCache";
import type { WorkloadBreakdowns } from "./types";

const CACHE_KEY = "analytics:workload-breakdowns";
const CACHE_TTL = 5 * 60_000;
const EMPTY: WorkloadBreakdowns = { weekdays: [], departments: [], categories: [] };

export function useWorkloadBreakdowns() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = readClientCache<WorkloadBreakdowns>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      queueMicrotask(() => { setData(cached.value); setLoading(false); });
      if (cached.fresh) return;
    }
    const controller = new AbortController();
    fetch("/api/analytics/workload-breakdowns", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể tải thống kê");
        setData(result);
        writeClientCache(CACHE_KEY, result);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải thống kê");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
