import { Skeleton } from "@/components/LoadingSkeleton";
import type { MonthlyStatus } from "./types";

const cards = [
  { key: "inProgress", label: "Đang làm", className: "bg-[#fff4cc] text-[#9a7000]" },
  { key: "waiting", label: "Đang chờ", className: "bg-[#f1e7ff] text-[#7c4db3]" },
  { key: "cancelled", label: "Không cần", className: "bg-[#fae0e0] text-[#bd4c4c]" },
  { key: "completed", label: "Hoàn thành", className: "bg-[#e3f0e9] text-[#28745b]" },
] as const;

export default function MonthlyStatusCards({ data, loading }: { data: MonthlyStatus | null; loading: boolean }) {
  return (
    <section aria-label="Trạng thái task trong tháng" className="grid shrink-0 grid-cols-2 gap-2">
      {cards.map((card) => (
        <article key={card.key} className={`flex min-h-[58px] items-center justify-center gap-2 px-2 py-2 ${card.className}`}>
          {loading ? <Skeleton className="h-7 w-9 bg-white/40" /> : <strong className="text-2xl leading-none">{data?.[card.key] ?? 0}</strong>}
          <span className="text-xs font-bold leading-4">{card.label}</span>
        </article>
      ))}
    </section>
  );
}
