import { faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import OverviewCard from "./OverviewCard";
import type { OverallSummary } from "./useOverallSummary";

export default function AverageDailyTasksCard(props: { data: OverallSummary; loading: boolean; error: string }) {
  return <OverviewCard label="TB số task mỗi ngày" value={props.data.dailyAverage} icon={faCalendarDay} tone="bg-[#e2edf3] text-[#39718d]" loading={props.loading} error={props.error} />;
}
