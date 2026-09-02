"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MonthlyStatusCards from "./monthly-status/MonthlyStatusCards";
import TopSupportersTable from "./supporters/TopSupportersTable";
import PairedMetricCards from "./PairedMetricCards";
import type { MonthlyStatus } from "./monthly-status/types";
import type { Supporter } from "./supporters/types";
import { areCacheValuesEqual, readClientCache, writeClientCache } from "@/lib/clientCache";
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

  const loadMonthlyAnalytics = useCallback(() => {
    const monthlyCache = readClientCache<MonthlyStatus>(MONTHLY_CACHE_KEY, ANALYTICS_CACHE_TTL);
    const supportersCache = readClientCache<Supporter[]>(SUPPORTERS_CACHE_KEY, ANALYTICS_CACHE_TTL);

    if (monthlyCache) { setMonthly(monthlyCache.value); setMonthlyLoading(false); }
    if (supportersCache) { setSupporters(supportersCache.value); setSupportersLoading(false); }

    {
      fetch("/api/analytics/monthly-status", { cache: "no-store" })
        .then(async (response) => { if (!response.ok) throw new Error("monthly"); return response.json() as Promise<MonthlyStatus>; })
        .then((data) => {
          if (!monthlyCache || !areCacheValuesEqual(monthlyCache.value, data)) {
            setMonthly(data);
            writeClientCache(MONTHLY_CACHE_KEY, data);
          }
        })
        .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
        .finally(() => setMonthlyLoading(false));
    }

    {
      fetch("/api/analytics/top-supporters", { cache: "no-store" })
        .then(async (response) => { if (!response.ok) throw new Error("supporters"); return response.json() as Promise<Supporter[]>; })
        .then((data) => {
          if (!supportersCache || !areCacheValuesEqual(supportersCache.value, data)) {
            setSupporters(data);
            writeClientCache(SUPPORTERS_CACHE_KEY, data);
          }
        })
        .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
        .finally(() => setSupportersLoading(false));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => loadMonthlyAnalytics());
  }, [loadMonthlyAnalytics]);

  return (
    <main className="scrollbar-analytics h-dvh w-full min-w-0 overflow-y-auto bg-[#f5f7f5] px-3 py-4 pb-20 text-[#20252b] md:px-5 md:py-5 xl:px-6">
      <header className="mx-auto flex w-full max-w-[1440px] shrink-0 items-end justify-between border-b border-[#dce2de] pb-4 pl-14 md:pl-0">
        <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p><h1 className="mt-1 text-xl font-semibold md:text-2xl">Phân tích công việc</h1></div>
        <p className="hidden text-xs font-semibold text-[#515a60] md:block">Dữ liệu tự động cập nhật theo tháng hiện tại</p>
      </header>
      <div className="mx-auto mt-4 flex w-full max-w-[1440px] flex-col gap-3 pb-4">
        {error && <p className="shrink-0 text-xs text-[#a34646]">{error}</p>}
        <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-6 lg:grid-rows-2">
          <MonthlyStatusCards data={monthly} loading={monthlyLoading} className="col-span-2 grid grid-cols-2 gap-2.5 lg:row-span-2 lg:grid-rows-2" />
          <PairedMetricCards className="col-span-2 grid min-w-0 grid-cols-2 gap-2.5 lg:contents" />
        </div>
        <section className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)] xl:grid-cols-3 xl:grid-rows-[clamp(420px,52vh,500px)_380px]">
          <div className="grid min-w-0 gap-3 md:grid-rows-2 xl:contents">
            <div className="h-[480px] min-h-0 md:h-[500px] xl:col-span-2 xl:row-start-1 xl:h-full"><WeeklyTaskChart /></div>
            <div className="min-h-0 xl:col-start-1 xl:row-start-2"><AverageWeekdayChart data={breakdowns.data.weekdays} loading={breakdowns.loading} error={breakdowns.error} /></div>
          </div>
          <aside className="grid min-w-0 gap-3 xl:contents">
            <div className="h-[390px] min-h-0 md:h-[410px] xl:col-start-3 xl:row-start-1 xl:h-full"><TopSupportersTable data={supporters} loading={supportersLoading} onTaskUpdated={loadMonthlyAnalytics} /></div>
            <div className="min-h-0 xl:col-start-2 xl:row-start-2"><WorkloadRankingTable eyebrow="PHÂN BỔ THEO PHÒNG BAN" title="Tổng công việc của các phòng ban" filterType="department" data={breakdowns.data.departments} loading={breakdowns.loading} error={breakdowns.error} /></div>
            <div className="min-h-0 xl:col-start-3 xl:row-start-2"><WorkloadRankingTable eyebrow="PHÂN BỔ THEO DANH MỤC" title="Tổng công việc theo danh mục" filterType="category" data={breakdowns.data.categories} loading={breakdowns.loading} error={breakdowns.error} /></div>
          </aside>
        </section>
      </div>
    </main>
  );
}
