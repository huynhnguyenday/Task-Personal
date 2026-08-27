"use client";

import { FormEvent, useEffect, useState } from "react";

type TaskStatus = string;
type Task = {
  _id: string;
  description: string;
  supportPerson: string;
  category: string;
  department: string;
  company: string;
  workplace: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
};
type TaskForm = Omit<Task, "_id" | "createdAt">;
type Settings = {
  category: string[];
  department: string[];
  company: string[];
  workplace: string[];
  status: string[];
};

const emptyForm: TaskForm = {
  description: "",
  supportPerson: "",
  category: "",
  department: "",
  company: "",
  workplace: "",
  status: "",
  notes: "",
};
const statusLabels: Record<TaskStatus, string> = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
  BLOCKED: "Đang vướng",
};
type StatusTone = "green" | "yellow" | "purple" | "red";

function getStatusTone(status: string): StatusTone {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    ["done", "hoàn thành", "đã hoàn thành", "đã xong"].includes(
      normalizedStatus,
    )
  ) {
    return "green";
  }
  if (
    ["in_progress", "đang thực hiện", "đang làm", "đang tiến hành"].includes(
      normalizedStatus,
    )
  ) {
    return "yellow";
  }
  if (
    ["blocked", "không cần hỗ trợ nữa", "không cần nữa", "đã hủy"].includes(
      normalizedStatus,
    )
  ) {
    return "red";
  }
  return "purple";
}
const emptySettings: Settings = {
  category: [],
  department: [],
  company: [],
  workplace: [],
  status: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function truncateDescription(value: string) {
  return value.length > 40 ? `${value.slice(0, 37)}...` : value;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<TaskForm>(emptyForm);

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("load");
        setTasks(await response.json());
      } catch {
        setError("Chưa thể kết nối với cơ sở dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
    fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("settings");
        setSettings(await response.json());
      })
      .catch(() => undefined);
  }, []);

  function updateForm(field: keyof TaskForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function openModal() {
    setError("");
    setForm(emptyForm);
    setIsModalOpen(true);
  }
  function closeModal() {
    if (!isSaving) setIsModalOpen(false);
  }

  function startEditing(task: Task) {
    setError("");
    setEditingTaskId(task._id);
    setEditingForm({
      description: task.description,
      supportPerson: task.supportPerson,
      category: task.category,
      department: task.department,
      company: task.company,
      workplace: task.workplace,
      status: task.status,
      notes: task.notes,
    });
  }

  function cancelEditing() {
    if (!isSaving) {
      setEditingTaskId(null);
      setEditingForm(emptyForm);
      setError("");
    }
  }

  function updateEditingForm(field: keyof TaskForm, value: string) {
    setEditingForm((current) => ({ ...current, [field]: value }));
  }

  async function saveTaskEdit() {
    if (!editingTaskId || !editingForm.description.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTaskId, ...editingForm }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể cập nhật công việc.");
      setTasks((current) =>
        current.map((task) => (task._id === result._id ? result : task)),
      );
      setEditingTaskId(null);
      setEditingForm(emptyForm);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể cập nhật công việc.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể lưu công việc.");
      setTasks((current) => [result, ...current]);
      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu công việc.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const statusSummary = [
    {
      tone: "yellow" as const,
      label: "Đang làm",
      count: tasks.filter((task) => getStatusTone(task.status) === "yellow")
        .length,
      className: "bg-[#fff4cc] text-[#9a7000]",
    },
    {
      tone: "purple" as const,
      label: "Đang chờ",
      count: tasks.filter((task) => getStatusTone(task.status) === "purple")
        .length,
      className: "bg-[#f1e7ff] text-[#7c4db3]",
    },
    {
      tone: "red" as const,
      label: "Không cần",
      count: tasks.filter((task) => getStatusTone(task.status) === "red")
        .length,
      className: "bg-[#fae0e0] text-[#bd4c4c]",
    },
    {
      tone: "green" as const,
      label: "Hoàn thành",
      count: tasks.filter((task) => getStatusTone(task.status) === "green")
        .length,
      className: "bg-[#e3f0e9] text-[#28745b]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fff] px-2 py-[22px] pb-[50px] text-[#20252b] sm:px-4 sm:py-8 sm:pb-20">
      <header className="relative mx-auto flex max-w-[1440px] items-start justify-between gap-5 border-b border-[#e3e7e9] pb-7 sm:items-center">
        <div className="flex items-center gap-3.5">
          <span className="grid h-[42px] w-[42px] rotate-[-6deg] place-items-center bg-[#28745b] text-[21px] font-bold text-white">
            T
          </span>
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">
              PERSONAL WORKSPACE
            </p>
            <h1 className="text-xl tracking-[-0.4px]">Task board</h1>
          </div>
        </div>
        <a
          className="ml-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#28745b] bg-[#e3f0e9] text-[#727a82] shadow-[0_4px_12px_#27382d0a] transition hover:-translate-y-0.5 hover:border-[#28745b] hover:bg-white hover:text-[#28745b] hover:shadow-[0_7px_16px_#27382d16] focus-visible:outline-2 focus-visible:outline-[#28745b] focus-visible:outline-offset-2"
          href="/setting"
          aria-label="Mở cài đặt"
          title="Cài đặt"
        >
          <span
            className="grid h-6 w-6 place-items-center rounded-full bg-white text-[15px] leading-none transition hover:rotate-[25deg] hover:bg-[#28745b] hover:text-white"
            aria-hidden="true"
          >
            ⚙
          </span>
        </a>
      </header>
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 pb-[30px] pt-3 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0 lg:w-[260px]">
          <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">
            TỔNG QUAN
          </p>
          <p className="mt-2.5 w-max text-sm text-[#727a82]">
            Theo dõi tiến độ và lưu lại những điều quan trọng trong ngày.
          </p>
        </div>
        <div className="flex flex-1 items-center gap-3 lg:ml-auto lg:w-1/2 lg:flex-none">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
            {statusSummary.map((summary) => (
              <div
                className={`grid min-h-[78px] grid-cols-[3fr_2fr] items-center gap-2 px-4 py-3 ${summary.className}`}
                key={summary.tone}
              >
                <strong className="mr-2 justify-self-end text-right text-[34px] leading-none text-current">
                  {summary.count}
                </strong>
                <span className="text-sm font-bold leading-tight">
                  {summary.label.split(" ").map((word) => (
                    <span className="block" key={word}>
                      {word}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <button
            className="grid h-[78px] w-[52px] shrink-0 place-items-center border-0 bg-[#28745b] text-3xl font-light text-white transition hover:bg-[#1e604a]"
            onClick={openModal}
            type="button"
            aria-label="Thêm công việc"
            title="Thêm công việc"
          >
            +
          </button>
        </div>
      </section>
      {error && !isModalOpen && (
        <p className="mx-auto mb-4 max-w-[1440px] text-[13px] text-[#a34646]">
          {error}
        </p>
      )}
      <section
        className="mx-auto max-w-[1440px] overflow-x-auto"
        aria-live="polite"
      >
        {isLoading ? (
          <div className="flex min-h-[250px] min-w-[1000px] flex-col items-center justify-center gap-2 border border-dashed border-[#cbd4cf] text-[13px] text-[#727a82]">
            <span className="h-2 w-2 animate-[pulse_1s_infinite_alternate] rounded-full bg-[#28745b]" />
            Đang tải công việc...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex min-h-[250px] min-w-[1000px] flex-col items-center justify-center gap-2 border border-dashed border-[#cbd4cf] text-[13px] text-[#727a82]">
            <span className="mb-2 grid h-[38px] w-[38px] place-items-center border border-[#cbd4cf] text-2xl text-[#28745b]">
              +
            </span>
            <strong className="text-base text-[#20252b]">
              Chưa có công việc nào
            </strong>
            <span>Bắt đầu ghi nhận công việc đầu tiên của bạn.</span>
          </div>
        ) : (
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[minmax(240px,2.2fr)_minmax(150px,1.35fr)_minmax(130px,1.15fr)_minmax(130px,1.15fr)_minmax(140px,1.2fr)_minmax(125px,1fr)_minmax(140px,1.15fr)_48px] items-center gap-4 px-4 pb-3 text-[10px] font-bold uppercase tracking-[1.2px] text-[#727a82]">
              <span>Mô tả công việc</span>
              <span>Người cần hỗ trợ</span>
              <span>Phòng ban</span>
              <span>Công ty</span>
              <span>Nơi làm việc</span>
              <span>Thời gian</span>
              <span>Trạng thái</span>
              <span aria-hidden="true" />
            </div>
            <div>
              {tasks.map((task) => (
                <div key={task._id}>
                  <article
                    className={`grid grid-cols-[minmax(240px,2.2fr)_minmax(150px,1.35fr)_minmax(130px,1.15fr)_minmax(130px,1.15fr)_minmax(140px,1.2fr)_minmax(125px,1fr)_minmax(140px,1.15fr)_48px] items-center gap-4 px-4 py-4 my-2 text-[13px] text-[#515a60] transition-colors ${getStatusTone(task.status) === "green" ? "bg-[#e3f0e9]" : getStatusTone(task.status) === "yellow" ? "bg-[#fff4cc]" : getStatusTone(task.status) === "red" ? "bg-[#fae0e0]" : "bg-[#f1e7ff]"}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`h-[9px] w-[9px] shrink-0 rounded-full ${getStatusTone(task.status) === "green" ? "bg-[#28745b]" : getStatusTone(task.status) === "yellow" ? "bg-[#d39b00]" : getStatusTone(task.status) === "red" ? "bg-[#bd4c4c]" : "bg-[#7c4db3]"}`}
                      />
                      <div className="min-w-0">
                        <h3
                          className="font-bold leading-[1.4] text-[#20252b]"
                          title={task.description}
                        >
                          {truncateDescription(task.description)}
                        </h3>
                        {task.notes && (
                          <p className="mt-1 truncate text-xs text-[#727a82]">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="truncate">
                      {task.supportPerson || "-"}
                    </span>
                    <span className="truncate">{task.department || "-"}</span>
                    <span className="truncate">{task.company || "-"}</span>
                    <span className="truncate">{task.workplace || "-"}</span>
                    <time
                      className="whitespace-nowrap text-[12px]"
                      dateTime={task.createdAt}
                    >
                      {formatDate(task.createdAt)}
                    </time>
                    <span
                      className={`w-fit px-2 py-1 text-[12px] font-bold ${getStatusTone(task.status) === "green" ? "bg-[#e3f0e9] text-[#28745b]" : getStatusTone(task.status) === "yellow" ? "bg-[#fff0e7] text-[#ae5d32]" : getStatusTone(task.status) === "red" ? "bg-[#fae8e8] text-[#a34646]" : "bg-[#f1e7ff] text-[#7c4db3]"}`}
                    >
                      {statusLabels[task.status] || task.status}
                    </span>
                    <button
                      className="grid h-8 w-8 place-items-center border-0 bg-transparent text-base text-[#727a82] transition hover:bg-white/70 hover:text-[#28745b]"
                      type="button"
                      aria-label={`Sửa công việc ${task.description}`}
                      title="Sửa công việc"
                      onClick={() => startEditing(task)}
                    >
                      ✎
                    </button>
                  </article>
                  {editingTaskId === task._id && (
                    <form
                      className="grid gap-4 bg-white px-4 py-5 shadow-[inset_0_3px_0_#28745b] sm:grid-cols-2 lg:grid-cols-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void saveTaskEdit();
                      }}
                    >
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60] lg:col-span-2">
                        Mô tả công việc *
                        <textarea
                          className="w-full resize-y border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          rows={2}
                          required
                          value={editingForm.description}
                          onChange={(event) =>
                            updateEditingForm("description", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Người cần hỗ trợ
                        <input
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.supportPerson}
                          onChange={(event) =>
                            updateEditingForm(
                              "supportPerson",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Danh mục
                        <select
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.category}
                          onChange={(event) =>
                            updateEditingForm("category", event.target.value)
                          }
                        >
                          <option value="">Chọn danh mục</option>
                          {settings.category.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Phòng ban
                        <select
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.department}
                          onChange={(event) =>
                            updateEditingForm("department", event.target.value)
                          }
                        >
                          <option value="">Chọn phòng ban</option>
                          {settings.department.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Công ty
                        <select
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.company}
                          onChange={(event) =>
                            updateEditingForm("company", event.target.value)
                          }
                        >
                          <option value="">Chọn công ty</option>
                          {settings.company.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Nơi làm việc
                        <select
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.workplace}
                          onChange={(event) =>
                            updateEditingForm("workplace", event.target.value)
                          }
                        >
                          <option value="">Chọn Tỉnh/thành</option>
                          {settings.workplace.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                        Trạng thái
                        <select
                          className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          value={editingForm.status}
                          onChange={(event) =>
                            updateEditingForm("status", event.target.value)
                          }
                        >
                          {(settings.status.length
                            ? settings.status.map(
                                (item) => [item, item] as const,
                              )
                            : Object.entries(statusLabels)
                          ).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-bold text-[#515a60] lg:col-span-2">
                        Ghi chú
                        <textarea
                          className="w-full resize-y border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          rows={2}
                          value={editingForm.notes}
                          onChange={(event) =>
                            updateEditingForm("notes", event.target.value)
                          }
                        />
                      </label>
                      <div className="flex items-end justify-end gap-2 lg:col-span-2">
                        <button
                          className="border border-[#e3e7e9] bg-white px-[17px] py-[11px] text-[#727a82] hover:border-[#a34646] hover:text-[#a34646]"
                          type="button"
                          onClick={cancelEditing}
                        >
                          Hủy
                        </button>
                        <button
                          className="border-0 bg-[#28745b] px-[17px] py-[11px] font-bold text-white hover:bg-[#1e604a] disabled:cursor-wait disabled:opacity-60"
                          type="submit"
                          disabled={isSaving}
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      {isModalOpen && (
        <div
          className="fixed inset-0 z-10 grid place-items-center bg-[#202a25a8] p-5"
          onMouseDown={closeModal}
        >
          <section
            className="max-h-[92vh] w-full max-w-[1100px] overflow-y-auto bg-white p-[22px] shadow-[0_24px_60px_#17251d33] sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="mb-[25px] flex justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">
                  GHI NHẬN MỚI
                </p>
              </div>
              <button
                className="border-0 bg-transparent text-[27px] leading-5 text-[#727a82]"
                onClick={closeModal}
                type="button"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="mt-[17px] grid gap-[7px] text-xs font-bold text-[#515a60]">
                Mô tả công việc *
                <textarea
                  className="w-full resize-y border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                  required
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Bạn đang thực hiện công việc gì?"
                />
              </label>
              <div className="my-[17px] grid gap-[15px] sm:grid-cols-2 sm:gap-x-3.5 sm:gap-y-[17px]">
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Người cần hỗ trợ *
                  <input
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.supportPerson}
                    onChange={(event) =>
                      updateForm("supportPerson", event.target.value)
                    }
                    placeholder="Tên người hỗ trợ"
                  />
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Danh mục *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                  >
                    <option value="">Chọn danh mục</option>
                    {settings.category.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Phòng ban *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.department}
                    onChange={(event) =>
                      updateForm("department", event.target.value)
                    }
                  >
                    <option value="">Chọn phòng ban</option>
                    {settings.department.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Công ty *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.company}
                    onChange={(event) =>
                      updateForm("company", event.target.value)
                    }
                  >
                    <option value="">Chọn công ty</option>
                    {settings.company.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Nơi làm việc *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.workplace}
                    onChange={(event) =>
                      updateForm("workplace", event.target.value)
                    }
                  >
                    <option value="">Chọn Tỉnh/thành</option>
                    {settings.workplace.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Trạng thái *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value)
                    }
                  >
                    <option value="">Chọn trạng thái</option>
                    {(settings.status.length
                      ? settings.status.map((item) => [item, item] as const)
                      : Object.entries(statusLabels)
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-[17px] grid gap-[7px] text-xs font-bold text-[#515a60]">
                Ghi chú
                <textarea
                  className="w-full resize-y border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  placeholder="Thông tin cần nhớ..."
                />
              </label>
              {error && (
                <p className="mt-3.5 text-[13px] text-[#a34646]">{error}</p>
              )}
              <div className="mt-[25px] flex justify-end gap-2.5 max-sm:[&>button]:flex-1">
                <button
                  className="border border-[#e3e7e9] bg-white px-[17px] py-[11px] text-[#727a82]"
                  onClick={closeModal}
                  type="button"
                >
                  Hủy
                </button>
                <button
                  className="border-0 bg-[#28745b] px-[17px] py-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1e604a] disabled:cursor-wait disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Đang lưu..." : "Lưu công việc"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
