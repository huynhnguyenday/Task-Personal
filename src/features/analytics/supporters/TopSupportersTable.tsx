import { Skeleton } from "@/components/LoadingSkeleton";
import type { Supporter } from "./types";

export default function TopSupportersTable({ data, loading }: { data: Supporter[]; loading: boolean }) {
  const max = Math.max(...data.map((person) => person.count), 1);
  return (
    <article className="flex h-full min-h-0 flex-col border border-[#e3e7e9] bg-white p-3.5 sm:p-4">
      <div className="shrink-0"><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">TRONG THÁNG</p><h2 className="mt-1 text-lg font-semibold">Top người yêu cầu hỗ trợ</h2></div>
      <div className="scrollbar-analytics mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {loading ? <div className="grid gap-2">{Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div> : data.length ? (
          <ol className="grid list-none gap-2 p-0">{data.map((person, index) => <li key={person.name} className="relative flex min-h-10 items-center gap-3 overflow-hidden bg-[#f5f7f5] px-3"><span className="absolute inset-y-0 left-0 bg-[#e3f0e9]" style={{ width: `${(person.count / max) * 100}%` }} /><span className="relative w-5 text-xs font-bold text-[#28745b]">{String(index + 1).padStart(2, "0")}</span><span className="relative min-w-0 flex-1 truncate text-sm text-[#515a60]">{person.name}</span><strong className="relative text-sm text-[#28745b]">{person.count}</strong></li>)}</ol>
        ) : <p className="grid h-full place-items-center text-sm text-[#727a82]">Chưa có dữ liệu trong tháng.</p>}
      </div>
    </article>
  );
}
