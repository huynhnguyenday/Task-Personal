import { Skeleton } from "@/components/LoadingSkeleton";
import { RECORDING_START } from "./useWorkloadMetric";

export default function ComparisonCard({ label, value, date, loading, error, onDateChange }: { label: string; value: number; date: string; loading: boolean; error: string; onDateChange: (date: string) => void }) {
  return (
    <article className="relative flex min-h-[92px] items-start gap-3 border border-[#e3e7e9] bg-white px-3 pb-9 pt-3">
      {loading ? <Skeleton className="h-7 w-14 shrink-0" /> : <strong className={`shrink-0 text-2xl ${value >= 0 ? "text-[#28745b]" : "text-[#bd4c4c]"}`}>{value > 0 ? "+" : ""}{value}%</strong>}
      <span className="text-xs font-bold leading-4 text-[#606970]">{label}</span>
      {error && <span className="absolute bottom-2 left-3 max-w-[110px] truncate text-[9px] text-[#bd4c4c]" title={error}>Lỗi tải dữ liệu</span>}
      <input aria-label={`Chọn ngày ${label.toLowerCase()}`} className="absolute bottom-2 right-2 h-7 max-w-[132px] border-0 bg-[#f5f7f5] px-2 text-[10px] text-[#515a60] outline-none focus:ring-1 focus:ring-[#28745b]" type="date" min={RECORDING_START} value={date} onChange={(event) => onDateChange(event.target.value)} />
    </article>
  );
}
