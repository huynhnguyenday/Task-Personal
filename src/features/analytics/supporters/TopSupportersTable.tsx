"use client";

import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Skeleton } from "@/components/LoadingSkeleton";
import TaskDetailModal from "../shared/TaskDetailModal";
import type { TaskDetail } from "../shared/types";
import type { Supporter } from "./types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function TopSupportersTable({ data, loading, onTaskUpdated }: { data: Supporter[]; loading: boolean; onTaskUpdated: () => void }) {
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);

  return (
    <article className="flex h-full min-h-0 flex-col border border-[#e3e7e9] bg-white p-3.5 sm:p-4">
      <div className="shrink-0"><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">TRONG THÁNG</p><h2 className="mt-1 text-lg font-semibold">Top 10 người yêu cầu hỗ trợ</h2></div>
      <div className="scrollbar-analytics mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {loading ? <div className="grid gap-2">{Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : data.length ? (
          <ol className="grid list-none gap-2 p-0">
            {data.map((person, index) => {
              const expanded = expandedName === person.name;
              const departments = person.departments.filter(Boolean).join(", ") || "Chưa có phòng ban";
              return (
                <li key={person.name} className="overflow-hidden border border-transparent bg-[#e3f0e9] data-[expanded=true]:border-[#a8c9bc]" data-expanded={expanded}>
                  <button className="relative grid min-h-14 w-full grid-cols-[20px_minmax(0,1fr)_38px_12px] items-center gap-2 overflow-hidden px-2 text-left md:grid-cols-[20px_minmax(120px,1fr)_minmax(140px,0.85fr)_44px_12px] md:gap-3 md:px-3" type="button" aria-expanded={expanded} onClick={() => setExpandedName(expanded ? null : person.name)}>
                    <span className="relative w-5 shrink-0 text-xs font-bold text-[#28745b]">{String(index + 1).padStart(2, "0")}</span>
                    <strong className="relative block min-w-0 truncate text-sm font-bold text-[#30383d]">{person.name}</strong>
                    <span className="relative hidden min-w-0 truncate text-center text-xs font-bold text-[#3f494f] md:block">{departments}</span>
                    <strong className="relative text-center text-sm text-[#28745b]">{person.count}</strong>
                    <FontAwesomeIcon className={`relative w-3 text-[#515a60] transition-transform ${expanded ? "rotate-180" : ""}`} icon={faChevronDown} />
                  </button>
                  {expanded && (
                    <div className="grid gap-1.5 border-t border-[#dce6e1] bg-white p-2">
                      {person.tasks.map((task, taskIndex) => (
                        <button key={task.id} className="grid grid-cols-[20px_minmax(0,1fr)_72px] items-center gap-2 bg-[#e5efea] px-2 py-2.5 text-left transition hover:bg-[#bfd8cd] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#28745b] md:grid-cols-[24px_minmax(120px,1fr)_minmax(130px,0.85fr)_88px] md:px-2.5 md:py-2" type="button" onClick={() => setSelectedTask(task)}>
                          <span className="text-[10px] font-bold text-[#28745b]">{String(taskIndex + 1).padStart(2, "0")}</span>
                          <strong className="block min-w-0 truncate text-xs font-bold text-[#3f494f]" title={task.description}>{task.description}</strong>
                          <span className="hidden min-w-0 truncate text-center text-[10px] font-bold text-[#515a60] md:block">{task.department || "Chưa có phòng ban"}</span>
                          <span className="text-center text-[10px] font-semibold text-[#515a60]">{formatDate(task.createdAt)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : <p className="grid h-full place-items-center text-sm font-semibold text-[#515a60]">Chưa có dữ liệu trong tháng.</p>}
      </div>
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onTaskUpdated={() => { setSelectedTask(null); onTaskUpdated(); }} />
    </article>
  );
}
