import { Skeleton } from "@/components/LoadingSkeleton";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RECORDING_START } from "./useWorkloadMetric";

export default function ComparisonCard({ label, value, date, loading, error, onDateChange, pickerType = "date", min = RECORDING_START, ratio = false }: { label: string; value: number; date: string; loading: boolean; error: string; onDateChange: (date: string) => void; pickerType?: "date" | "month" | "week"; min?: string; ratio?: boolean }) {
  return (
    <article className="relative flex min-h-[92px] items-start gap-3 border border-[#e3e7e9] bg-white px-3 pb-9 pt-3">
      {loading ? <Skeleton className="h-8 w-16 shrink-0" /> : <strong className={`flex shrink-0 items-center gap-1 text-3xl ${value >= (ratio ? 100 : 0) ? "text-[#28745b]" : "text-[#bd4c4c]"}`}>{value > (ratio ? 100 : 0) && <FontAwesomeIcon className="w-3.5 rotate-45 text-sm" icon={faArrowUp} />}{ratio && value < 100 && <FontAwesomeIcon className="w-3.5 -rotate-45 text-sm" icon={faArrowDown} />}{value}%</strong>}
      <span className="text-sm font-bold leading-4 text-[#606970]">{label}</span>
      {error && <span className="absolute bottom-2 left-3 max-w-[110px] truncate text-[9px] text-[#bd4c4c]" title={error}>Lỗi tải dữ liệu</span>}
      <input aria-label={`Chọn ${pickerType === "month" ? "tháng" : pickerType === "week" ? "tuần" : "ngày"} ${label.toLowerCase()}`} className="absolute bottom-2 right-2 h-7 max-w-[142px] border-0 bg-[#f5f7f5] px-2 text-[10px] text-[#515a60] outline-none focus:ring-1 focus:ring-[#28745b]" type={pickerType} min={min} value={date} onChange={(event) => onDateChange(event.target.value)} />
    </article>
  );
}
