import DailyComparisonCard from "./DailyComparisonCard";
import MonthlyComparisonCard from "./MonthlyComparisonCard";
import TotalTasksCard from "./TotalTasksCard";
import WeeklyComparisonCard from "./WeeklyComparisonCard";

export default function WorkloadComparisonCards({ className = "grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4" }: { className?: string }) {
  return <section className={className} aria-label="So sánh khối lượng công việc"><TotalTasksCard /><MonthlyComparisonCard /><WeeklyComparisonCard /><DailyComparisonCard /></section>;
}
