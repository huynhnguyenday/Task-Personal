"use client";

import { Skeleton } from "@/components/LoadingSkeleton";
import { TODAY, useWorkloadMetric } from "./useWorkloadMetric";

export default function TotalTasksCard() {
  const { value, loading, error } = useWorkloadMetric("total", TODAY);
  return <article className="flex min-h-[92px] items-center justify-center gap-3 bg-[#dce8e2] px-3 py-3 text-[#245944]">{loading ? <Skeleton className="h-8 w-10 bg-white/40" /> : <strong className="text-3xl">{value}</strong>}<span className="text-xs font-bold sm:text-sm">Tổng task<br />tháng này{error && <small className="block text-[9px] text-[#bd4c4c]">Lỗi tải</small>}</span></article>;
}
