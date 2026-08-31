import { Skeleton } from "@/components/LoadingSkeleton";
import type { WeekdayAverage } from "./types";

export default function AverageWeekdayChart({ data, loading, error }: { data: WeekdayAverage[]; loading: boolean; error: string }) {
  const maximum = Math.max(...data.map((item) => item.average), 1);

  return (
    <article className="flex h-full min-h-[380px] flex-col border border-[#e3e7e9] bg-white p-4">
      <div><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">TRUNG BÌNH THEO THỨ</p><h2 className="mt-1 text-lg font-semibold">Số task trung bình mỗi ngày</h2><p className="mt-1 text-[11px] text-[#727a82]">Tính trên tất cả các ngày từ task đầu tiên đến hiện tại, kể cả ngày không có task.</p></div>
      {error && <p className="mt-3 text-xs text-[#a34646]">{error}</p>}
      <div className="mt-5 flex min-h-[190px] flex-1 items-end gap-2 border-b border-[#dce2de] px-2 pt-6 sm:gap-4">
        {loading ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="min-w-0 flex-1" style={{ height: `${35 + index * 7}%` }}><Skeleton className="h-full w-full" /></div>) : data.map((item) => (
          <div key={item.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <strong className="text-[11px] text-[#28745b] sm:text-xs">{item.average}</strong>
            <div className="w-full max-w-16 bg-[#79af9b] transition-colors group-hover:bg-[#28745b]" style={{ height: `${Math.max((item.average / maximum) * 100, item.average ? 5 : 1)}%` }} title={`${item.label}: trung bình ${item.average} task (${item.total} task tổng)`} />
            <span className="-mb-6 whitespace-nowrap text-[10px] font-bold text-[#515a60] sm:text-xs">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="h-6" />
    </article>
  );
}
