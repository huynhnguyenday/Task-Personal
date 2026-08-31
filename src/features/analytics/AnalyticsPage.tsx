"use client";

import { useCallback, useEffect, useState } from "react";
import MonthlyStatusCards from "./monthly-status/MonthlyStatusCards";
import TopSupportersTable from "./supporters/TopSupportersTable";
import WeeklyTaskChart from "./weekly/WeeklyTaskChart";
import WorkloadComparisonCards from "./comparison/WorkloadComparisonCards";
import OverallSummaryCards from "./overview/OverallSummaryCards";
import type { MonthlyStatus } from "./monthly-status/types";
import type { Supporter } from "./supporters/types";
import { readClientCache, writeClientCache } from "@/lib/clientCache";

const ANALYTICS_CACHE_KEY = "analytics:monthly";
const ANALYTICS_CACHE_TTL = 5 * 60_000;
type MonthlyAnalyticsCache = { supporters: Supporter[]; monthly: MonthlyStatus };

export default function AnalyticsPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMonthlyAnalytics = useCallback((force = true) => {
    const cached = readClientCache<MonthlyAnalyticsCache>(ANALYTICS_CACHE_KEY, ANALYTICS_CACHE_TTL);
    if (cached) {
      setSupporters(cached.value.supporters);
      setMonthly(cached.value.monthly);
      setLoading(false);
      if (cached.fresh && !force) return;
    }
    Promise.all([fetch("/api/analytics/top-supporters"), fetch("/api/analytics/monthly-status")])
      .then(async (responses) => {
        if (responses.some((response) => !response.ok)) throw new Error("load");
        const [supporterData, monthlyData] = await Promise.all(responses.map((response) => response.json()));
        setSupporters(supporterData); setMonthly(monthlyData);
        writeClientCache(ANALYTICS_CACHE_KEY, { supporters: supporterData, monthly: monthlyData });
      })
      .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => loadMonthlyAnalytics(false));
  }, [loadMonthlyAnalytics]);

  return (
    <main className="scrollbar-analytics flex h-dvh flex-col overflow-hidden bg-[#f5f7f5] px-3 py-4 text-[#20252b] sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-[1440px] shrink-0 items-end justify-between border-b border-[#dce2de] pb-4 pl-14 sm:pl-0">
        <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p><h1 className="mt-1 text-xl font-semibold sm:text-2xl">Phân tích công việc</h1></div>
        <p className="hidden text-xs font-semibold text-[#515a60] sm:block">Dữ liệu tự động cập nhật theo tháng hiện tại</p>
      </header>
      <div className="mx-auto mt-4 flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-3">
        {error && <p className="shrink-0 text-xs text-[#a34646]">{error}</p>}
        <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-6 lg:grid-rows-2">
          <MonthlyStatusCards data={monthly} loading={loading} className="grid grid-cols-2 gap-2.5 lg:col-span-2 lg:row-span-2 lg:grid-rows-2" />
          <OverallSummaryCards className="contents" />
          <WorkloadComparisonCards className="contents" />
        </div>
        <section className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1.45fr_1fr] lg:grid-rows-[minmax(0,1fr)]">
          <WeeklyTaskChart />
          <aside className="h-full min-h-0">
            <TopSupportersTable data={supporters} loading={loading} onTaskUpdated={() => loadMonthlyAnalytics(true)} />
          </aside>
        </section>
      </div>
    </main>
  );
}
