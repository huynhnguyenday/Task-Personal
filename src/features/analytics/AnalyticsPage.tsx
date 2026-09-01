"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MonthlyStatusCards from "./monthly-status/MonthlyStatusCards";
import TopSupportersTable from "./supporters/TopSupportersTable";
import WorkloadComparisonCards from "./comparison/WorkloadComparisonCards";
import OverallSummaryCards from "./overview/OverallSummaryCards";
import type { MonthlyStatus } from "./monthly-status/types";
import type { Supporter } from "./supporters/types";
import { readClientCache, writeClientCache } from "@/lib/clientCache";
import { Skeleton } from "@/components/LoadingSkeleton";
import { useWorkloadBreakdowns } from "./breakdowns/useWorkloadBreakdowns";
import AverageWeekdayChart from "./breakdowns/AverageWeekdayChart";
import WorkloadRankingTable from "./breakdowns/WorkloadRankingTable";

const ANALYTICS_CACHE_TTL = 5 * 60_000;
const MONTHLY_CACHE_KEY = "analytics:monthly-status";
const SUPPORTERS_CACHE_KEY = "analytics:top-supporters";

const WeeklyTaskChart = dynamic(() => import("./weekly/WeeklyTaskChart"), {
  ssr: false,
  loading: () => <article className="flex h-full min-h-0 flex-col border border-[#e3e7e9] bg-white p-4"><Skeleton className="h-6 w-44" /><Skeleton className="mt-4 min-h-32 flex-1 w-full" /></article>,
});

export default function AnalyticsPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStatus | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [supportersLoading, setSupportersLoading] = useState(true);
  const [error, setError] = useState("");
  const breakdowns = useWorkloadBreakdowns();

  const loadMonthlyAnalytics = useCallback((force = true) => {
    const monthlyCache = readClientCache<MonthlyStatus>(MONTHLY_CACHE_KEY, ANALYTICS_CACHE_TTL);
    const supportersCache = readClientCache<Supporter[]>(SUPPORTERS_CACHE_KEY, ANALYTICS_CACHE_TTL);

    if (monthlyCache) { setMonthly(monthlyCache.value); setMonthlyLoading(false); }
    if (supportersCache) { setSupporters(supportersCache.value); setSupportersLoading(false); }

    if (force || !monthlyCache?.fresh) {
      fetch("/api/analytics/monthly-status")
        .then(async (response) => { if (!response.ok) throw new Error("monthly"); return response.json() as Promise<MonthlyStatus>; })
        .then((data) => { setMonthly(data); writeClientCache(MONTHLY_CACHE_KEY, data); })
        .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
        .finally(() => setMonthlyLoading(false));
    }

    if (force || !supportersCache?.fresh) {
      fetch("/api/analytics/top-supporters")
        .then(async (response) => { if (!response.ok) throw new Error("supporters"); return response.json() as Promise<Supporter[]>; })
        .then((data) => { setSupporters(data); writeClientCache(SUPPORTERS_CACHE_KEY, data); })
        .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
        .finally(() => setSupportersLoading(false));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => loadMonthlyAnalytics(false));
  }, [loadMonthlyAnalytics]);

  return (
    <main className="scrollbar-analytics h-dvh w-full min-w-0 overflow-y-auto bg-[#f5f7f5] px-3 py-4 pb-20 text-[#20252b] sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-[1440px] shrink-0 items-end justify-between border-b border-[#dce2de] pb-4 pl-14 sm:pl-0">
        <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p><h1 className="mt-1 text-xl font-semibold sm:text-2xl">Phân tích công việc</h1></div>
        <p className="hidden text-xs font-semibold text-[#515a60] sm:block">Dữ liệu tự động cập nhật theo tháng hiện tại</p>
      </header>
      <div className="mx-auto mt-4 flex w-full max-w-[1440px] flex-col gap-3 pb-4">
        {error && <p className="shrink-0 text-xs text-[#a34646]">{error}</p>}
        <div className="grid min-w-0 shrink-0 grid-cols-1 gap-2.5 min-[480px]:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-6 lg:grid-rows-2">
          <MonthlyStatusCards data={monthly} loading={monthlyLoading} className="grid grid-cols-2 gap-2.5 lg:col-span-2 lg:row-span-2 lg:grid-rows-2" />
          <OverallSummaryCards className="contents" />
          <WorkloadComparisonCards className="contents" />
        </div>
        <section className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
          <div className="grid min-w-0 gap-3 lg:grid-rows-2">
            <div className="h-[330px] min-h-0 sm:h-full sm:min-h-[380px]"><WeeklyTaskChart /></div>
            <AverageWeekdayChart data={breakdowns.data.weekdays} loading={breakdowns.loading} error={breakdowns.error} />
          </div>
          <aside className="grid min-w-0 gap-3">
            <div className="h-[390px] min-h-0 sm:h-[430px]"><TopSupportersTable data={supporters} loading={supportersLoading} onTaskUpdated={() => loadMonthlyAnalytics(true)} /></div>
            <WorkloadRankingTable eyebrow="PHÂN BỔ THEO PHÒNG BAN" title="Tổng công việc của các phòng ban" data={breakdowns.data.departments} loading={breakdowns.loading} error={breakdowns.error} />
            <WorkloadRankingTable eyebrow="PHÂN BỔ THEO DANH MỤC" title="Tổng công việc theo danh mục" data={breakdowns.data.categories} loading={breakdowns.loading} error={breakdowns.error} />
          </aside>
        </section>
      </div>
    </main>
  );
}
