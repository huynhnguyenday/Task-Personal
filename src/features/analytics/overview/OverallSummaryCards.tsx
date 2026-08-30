"use client";

import AllTimeTasksCard from "./AllTimeTasksCard";
import AverageDailyTasksCard from "./AverageDailyTasksCard";
import AverageMonthlyTasksCard from "./AverageMonthlyTasksCard";
import AverageWeeklyTasksCard from "./AverageWeeklyTasksCard";
import { useOverallSummary } from "./useOverallSummary";

export default function OverallSummaryCards({ className = "grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4" }: { className?: string }) {
  const summary = useOverallSummary();

  return (
    <section className={className} aria-label="Thống kê task tổng quan">
      <AllTimeTasksCard {...summary} />
      <AverageMonthlyTasksCard {...summary} />
      <AverageWeeklyTasksCard {...summary} />
      <AverageDailyTasksCard {...summary} />
    </section>
  );
}
