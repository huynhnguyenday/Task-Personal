import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import OverviewCard from "./OverviewCard";
import type { OverallSummary } from "./useOverallSummary";

export default function AverageMonthlyTasksCard(props: { data: OverallSummary; loading: boolean; error: string }) {
  return <OverviewCard label="TB số task mỗi tháng" value={props.data.monthlyAverage} icon={faCalendarDays} tone="bg-[#e8e4f3] text-[#71549b]" loading={props.loading} error={props.error} />;
}
