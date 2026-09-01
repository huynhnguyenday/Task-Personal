"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/LoadingSkeleton";
import { getToday, useWorkloadMetric } from "./useWorkloadMetric";

export default function TotalTasksCard() {
  const [today, setToday] = useState("");
  useEffect(() => { const frame = requestAnimationFrame(() => setToday(getToday())); return () => cancelAnimationFrame(frame); }, []);
  const { value, loading, error } = useWorkloadMetric("total", today);
  return <article className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-1 overflow-hidden bg-[#dce8e2] px-2 py-2 text-center text-[#245944] sm:px-3">{loading ? <Skeleton className="h-8 w-10 bg-white/40" /> : <strong className="pt-1 text-3xl leading-none">{value}</strong>}<span className="text-xs font-bold leading-4 sm:text-sm">Tổng task tháng này{error && <small className="block text-[9px] text-[#bd4c4c]">Lỗi tải</small>}</span></article>;
}
