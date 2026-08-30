import { Skeleton } from "@/components/LoadingSkeleton";
import { faBan, faCircleCheck, faClock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MonthlyStatus } from "./types";

const cards = [
  { key: "inProgress", label: "Đang làm", icon: faSpinner, className: "bg-[#fff4cc] text-[#9a7000]" },
  { key: "waiting", label: "Đang chờ", icon: faClock, className: "bg-[#f1e7ff] text-[#7c4db3]" },
  { key: "cancelled", label: "Không cần", icon: faBan, className: "bg-[#fae0e0] text-[#bd4c4c]" },
  { key: "completed", label: "Hoàn thành", icon: faCircleCheck, className: "bg-[#e3f0e9] text-[#28745b]" },
] as const;

export default function MonthlyStatusCards({ data, loading, className = "grid shrink-0 grid-cols-2 gap-2" }: { data: MonthlyStatus | null; loading: boolean; className?: string }) {
  return (
    <section aria-label="Trạng thái task trong tháng" className={className}>
      {cards.map((card) => (
        <article key={card.key} className={`flex min-h-[58px] flex-col items-center justify-center gap-1.5 px-2 py-2 ${card.className}`}>
          <div className="flex items-center justify-center gap-2.5">
            <FontAwesomeIcon className="w-4 shrink-0 text-base opacity-80" icon={card.icon} />
            {loading ? <Skeleton className="h-8 w-10 bg-white/40" /> : <strong className="text-3xl leading-none">{data?.[card.key] ?? 0}</strong>}
          </div>
          <span className="text-center text-sm font-bold leading-4">{card.label}</span>
        </article>
      ))}
    </section>
  );
}
