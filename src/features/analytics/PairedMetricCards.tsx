"use client";

import DailyComparisonCard from "./comparison/DailyComparisonCard";
import MonthlyComparisonCard from "./comparison/MonthlyComparisonCard";
import TotalTasksCard from "./comparison/TotalTasksCard";
import WeeklyComparisonCard from "./comparison/WeeklyComparisonCard";
import AllTimeTasksCard from "./overview/AllTimeTasksCard";
import AverageDailyTasksCard from "./overview/AverageDailyTasksCard";
import AverageMonthlyTasksCard from "./overview/AverageMonthlyTasksCard";
import AverageWeeklyTasksCard from "./overview/AverageWeeklyTasksCard";
import { useOverallSummary } from "./overview/useOverallSummary";

export default function PairedMetricCards({ className = "grid min-w-0 grid-cols-2 gap-2.5" }: { className?: string }) {
  const summary = useOverallSummary();

  return (
    <section className={className} aria-label="Tổng quan và so sánh khối lượng công việc">
      <AllTimeTasksCard {...summary} />
      <AverageMonthlyTasksCard {...summary} />
      <AverageWeeklyTasksCard {...summary} />
      <AverageDailyTasksCard {...summary} />
      <TotalTasksCard />
      <MonthlyComparisonCard />
      <WeeklyComparisonCard />
      <DailyComparisonCard />
    </section>
  );
}
