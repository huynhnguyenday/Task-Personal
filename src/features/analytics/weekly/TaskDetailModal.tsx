"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase, faBuilding, faCalendarDay, faLayerGroup, faLocationDot, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { WeeklyTask } from "./types";

const details = [
  { key: "supportPerson", label: "Người cần hỗ trợ", icon: faUser },
  { key: "category", label: "Danh mục", icon: faLayerGroup },
  { key: "department", label: "Phòng ban", icon: faBriefcase },
  { key: "company", label: "Công ty", icon: faBuilding },
  { key: "workplace", label: "Nơi làm việc", icon: faLocationDot },
] as const;

export default function TaskDetailModal({ task, onClose }: { task: WeeklyTask | null; onClose: () => void }) {
  useEffect(() => {
    if (!task) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [task, onClose]);

  if (!task) return null;
  const createdAt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(task.createdAt));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#17251d]/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onMouseDown={onClose}>
      <section className="scrollbar-analytics max-h-[90dvh] w-full max-w-[720px] overflow-y-auto bg-white shadow-[0_24px_70px_rgba(20,35,29,0.3)]" onMouseDown={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e3e7e9] bg-white px-5 py-5 sm:px-7">
          <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">CHI TIẾT CÔNG VIỆC</p><h2 id="task-detail-title" className="mt-1 text-xl font-semibold">Thông tin task</h2></div>
          <button className="grid h-9 w-9 place-items-center bg-[#f5f7f5] text-[#727a82] transition hover:bg-[#e3f0e9] hover:text-[#28745b]" type="button" aria-label="Đóng chi tiết" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </header>
        <div className="p-5 sm:p-7">
          <div className="border-l-4 border-[#28745b] bg-[#f5f7f5] p-4"><p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#727a82]">Mô tả công việc</p><p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-[#20252b]">{task.description}</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {details.map((detail) => <div key={detail.key} className="border border-[#e3e7e9] p-3.5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-[#727a82]"><FontAwesomeIcon className="text-[#28745b]" icon={detail.icon} />{detail.label}</p><p className="mt-2 truncate text-sm font-semibold">{task[detail.key] || "—"}</p></div>)}
            <div className="border border-[#e3e7e9] p-3.5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-[#727a82]"><FontAwesomeIcon className="text-[#28745b]" icon={faCalendarDay} />Ngày tạo</p><p className="mt-2 text-sm font-semibold">{createdAt}</p></div>
          </div>
          <div className="mt-3 flex items-center justify-between bg-[#e3f0e9] px-4 py-3"><span className="text-xs font-bold uppercase tracking-[1px] text-[#527265]">Trạng thái</span><strong className="text-sm text-[#28745b]">{task.status}</strong></div>
          <div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#727a82]">Ghi chú</p><p className="mt-2 min-h-16 whitespace-pre-wrap border border-[#e3e7e9] bg-[#fafbfa] p-4 text-sm leading-6 text-[#515a60]">{task.notes || "Không có ghi chú."}</p></div>
        </div>
      </section>
    </div>
  );
}
