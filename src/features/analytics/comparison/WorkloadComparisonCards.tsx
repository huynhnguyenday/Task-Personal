import DailyComparisonCard from "./DailyComparisonCard";
import MonthlyComparisonCard from "./MonthlyComparisonCard";
import TotalTasksCard from "./TotalTasksCard";
import WeeklyComparisonCard from "./WeeklyComparisonCard";

export default function WorkloadComparisonCards() {
  return <section className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4" aria-label="So sánh khối lượng công việc"><TotalTasksCard /><MonthlyComparisonCard /><WeeklyComparisonCard /><DailyComparisonCard /></section>;
}
