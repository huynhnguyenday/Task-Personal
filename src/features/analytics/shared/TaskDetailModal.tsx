"use client";

import { FormEvent, useEffect, useState } from "react";
import { faBriefcase, faBuilding, faCalendarDay, faFloppyDisk, faLayerGroup, faLocationDot, faPen, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TaskDetail } from "./types";

type EditForm = Omit<TaskDetail, "id">;

const detailFields = [
  { key: "supportPerson", label: "Người cần hỗ trợ", icon: faUser },
  { key: "category", label: "Danh mục", icon: faLayerGroup },
  { key: "department", label: "Phòng ban", icon: faBriefcase },
  { key: "company", label: "Công ty", icon: faBuilding },
  { key: "workplace", label: "Nơi làm việc", icon: faLocationDot },
] as const;

function toForm(task: TaskDetail): EditForm {
  return { description: task.description, supportPerson: task.supportPerson, category: task.category, department: task.department, company: task.company, workplace: task.workplace, status: task.status, notes: task.notes, createdAt: new Date(task.createdAt).toISOString().slice(0, 10) };
}

type ModalProps = { task: TaskDetail | null; onClose: () => void; onTaskUpdated?: (task: TaskDetail) => void };

export default function TaskDetailModal({ task, onClose, onTaskUpdated }: ModalProps) {
  if (!task) return null;
  return <TaskDetailContent key={task.id} task={task} onClose={onClose} onTaskUpdated={onTaskUpdated} />;
}

function TaskDetailContent({ task, onClose, onTaskUpdated }: { task: TaskDetail; onClose: () => void; onTaskUpdated?: (task: TaskDetail) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<EditForm>(() => toForm(task));

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [task, onClose]);

  function updateField(field: keyof EditForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id, ...form }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể cập nhật task.");
      const updated: TaskDetail = { id: String(result._id), description: result.description, supportPerson: result.supportPerson, category: result.category, department: result.department, company: result.company, workplace: result.workplace, status: result.status, notes: result.notes ?? "", createdAt: result.createdAt };
      setForm(toForm(updated));
      setEditing(false);
      onTaskUpdated?.(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật task.");
    } finally {
      setSaving(false);
    }
  }

  const createdAt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(task.createdAt));
  const fieldClass = "mt-2 h-10 w-full border border-[#cfd7d3] bg-white px-3 text-sm font-semibold text-[#30383d] outline-none focus:border-[#28745b]";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#17251d]/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onMouseDown={() => { if (!saving) onClose(); }}>
      <section className="scrollbar-analytics max-h-[90dvh] w-full max-w-[720px] overflow-y-auto bg-white shadow-[0_24px_70px_rgba(20,35,29,0.3)]" onMouseDown={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e3e7e9] bg-white px-5 py-5 sm:px-7">
          <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">CHI TIẾT CÔNG VIỆC</p><h2 id="task-detail-title" className="mt-1 text-xl font-semibold">{editing ? "Chỉnh sửa task" : "Thông tin task"}</h2></div>
          <div className="flex gap-2">
            {!editing && <button className="inline-flex h-9 items-center gap-2 bg-[#e3f0e9] px-3 text-xs font-bold text-[#28745b] transition hover:bg-[#cfe3da]" type="button" onClick={() => setEditing(true)}><FontAwesomeIcon icon={faPen} />Chỉnh sửa</button>}
            <button className="grid h-9 w-9 place-items-center bg-[#f5f7f5] text-[#515a60] transition hover:bg-[#e3f0e9] hover:text-[#28745b]" type="button" aria-label="Đóng chi tiết" disabled={saving} onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
        </header>

        {editing ? (
          <form className="p-5 sm:p-7" onSubmit={save}>
            <label className="block text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]">Mô tả công việc<textarea className="mt-2 min-h-24 w-full resize-y border border-[#cfd7d3] bg-white p-3 text-sm font-semibold text-[#30383d] outline-none focus:border-[#28745b]" value={form.description} onChange={(event) => updateField("description", event.target.value)} required /></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detailFields.map((field) => <label key={field.key} className="text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]"><span className="flex items-center gap-2"><FontAwesomeIcon className="text-[#28745b]" icon={field.icon} />{field.label}</span><input className={fieldClass} value={form[field.key]} onChange={(event) => updateField(field.key, event.target.value)} required /></label>)}
              <label className="text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]"><span className="flex items-center gap-2"><FontAwesomeIcon className="text-[#28745b]" icon={faCalendarDay} />Ngày tạo</span><input className={fieldClass} type="date" value={form.createdAt} onChange={(event) => updateField("createdAt", event.target.value)} required /></label>
              <label className="text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]">Trạng thái<input className={fieldClass} value={form.status} onChange={(event) => updateField("status", event.target.value)} required /></label>
            </div>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]">Ghi chú<textarea className="mt-2 min-h-20 w-full resize-y border border-[#cfd7d3] bg-white p-3 text-sm font-medium text-[#30383d] outline-none focus:border-[#28745b]" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} /></label>
            {error && <p className="mt-3 text-xs font-semibold text-[#bd4c4c]">{error}</p>}
            <div className="mt-5 flex justify-end gap-2"><button className="h-10 border border-[#cfd7d3] px-4 text-xs font-bold text-[#515a60]" type="button" disabled={saving} onClick={() => { setForm(toForm(task)); setEditing(false); setError(""); }}>Hủy</button><button className="inline-flex h-10 items-center gap-2 bg-[#28745b] px-4 text-xs font-bold text-white disabled:opacity-60" type="submit" disabled={saving}><FontAwesomeIcon icon={faFloppyDisk} />{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
          </form>
        ) : (
          <div className="p-5 sm:p-7">
            <div className="border-l-4 border-[#28745b] bg-[#f5f7f5] p-4"><p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#515a60]">Mô tả công việc</p><p className="mt-2 whitespace-pre-wrap text-[15px] font-medium leading-6 text-[#20252b]">{task.description}</p></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{detailFields.map((detail) => <div key={detail.key} className="border border-[#e3e7e9] p-3.5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]"><FontAwesomeIcon className="text-[#28745b]" icon={detail.icon} />{detail.label}</p><p className="mt-2 truncate text-sm font-semibold">{task[detail.key] || "—"}</p></div>)}<div className="border border-[#e3e7e9] p-3.5"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-[#515a60]"><FontAwesomeIcon className="text-[#28745b]" icon={faCalendarDay} />Ngày tạo</p><p className="mt-2 text-sm font-semibold">{createdAt}</p></div></div>
            <div className="mt-3 flex items-center justify-between bg-[#e3f0e9] px-4 py-3"><span className="text-xs font-bold uppercase tracking-[1px] text-[#527265]">Trạng thái</span><strong className="text-sm text-[#28745b]">{task.status}</strong></div>
            <div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#515a60]">Ghi chú</p><p className="mt-2 min-h-16 whitespace-pre-wrap border border-[#e3e7e9] bg-[#fafbfa] p-4 text-sm font-medium leading-6 text-[#3f494f]">{task.notes || "Không có ghi chú."}</p></div>
          </div>
        )}
      </section>
    </div>
  );
}
