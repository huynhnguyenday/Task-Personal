import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Skeleton } from "@/components/LoadingSkeleton";

export default function OverviewCard({ label, value, icon, loading, error, tone }: { label: string; value: number; icon: IconDefinition; loading: boolean; error: string; tone: string }) {
  const formattedValue = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);

  return (
    <article className="relative flex min-h-[104px] min-w-0 items-center gap-2 overflow-hidden border border-[#e3e7e9] bg-white px-2 py-3 sm:gap-4 sm:px-4 sm:py-4">
      <span className={`grid h-9 w-9 shrink-0 place-items-center sm:h-11 sm:w-11 ${tone}`}><FontAwesomeIcon icon={icon} /></span>
      <div className="min-w-0">
        <p className="text-xs font-bold leading-4 text-[#3f494f] sm:text-sm">{label}</p>
        {loading ? <Skeleton className="mt-2 h-8 w-16" /> : <strong className="mt-1 block text-3xl leading-none text-[#20252b]">{formattedValue}</strong>}
        {error && <small className="mt-1 block truncate text-[9px] text-[#bd4c4c]" title={error}>Lỗi tải dữ liệu</small>}
      </div>
    </article>
  );
}
