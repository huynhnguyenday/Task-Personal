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

export default function PairedMetricCards() {
  const summary = useOverallSummary();

  return (
    <section className="grid min-w-0 grid-cols-2 gap-2.5" aria-label="Tổng quan và so sánh khối lượng công việc">
      <AllTimeTasksCard {...summary} />
      <TotalTasksCard />
      <AverageMonthlyTasksCard {...summary} />
      <MonthlyComparisonCard />
      <AverageWeeklyTasksCard {...summary} />
      <WeeklyComparisonCard />
      <AverageDailyTasksCard {...summary} />
      <DailyComparisonCard />
    </section>
  );
}
