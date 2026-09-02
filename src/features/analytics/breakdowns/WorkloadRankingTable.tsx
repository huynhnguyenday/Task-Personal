"use client";

import { useState } from "react";
import { Skeleton } from "@/components/LoadingSkeleton";
import type { WorkloadRanking } from "./types";
import WorkloadTasksModal, { type WorkloadFilterType } from "./WorkloadTasksModal";

export default function WorkloadRankingTable({ eyebrow, title, filterType, data, loading, error }: { eyebrow: string; title: string; filterType: WorkloadFilterType; data: WorkloadRanking[]; loading: boolean; error: string }) {
  const [selected, setSelected] = useState<WorkloadRanking | null>(null);
  const maximum = Math.max(...data.map((item) => item.count), 1);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
    <article className="flex h-full min-h-[260px] flex-col border border-[#e3e7e9] bg-white p-4 xl:min-h-0">
      <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2></div>{!loading && <strong className="text-sm text-[#28745b]">{total} task</strong>}</div>
      {error && <p className="mt-2 text-xs text-[#a34646]">{error}</p>}
      <div className="scrollbar-analytics mt-3 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
        {loading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />) : data.length ? data.map((item, index) => (
          <button key={`${item.label}-${index}`} className="relative grid min-h-11 w-full grid-cols-[24px_minmax(0,1fr)_42px] items-center gap-2 overflow-hidden bg-[#f2f6f4] px-3 text-left transition hover:ring-1 hover:ring-inset hover:ring-[#28745b] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#28745b]" type="button" onClick={() => setSelected(item)} aria-label={`Xem ${item.count} công việc của ${item.label}`}>
            <div className="absolute inset-y-0 left-0 bg-[#d5e8df]" style={{ width: `${(item.count / maximum) * 100}%` }} />
            <span className="relative text-[10px] font-bold text-[#28745b]">{String(index + 1).padStart(2, "0")}</span>
            <strong className="relative truncate text-xs text-[#30383d]" title={item.label}>{item.label}</strong>
            <strong className="relative text-right text-sm text-[#28745b]">{item.count}</strong>
          </button>
        )) : <p className="py-12 text-center text-sm font-semibold text-[#727a82]">Chưa có dữ liệu.</p>}
      </div>
    </article>
    {selected && <WorkloadTasksModal type={filterType} label={selected.label} count={selected.count} onClose={() => setSelected(null)} />}
    </>
  );
}
