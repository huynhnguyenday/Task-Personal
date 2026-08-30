"use client";

import { useEffect, useState } from "react";

export type WorkloadMetric = "total" | "monthly" | "weekly" | "daily";
export const RECORDING_START = "2026-08-14";
export const TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

export function useWorkloadMetric(metric: WorkloadMetric, date: string) {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/analytics/workload-comparison?metric=${metric}&date=${date}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể tải chỉ số");
        setValue(result.value);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải chỉ số");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, metric]);

  return { value, loading, error, reload: () => { setLoading(true); setError(""); } };
}
