import { Skeleton } from "@/components/LoadingSkeleton";
import type { WorkloadRanking } from "./types";

export default function WorkloadRankingTable({ eyebrow, title, data, loading, error }: { eyebrow: string; title: string; data: WorkloadRanking[]; loading: boolean; error: string }) {
  const maximum = Math.max(...data.map((item) => item.count), 1);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <article className="flex min-h-[260px] flex-col border border-[#e3e7e9] bg-white p-4">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2></div>{!loading && <strong className="text-sm text-[#28745b]">{total} task</strong>}</div>
      {error && <p className="mt-2 text-xs text-[#a34646]">{error}</p>}
      <div className="scrollbar-analytics mt-3 grid max-h-[300px] gap-2 overflow-y-auto pr-1">
        {loading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />) : data.length ? data.map((item, index) => (
          <div key={`${item.label}-${index}`} className="relative grid min-h-11 grid-cols-[24px_minmax(0,1fr)_42px] items-center gap-2 overflow-hidden bg-[#f2f6f4] px-3">
            <div className="absolute inset-y-0 left-0 bg-[#d5e8df]" style={{ width: `${(item.count / maximum) * 100}%` }} />
            <span className="relative text-[10px] font-bold text-[#28745b]">{String(index + 1).padStart(2, "0")}</span>
            <strong className="relative truncate text-xs text-[#30383d]" title={item.label}>{item.label}</strong>
            <strong className="relative text-right text-sm text-[#28745b]">{item.count}</strong>
          </div>
        )) : <p className="py-12 text-center text-sm font-semibold text-[#727a82]">Chưa có dữ liệu.</p>}
      </div>
    </article>
  );
}
