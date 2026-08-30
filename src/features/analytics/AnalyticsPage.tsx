"use client";

import { useEffect, useState } from "react";
import MonthlyStatusCards from "./MonthlyStatusCards";
import TopSupportersTable from "./TopSupportersTable";
import WeeklyTaskChart from "./WeeklyTaskChart";
import WorkloadComparisonCards from "./comparison/WorkloadComparisonCards";
import type { MonthlyStatus, Supporter } from "./types";

export default function AnalyticsPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/analytics/top-supporters"), fetch("/api/analytics/monthly-status")])
      .then(async (responses) => {
        if (responses.some((response) => !response.ok)) throw new Error("load");
        const [supporterData, monthlyData] = await Promise.all(responses.map((response) => response.json()));
        setSupporters(supporterData); setMonthly(monthlyData);
      })
      .catch(() => setError("Chưa thể tải đầy đủ dữ liệu thống kê."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="scrollbar-analytics flex h-dvh flex-col overflow-hidden bg-[#f5f7f5] px-3 py-4 text-[#20252b] sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-[1440px] shrink-0 items-end justify-between border-b border-[#dce2de] pb-4 pl-14 sm:pl-0">
        <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p><h1 className="mt-1 text-xl font-semibold sm:text-2xl">Phân tích công việc</h1></div>
        <p className="hidden text-xs text-[#727a82] sm:block">Dữ liệu tự động cập nhật theo tháng hiện tại</p>
      </header>
      <div className="mx-auto mt-4 flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-3">
        {error && <p className="shrink-0 text-xs text-[#a34646]">{error}</p>}
        <WorkloadComparisonCards />
        <section className="grid min-h-0 flex-1 auto-rows-[590px] gap-3 overflow-y-auto lg:grid-cols-[1.45fr_1fr] lg:auto-rows-max">
          <WeeklyTaskChart />
          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
            <MonthlyStatusCards data={monthly} loading={loading} />
            <TopSupportersTable data={supporters} loading={loading} />
          </aside>
        </section>
      </div>
    </main>
  );
}
