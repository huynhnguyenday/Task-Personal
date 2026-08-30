import { faCalendarWeek } from "@fortawesome/free-solid-svg-icons";
import OverviewCard from "./OverviewCard";
import type { OverallSummary } from "./useOverallSummary";

export default function AverageWeeklyTasksCard(props: { data: OverallSummary; loading: boolean; error: string }) {
  return <OverviewCard label="TB số task mỗi tuần" value={props.data.weeklyAverage} icon={faCalendarWeek} tone="bg-[#f7ecd8] text-[#a46d22]" loading={props.loading} error={props.error} />;
}
