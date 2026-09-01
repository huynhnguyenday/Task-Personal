import { Skeleton } from "@/components/LoadingSkeleton";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RECORDING_START } from "./useWorkloadMetric";

export default function ComparisonCard({ label, value, date, loading, error, onDateChange, fallbackDate, pickerType = "date", min = RECORDING_START, ratio = false }: { label: string; value: number; date: string; loading: boolean; error: string; onDateChange: (date: string) => void; fallbackDate: string; pickerType?: "date" | "month" | "week"; min?: string; ratio?: boolean }) {
  return (
    <article className="relative flex min-h-[96px] min-w-0 flex-col items-center gap-1 overflow-hidden border border-[#e3e7e9] bg-white px-2 pb-11 pt-2 sm:px-3">
      {loading ? <Skeleton className="mt-1 h-8 w-16 shrink-0" /> : <strong className={`flex shrink-0 items-center gap-1 pt-1 text-3xl leading-none ${value >= (ratio ? 100 : 0) ? "text-[#28745b]" : "text-[#bd4c4c]"}`}>{value > (ratio ? 100 : 0) && <FontAwesomeIcon className="w-3.5 rotate-45 text-sm" icon={faArrowUp} />}{ratio && value < 100 && <FontAwesomeIcon className="w-3.5 -rotate-45 text-sm" icon={faArrowDown} />}{value}%</strong>}
      <span className="line-clamp-2 text-center text-xs font-bold leading-4 text-[#3f494f] sm:text-sm">{label}</span>
      {error && <span className="absolute bottom-2 left-3 max-w-[110px] truncate text-[9px] text-[#bd4c4c]" title={error}>Lỗi tải dữ liệu</span>}
      <input aria-label={`Chọn ${pickerType === "month" ? "tháng" : pickerType === "week" ? "tuần" : "ngày"} ${label.toLowerCase()}`} className="absolute bottom-2 left-1/2 h-7 w-[calc(100%-1rem)] max-w-[124px] min-w-0 -translate-x-1/2 border border-[#a8c9bc] bg-[#dcebe5] px-1 pt-0.5 text-center text-[9px] font-extrabold text-[#17251d] opacity-100 outline-none transition focus:border-[#28745b] focus:ring-1 focus:ring-[#28745b] sm:px-2 sm:text-[10px]" type={pickerType} min={min} value={date} onChange={(event) => onDateChange(event.target.value || fallbackDate)} />
    </article>
  );
}
