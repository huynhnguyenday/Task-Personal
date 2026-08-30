import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import OverviewCard from "./OverviewCard";
import type { OverallSummary } from "./useOverallSummary";

export default function AllTimeTasksCard(props: { data: OverallSummary; loading: boolean; error: string }) {
  return <OverviewCard label="Tổng task từ trước tới giờ" value={props.data.total} icon={faListCheck} tone="bg-[#dce8e2] text-[#28745b]" loading={props.loading} error={props.error} />;
}
