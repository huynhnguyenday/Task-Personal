"use client";

import { useEffect, useState } from "react";
import { faChevronRight, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Skeleton } from "@/components/LoadingSkeleton";
import TaskDetailModal from "../shared/TaskDetailModal";
import type { TaskDetail } from "../shared/types";

export type WorkloadFilterType = "department" | "category";
type Cursor = { date: string; id: string };
type ApiTask = Omit<TaskDetail, "id"> & { _id: string };
type TasksResponse = { tasks: ApiTask[]; hasMore: boolean; nextCursor: Cursor | null };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function toTaskDetail(task: ApiTask): TaskDetail {
  return { ...task, id: task._id };
}

function statusTone(status: string) {
  const value = status.trim().toLocaleLowerCase("vi");
  if (["done", "hoàn thành", "đã hoàn thành", "đã xong"].includes(value)) return "border-[#28745b] bg-[#e3f0e9] text-[#28745b]";
  if (["in_progress", "đang thực hiện", "đang làm", "đang tiến hành"].includes(value)) return "border-[#d39b00] bg-[#fff4cc] text-[#9b7100]";
  if (["blocked", "không cần hỗ trợ nữa", "không cần nữa", "đã hủy"].includes(value)) return "border-[#bd4c4c] bg-[#fae0e0] text-[#a34646]";
  return "border-[#7c4db3] bg-[#f1e7ff] text-[#70429e]";
}

export default function WorkloadTasksModal({ type, label, count, onClose }: { type: WorkloadFilterType; label: string; count: number; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [supportPerson, setSupportPerson] = useState("");
  const [query, setQuery] = useState({ description: "", supportPerson: "" });
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery({ description: description.trim(), supportPerson: supportPerson.trim() }), 350);
    return () => window.clearTimeout(timeout);
  }, [description, supportPerson]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.append(type, label);
    if (query.description) params.set("description", query.description);
    if (query.supportPerson) params.set("supportPerson", query.supportPerson);
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });
    fetch(`/api/tasks?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as TasksResponse & { error?: string };
        if (!response.ok) throw new Error(result.error || "Không thể tải công việc");
        setTasks(result.tasks.map(toTaskDetail));
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải công việc");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [label, query, type]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !selectedTask) onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, selectedTask]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    const params = new URLSearchParams();
    params.append(type, label);
    if (query.description) params.set("description", query.description);
    if (query.supportPerson) params.set("supportPerson", query.supportPerson);
    params.set("cursorDate", cursor.date);
    params.set("cursorId", cursor.id);
    try {
      const response = await fetch(`/api/tasks?${params}`, { cache: "no-store" });
      const result = await response.json() as TasksResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Không thể tải thêm công việc");
      setTasks((current) => [...current, ...result.tasks.map(toTaskDetail)]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải thêm công việc");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#17251d]/60 p-0 backdrop-blur-[2px] md:items-center md:p-4" role="dialog" aria-modal="true" aria-labelledby="workload-tasks-title" onMouseDown={onClose}>
        <section className="flex h-[92dvh] w-full max-w-[1040px] flex-col overflow-hidden bg-[#f5f7f5] shadow-[0_24px_70px_rgba(20,35,29,0.3)] md:h-[min(86dvh,780px)]" onMouseDown={(event) => event.stopPropagation()}>
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e3e7e9] bg-white px-4 py-4 md:px-6">
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#28745b]">{type === "department" ? "PHÒNG BAN" : "DANH MỤC"}</p><h2 id="workload-tasks-title" className="mt-1 truncate text-lg font-semibold md:text-xl">{label}</h2><p className="mt-1 text-xs text-[#727a82]">{count} công việc</p></div>
            <button className="grid h-10 w-10 shrink-0 place-items-center bg-[#f5f7f5] text-[#515a60] hover:bg-[#e3f0e9] hover:text-[#28745b]" type="button" aria-label="Đóng danh sách" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
          </header>
          <div className="grid shrink-0 gap-2 border-b border-[#e3e7e9] bg-white p-3 md:grid-cols-2 md:p-4">
            <label className="relative"><span className="sr-only">Lọc theo mô tả</span><FontAwesomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#727a82]" icon={faMagnifyingGlass} /><input className="h-11 w-full border border-[#d9dfe0] bg-[#fafbfa] pl-9 pr-9 text-sm outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]" type="search" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tìm theo mô tả công việc..." />{description && <button className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#727a82]" type="button" aria-label="Xóa nội dung tìm mô tả" onClick={() => setDescription("")}><FontAwesomeIcon icon={faXmark} /></button>}</label>
            <label className="relative"><span className="sr-only">Lọc theo người cần hỗ trợ</span><FontAwesomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#727a82]" icon={faMagnifyingGlass} /><input className="h-11 w-full border border-[#d9dfe0] bg-[#fafbfa] pl-9 pr-9 text-sm outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]" type="search" value={supportPerson} onChange={(event) => setSupportPerson(event.target.value)} placeholder="Tìm theo người cần hỗ trợ..." />{supportPerson && <button className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#727a82]" type="button" aria-label="Xóa nội dung tìm tên" onClick={() => setSupportPerson("")}><FontAwesomeIcon icon={faXmark} /></button>}</label>
          </div>
          <div className="scrollbar-analytics min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
            {error && <p className="mb-3 text-xs text-[#a34646]">{error}</p>}
            {loading ? <div className="grid gap-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[86px] w-full" />)}</div> : tasks.length ? <div className="grid gap-2">{tasks.map((task) => (
              <button key={task.id} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 border-l-4 p-3 text-left transition hover:-translate-y-px hover:shadow-sm md:grid-cols-[minmax(0,1.7fr)_minmax(130px,.8fr)_minmax(110px,.65fr)_auto] md:items-center md:px-4 ${statusTone(task.status)}`} type="button" onClick={() => setSelectedTask(task)}>
                <div className="min-w-0"><strong className="line-clamp-2 text-sm leading-5 text-[#20252b]">{task.description}</strong>{task.notes && <p className="mt-1 truncate text-[11px] font-medium text-[#727a82]">{task.notes}</p>}</div>
                <div className="hidden min-w-0 md:block"><span className="block text-[9px] font-bold uppercase tracking-wide text-[#727a82]">Người hỗ trợ</span><strong className="mt-1 block truncate text-xs text-[#3f494f]">{task.supportPerson || "—"}</strong></div>
                <div className="hidden md:block"><span className="block text-[9px] font-bold uppercase tracking-wide text-[#727a82]">Ngày tạo</span><time className="mt-1 block text-xs font-bold text-[#3f494f]">{formatDate(task.createdAt)}</time></div>
                <FontAwesomeIcon className="self-center text-xs text-[#28745b]" icon={faChevronRight} />
                <div className="col-span-2 flex items-center justify-between text-[10px] font-bold md:hidden"><span>{task.supportPerson || "—"}</span><time>{formatDate(task.createdAt)}</time></div>
              </button>
            ))}</div> : <div className="grid min-h-52 place-items-center border border-dashed border-[#cbd4cf] bg-white px-4 text-center text-sm font-semibold text-[#727a82]">Không tìm thấy công việc phù hợp.</div>}
            {hasMore && !loading && <button className="mx-auto mt-4 block h-10 border border-[#28745b] bg-white px-5 text-xs font-bold text-[#28745b] hover:bg-[#e3f0e9] disabled:opacity-60" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Đang tải..." : "Xem thêm công việc"}</button>}
          </div>
        </section>
      </div>
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onTaskUpdated={(updated) => { setTasks((current) => current.map((item) => item.id === updated.id ? updated : item)); setSelectedTask(updated); }} />
    </>
  );
}
