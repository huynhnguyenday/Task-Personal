"use client";

import { FormEvent, UIEvent, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faFilterCircleXmark,
  faPencil,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Skeleton, TaskTableSkeleton } from "@/components/LoadingSkeleton";

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
  categoryId: string;
  departmentId: string;
  companyId: string;
  workplaceId: string;
  statusId: string;
  notes: string;
  createdAt: string;
};
type TaskForm = Omit<Task, "_id" | "createdAt" | "category" | "department" | "company" | "workplace" | "status">;
type EditingTaskForm = TaskForm & { createdAt: string };
type SettingItem = { id: string; name: string };
type Settings = {
  category: SettingItem[];
  department: SettingItem[];
  company: SettingItem[];
  workplace: SettingItem[];
  status: SettingItem[];
};

const emptyForm: TaskForm = {
  description: "",
  supportPerson: "",
  categoryId: "",
  departmentId: "",
  companyId: "",
  workplaceId: "",
  statusId: "",
  notes: "",
};
const emptyEditingForm: EditingTaskForm = { ...emptyForm, createdAt: "" };
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

function isWaitingStatus(status: string) {
  return status.trim().toLocaleLowerCase("vi") === "đang chờ";
}
const emptySettings: Settings = {
  category: [],
  department: [],
  company: [],
  workplace: [],
  status: [],
};
const TASKS_PER_PAGE = 20;
type TaskCursor = { date: string; id: string };
type TasksResponse = {
  tasks: Task[];
  hasMore: boolean;
  nextCursor: TaskCursor | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateInput(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function truncateDescription(value: string) {
  return value.length > 40 ? `${value.slice(0, 37)}...` : value;
}

function dateInputToFilterValue(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

function filterValueToDateInput(value: string) {
  const [day, month, year] = value.split("/");
  return year && month && day ? `${year}-${month}-${day}` : "";
}

type FilterKey =
  | "description"
  | "supportPerson"
  | "department"
  | "company"
  | "workplace"
  | "createdAt"
  | "status";

const filterFields: { key: FilterKey; label: string }[] = [
  { key: "description", label: "Mô tả công việc" },
  { key: "supportPerson", label: "Người cần hỗ trợ" },
  { key: "department", label: "Phòng ban" },
  { key: "company", label: "Công ty" },
  { key: "workplace", label: "Nơi làm việc" },
  { key: "createdAt", label: "Thời gian" },
  { key: "status", label: "Trạng thái" },
];

const emptyFilters: Record<FilterKey, string[]> = {
  description: [],
  supportPerson: [],
  department: [],
  company: [],
  workplace: [],
  createdAt: [],
  status: [],
};

function createTaskQuery(
  filters: Record<FilterKey, string[]>,
  cursor?: TaskCursor | null,
) {
  const params = new URLSearchParams({ limit: String(TASKS_PER_PAGE) });

  for (const { key } of filterFields) {
    filters[key].forEach((value) => params.append(key, value));
  }

  if (cursor) {
    params.set("cursorDate", cursor.date);
    params.set("cursorId", cursor.id);
  }

  return params;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTasks, setHasMoreTasks] = useState(true);
  const nextCursorRef = useRef<TaskCursor | null>(null);
  const isLoadingMoreRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingForm, setEditingForm] =
    useState<EditingTaskForm>(emptyEditingForm);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [activeFilters, setActiveFilters] =
    useState<Record<FilterKey, string[]>>(emptyFilters);
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [supportPersonSearch, setSupportPersonSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const value = descriptionSearch.trim();
      setActiveFilters((current) => {
        const currentValue = current.description[0] || "";
        if (currentValue === value) return current;
        return { ...current, description: value ? [value] : [] };
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [descriptionSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const value = supportPersonSearch.trim();
      setActiveFilters((current) => {
        const currentValue = current.supportPerson[0] || "";
        if (currentValue === value) return current;
        return { ...current, supportPerson: value ? [value] : [] };
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [supportPersonSearch]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setIsLoading(true);
      setError("");
      setHasMoreTasks(false);
      nextCursorRef.current = null;
      isLoadingMoreRef.current = false;
      try {
        const response = await fetch(
          `/api/tasks?${createTaskQuery(activeFilters)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("load");
        const result = (await response.json()) as TasksResponse;
        setTasks(result.tasks);
        setHasMoreTasks(result.hasMore);
        nextCursorRef.current = result.nextCursor;
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError("Chưa thể kết nối với cơ sở dữ liệu.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    loadTasks();
    return () => controller.abort();
  }, [activeFilters]);

  useEffect(() => {
    fetch("/api/settings?format=items")
      .then(async (response) => {
        if (!response.ok) throw new Error("settings");
        setSettings(await response.json());
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!openFilter) return;

    function closeFilterOnOutsideClick(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(`[data-filter-key="${openFilter}"]`)) {
        setOpenFilter(null);
      }
    }

    document.addEventListener("pointerdown", closeFilterOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeFilterOnOutsideClick);
  }, [openFilter]);

  async function loadMoreTasks() {
    const cursor = nextCursorRef.current;
    if (!cursor || !hasMoreTasks || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const params = createTaskQuery(activeFilters, cursor);
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("load more");
      const result = (await response.json()) as TasksResponse;
      setTasks((current) => {
        const existingIds = new Set(current.map((task) => task._id));
        return [
          ...current,
          ...result.tasks.filter((task) => !existingIds.has(task._id)),
        ];
      });
      setHasMoreTasks(result.hasMore);
      nextCursorRef.current = result.nextCursor;
    } catch {
      setError("Chưa thể tải thêm công việc.");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }

  function handleTaskScroll(event: UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight <= 120) {
      void loadMoreTasks();
    }
  }

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
    setDeletingTaskId(null);
    setEditingTaskId(task._id);
    setEditingForm({
      description: task.description,
      supportPerson: task.supportPerson,
      categoryId: task.categoryId,
      departmentId: task.departmentId,
      companyId: task.companyId,
      workplaceId: task.workplaceId,
      statusId: task.statusId,
      notes: task.notes,
      createdAt: formatDateInput(task.createdAt),
    });
  }

  function askToDeleteTask(taskId: string) {
    setError("");
    setEditingTaskId(null);
    setDeletingTaskId(taskId);
  }

  async function deleteTask(taskId: string) {
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể xóa công việc.");
      setTasks((current) => current.filter((task) => task._id !== taskId));
      setDeletingTaskId(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa công việc.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function cancelEditing() {
    if (!isSaving) {
      setEditingTaskId(null);
      setEditingForm(emptyEditingForm);
      setError("");
    }
  }

  function updateEditingForm(field: keyof EditingTaskForm, value: string) {
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
      setEditingForm(emptyEditingForm);
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

  function getFilterValue(task: Task, key: FilterKey) {
    if (key === "createdAt") return formatDate(task.createdAt);
    return task[key];
  }

  function toggleFilter(key: FilterKey, value: string) {
    setActiveFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  function clearFilter(key: FilterKey) {
    if (key === "description") setDescriptionSearch("");
    if (key === "supportPerson") setSupportPersonSearch("");
    setActiveFilters((current) => ({ ...current, [key]: [] }));
  }

  function clearAllFilters() {
    setDescriptionSearch("");
    setSupportPersonSearch("");
    setActiveFilters({ ...emptyFilters });
    setOpenFilter(null);
  }

  const filteredTasks = tasks.filter((task) =>
    filterFields.every(({ key }) => {
      const selectedValues = activeFilters[key];
      return (
        selectedValues.length === 0 ||
        (key === "description" || key === "supportPerson"
          ? getFilterValue(task, key)
              .toLocaleLowerCase("vi")
              .includes(selectedValues[0].toLocaleLowerCase("vi"))
          : selectedValues.includes(getFilterValue(task, key)))
      );
    }),
  );
  const hasActiveFilters = filterFields.some(
    ({ key }) => activeFilters[key].length > 0,
  );

  function getFilterOptions(key: FilterKey) {
    if (key === "department") return settings.department.map((item) => item.name);
    if (key === "company") return settings.company.map((item) => item.name);
    if (key === "workplace") return settings.workplace.map((item) => item.name);
    if (key === "status" && settings.status.length) return settings.status.map((item) => item.name);

    return [...new Set(tasks.map((task) => getFilterValue(task, key)))].sort(
      (first, second) => first.localeCompare(second, "vi"),
    );
  }

  const visibleStatusCounts = filteredTasks.reduce<Record<StatusTone, number>>(
    (counts, task) => {
      counts[getStatusTone(task.status)] += 1;
      return counts;
    },
    { green: 0, yellow: 0, purple: 0, red: 0 },
  );

  const visibleWaitingCount = filteredTasks.filter((task) =>
    isWaitingStatus(task.status),
  ).length;

  const statusSummary = [
    {
      tone: "yellow" as const,
      label: "Đang làm",
      count: visibleStatusCounts.yellow,
      className: "bg-[#fff4cc] text-[#9a7000]",
    },
    {
      tone: "purple" as const,
      label: "Đang chờ",
      count: visibleWaitingCount,
      className: "bg-[#f1e7ff] text-[#7c4db3]",
    },
    {
      tone: "red" as const,
      label: "Không cần",
      count: visibleStatusCounts.red,
      className: "bg-[#fae0e0] text-[#bd4c4c]",
    },
    {
      tone: "green" as const,
      label: "Hoàn thành",
      count: visibleStatusCounts.green,
      className: "bg-[#e3f0e9] text-[#28745b]",
    },
  ];

  return (
    <main className="scrollbar-task min-h-dvh w-full min-w-0 overflow-y-auto bg-[#fff] px-3 py-5 pb-20 text-[#20252b] sm:px-4 sm:py-8 md:h-screen md:overflow-hidden md:pb-20">
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
      </header>
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 pb-[30px] pt-3 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0 lg:w-[260px]">
          <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">
            TỔNG QUAN
          </p>
          <p className="mt-2.5 max-w-full text-sm leading-5 text-[#727a82]">
            Theo dõi tiến độ và lưu lại những điều quan trọng trong ngày.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-row sm:gap-3 lg:ml-auto lg:w-1/2 lg:flex-none">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {statusSummary.map((summary) => (
              <div
                className={`grid min-h-[70px] grid-cols-1 place-items-center gap-1 px-2 py-3 text-center sm:min-h-[78px] sm:grid-cols-[3fr_2fr] sm:px-4 sm:text-left ${summary.className}`}
                key={summary.tone}
              >
                  <strong className="text-[28px] leading-none text-current sm:mr-2 sm:justify-self-end sm:text-right sm:text-[34px]">
                  {summary.count}
                </strong>
                <span className="text-[11px] font-bold leading-tight sm:text-sm">
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
            className="grid h-11 w-full shrink-0 place-items-center border-0 bg-[#28745b] text-2xl font-light text-white transition hover:bg-[#1e604a] sm:h-[78px] sm:w-[52px] sm:text-3xl"
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
        className="mx-auto max-w-[1440px] overflow-visible md:overflow-x-auto"
        aria-live="polite"
      >
        {isLoading ? (
          <TaskTableSkeleton />
        ) : (
          <div className="md:min-w-[1000px]">
            <div className="mb-3 grid min-w-0 max-w-full gap-2 overflow-hidden md:hidden">
              <div className="grid grid-cols-2 gap-2">
                <input className="h-10 min-w-0 border border-[#d9dfe0] bg-[#fafbfa] px-3 text-sm outline-none focus:border-[#28745b]" type="search" value={descriptionSearch} onChange={(event) => setDescriptionSearch(event.target.value)} placeholder="Tìm công việc..." aria-label="Tìm theo mô tả" />
                <input className="h-10 min-w-0 border border-[#d9dfe0] bg-[#fafbfa] px-3 text-sm outline-none focus:border-[#28745b]" type="search" value={supportPersonSearch} onChange={(event) => setSupportPersonSearch(event.target.value)} placeholder="Người hỗ trợ..." aria-label="Tìm theo người hỗ trợ" />
              </div>
              <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
                {(["department", "company", "workplace", "status"] as const).map((key) => <select className="h-9 min-w-[135px] border border-[#d9dfe0] bg-white px-2 text-xs font-semibold text-[#515a60]" key={key} value={activeFilters[key][0] || ""} onChange={(event) => setActiveFilters((current) => ({ ...current, [key]: event.target.value ? [event.target.value] : [] }))}><option value="">{filterFields.find((field) => field.key === key)?.label}</option>{getFilterOptions(key).map((value) => <option key={value} value={value}>{statusLabels[value] || value}</option>)}</select>)}
                {hasActiveFilters && <button className="h-9 shrink-0 bg-[#fae0e0] px-3 text-xs font-bold text-[#a34646]" type="button" onClick={clearAllFilters}>Xóa lọc</button>}
              </div>
            </div>
            <div className="hidden grid-cols-[minmax(240px,2.2fr)_minmax(150px,1.35fr)_minmax(130px,1.15fr)_minmax(130px,1.15fr)_minmax(140px,1.2fr)_minmax(125px,1fr)_minmax(140px,1.15fr)_80px] items-center gap-4 px-4 pb-3 text-[12px] font-bold uppercase tracking-[1.2px] text-[#727a82] md:grid">
              {filterFields.map(({ key, label }) => (
                <div className="relative" data-filter-key={key} key={key}>
                  <button
                    className={`inline-flex items-center gap-1 border-0 bg-transparent p-0 text-left text-[12px] font-bold uppercase tracking-[1.2px] transition hover:text-[#28745b] ${activeFilters[key].length ? "text-[#28745b]" : "text-[#727a82]"}`}
                    type="button"
                    aria-expanded={openFilter === key}
                    onClick={() =>
                      setOpenFilter((current) => (current === key ? null : key))
                    }
                  >
                    {label}
                    <FontAwesomeIcon
                      className={`text-[9px] transition-transform ${openFilter === key ? "rotate-180" : ""}`}
                      icon={faChevronDown}
                    />
                  </button>
                  {openFilter === key && (
                    <div className="absolute left-0 top-6 z-20 min-w-[190px] bg-white p-3 normal-case tracking-normal text-[#515a60] shadow-[0_10px_25px_#27382d24] ring-1 ring-[#e3e7e9]">
                      <div className="mb-2 flex items-center justify-between gap-4 border-b border-[#e3e7e9] pb-2 text-[11px] font-bold">
                        <span>Lọc {label.toLowerCase()}</span>
                        {activeFilters[key].length > 0 && (
                          <button
                            className="border-0 bg-transparent p-0 text-[10px] font-normal text-[#28745b] hover:underline"
                            type="button"
                            onClick={() => clearFilter(key)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      {key === "description" || key === "supportPerson" ? (
                        <input
                          autoFocus
                          className="min-w-[260px] border border-[#d9dfe0] bg-[#fafbfa] px-2.5 py-2 text-[13px] font-normal text-[#20252b] outline-none placeholder:text-[#9aa1a6] focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                          type="search"
                          value={
                            key === "description"
                              ? descriptionSearch
                              : supportPersonSearch
                          }
                          placeholder={
                            key === "description"
                              ? "Nhập mô tả công việc cần tìm..."
                              : "Nhập tên người cần tìm..."
                          }
                          aria-label={`Tìm kiếm theo ${label.toLowerCase()}`}
                          onChange={(event) => {
                            if (key === "description") {
                              setDescriptionSearch(event.target.value);
                            } else {
                              setSupportPersonSearch(event.target.value);
                            }
                          }}
                        />
                      ) : key === "createdAt" ? (
                        <label className="grid gap-1.5 text-xs">
                          <input
                            className="min-w-[180px] border border-[#d9dfe0] bg-[#fafbfa] px-2.5 py-2 text-[13px] text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            type="date"
                            value={filterValueToDateInput(
                              activeFilters.createdAt[0] || "",
                            )}
                            onChange={(event) => {
                              const value = dateInputToFilterValue(
                                event.target.value,
                              );
                              setActiveFilters((current) => ({
                                ...current,
                                createdAt: value ? [value] : [],
                              }));
                            }}
                          />
                        </label>
                      ) : (
                        <div className="grid max-h-52 gap-1 overflow-y-auto">
                          {getFilterOptions(key).map((value) => (
                            <label
                              className="flex cursor-pointer items-center gap-2 px-1 py-1.5 text-xs hover:bg-[#f5f7f5]"
                              key={value}
                            >
                              <input
                                className="accent-[#28745b]"
                                type="checkbox"
                                checked={activeFilters[key].includes(value)}
                                onChange={() => toggleFilter(key, value)}
                              />
                              <span className="max-w-[220px] truncate">
                                {key === "status"
                                  ? statusLabels[value] || value
                                  : value}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                className={`grid h-8 w-8 place-items-center justify-self-start border-0 bg-transparent text-[14px] transition ${hasActiveFilters ? "text-[#bd4c4c] hover:bg-[#bd4c4c]/15" : "cursor-default text-[#515a60]"}`}
                type="button"
                aria-label="Xóa tất cả bộ lọc"
                title="Xóa tất cả bộ lọc"
                disabled={!hasActiveFilters}
                onClick={clearAllFilters}
              >
                <FontAwesomeIcon icon={faFilterCircleXmark} />
              </button>
            </div>
            <div
              className="max-h-[58dvh] overflow-y-auto pr-1 md:h-[450px] md:max-h-none md:pr-0 [@media(min-height:900px)]:md:h-[600px]"
              onScroll={handleTaskScroll}
            >
              <div>
                {filteredTasks.length === 0 && (
                  <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 border border-dashed border-[#cbd4cf] text-[13px] text-[#727a82]">
                    {hasActiveFilters ? (
                      "Không tìm thấy công việc phù hợp với bộ lọc."
                    ) : (
                      <>
                        <span className="mb-2 grid h-[38px] w-[38px] place-items-center border border-[#cbd4cf] text-2xl text-[#28745b]">
                          +
                        </span>
                        <strong className="text-base text-[#20252b]">
                          Chưa có công việc nào
                        </strong>
                        <span>
                          Bắt đầu ghi nhận công việc đầu tiên của bạn.
                        </span>
                      </>
                    )}
                  </div>
                )}
                {filteredTasks.map((task) => (
                  <div key={task._id}>
                    {deletingTaskId === task._id ? (
                      <article className="my-2 flex min-h-12 items-center justify-between gap-4 bg-[#fae0e0] px-4 py-2 text-[13px] text-[#a34646] transition-all">
                        <span className="min-w-0 truncate font-bold">
                          Xóa “{truncateDescription(task.description)}”?
                        </span>
                        <div className="flex shrink-0 gap-2">
                          <button
                            className="grid h-8 w-8 place-items-center border-0 bg-[#bd4c4c] text-white transition hover:bg-[#a34646] disabled:cursor-wait disabled:opacity-60"
                            type="button"
                            aria-label="Đồng ý xóa công việc"
                            title="Đồng ý xóa"
                            disabled={isDeleting}
                            onClick={() => void deleteTask(task._id)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <button
                            className="grid h-8 w-8 place-items-center border-0 bg-white text-[#727a82] transition hover:text-[#20252b] disabled:opacity-60"
                            type="button"
                            aria-label="Hủy xóa công việc"
                            title="Hủy"
                            disabled={isDeleting}
                            onClick={() => setDeletingTaskId(null)}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      </article>
                    ) : (
                      <article
                        className={`my-2 grid grid-cols-2 items-center gap-x-3 gap-y-2.5 border-l-4 px-3 py-3 text-[12px] font-bold text-[#515a60] transition-all md:grid-cols-[minmax(240px,2.2fr)_minmax(150px,1.35fr)_minmax(130px,1.15fr)_minmax(130px,1.15fr)_minmax(140px,1.2fr)_minmax(125px,1fr)_minmax(140px,1.15fr)_80px] md:gap-4 md:border-l-0 md:px-4 md:py-4 md:text-[13px] ${getStatusTone(task.status) === "green" ? "border-[#28745b] bg-[#e3f0e9]" : getStatusTone(task.status) === "yellow" ? "border-[#d39b00] bg-[#fff4cc]" : getStatusTone(task.status) === "red" ? "border-[#bd4c4c] bg-[#fae0e0]" : "border-[#7c4db3] bg-[#f1e7ff]"}`}
                      >
                        <div className="col-span-2 flex min-w-0 items-center gap-2.5 md:col-span-1">
                          <span
                            className={`h-[9px] w-[9px] shrink-0 rounded-full ${getStatusTone(task.status) === "green" ? "bg-[#28745b]" : getStatusTone(task.status) === "yellow" ? "bg-[#d39b00]" : getStatusTone(task.status) === "red" ? "bg-[#bd4c4c]" : "bg-[#7c4db3]"}`}
                          />
                          <div className="min-w-0">
                            <h3
                              className="text-[15px] font-bold leading-[1.4] text-[#20252b]"
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
                        <span className="grid min-w-0 truncate">
                          <small className="text-[9px] font-bold uppercase tracking-wide text-[#727a82] md:hidden">Người hỗ trợ</small>
                          {task.supportPerson || "-"}
                        </span>
                        <span className="grid min-w-0 truncate">
                          <small className="text-[9px] font-bold uppercase tracking-wide text-[#727a82] md:hidden">Phòng ban</small>
                          {task.department || "-"}
                        </span>
                        <span className="grid min-w-0 truncate"><small className="text-[9px] font-bold uppercase tracking-wide text-[#727a82] md:hidden">Công ty</small>{task.company || "-"}</span>
                        <span className="grid min-w-0 truncate">
                          <small className="text-[9px] font-bold uppercase tracking-wide text-[#727a82] md:hidden">Nơi làm việc</small>
                          {task.workplace || "-"}
                        </span>
                        <time
                          className="grid whitespace-nowrap text-[12px]"
                          dateTime={task.createdAt}
                        >
                          <small className="text-[9px] font-bold uppercase tracking-wide text-[#727a82] md:hidden">Ngày tạo</small>{formatDate(task.createdAt)}
                        </time>
                        <span
                          className={`w-fit px-2 py-1 text-[12px] font-bold ${getStatusTone(task.status) === "green" ? "bg-[#e3f0e9] text-[#28745b]" : getStatusTone(task.status) === "yellow" ? "bg-[#fff0e7] text-[#ae5d32]" : getStatusTone(task.status) === "red" ? "bg-[#fae8e8] text-[#a34646]" : "bg-[#f1e7ff] text-[#7c4db3]"}`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                        <div className="flex items-center justify-end gap-1 md:justify-start">
                          <button
                            className="grid h-8 w-8 place-items-center border-0 bg-transparent text-sm text-[#727a82] transition hover:bg-white/70 hover:text-[#28745b]"
                            type="button"
                            aria-label={`Sửa công việc ${task.description}`}
                            title="Sửa công việc"
                            onClick={() => startEditing(task)}
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                          <button
                            className="grid h-8 w-8 place-items-center border-0 bg-transparent text-sm text-[#727a82] transition hover:bg-white/70 hover:text-[#bd4c4c]"
                            type="button"
                            aria-label={`Xóa công việc ${task.description}`}
                            title="Xóa công việc"
                            onClick={() => askToDeleteTask(task._id)}
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </div>
                      </article>
                    )}
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
                              updateEditingForm(
                                "description",
                                event.target.value,
                              )
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
                            value={editingForm.categoryId}
                            onChange={(event) =>
                              updateEditingForm("categoryId", event.target.value)
                            }
                          >
                            <option value="">Chọn danh mục</option>
                            {settings.category.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                          Phòng ban
                          <select
                            className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            value={editingForm.departmentId}
                            onChange={(event) =>
                              updateEditingForm(
                                "departmentId",
                                event.target.value,
                              )
                            }
                          >
                            <option value="">Chọn phòng ban</option>
                            {settings.department.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                          Công ty
                          <select
                            className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            value={editingForm.companyId}
                            onChange={(event) =>
                              updateEditingForm("companyId", event.target.value)
                            }
                          >
                            <option value="">Chọn công ty</option>
                            {settings.company.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                          Nơi làm việc
                          <select
                            className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            value={editingForm.workplaceId}
                            onChange={(event) =>
                              updateEditingForm("workplaceId", event.target.value)
                            }
                          >
                            <option value="">Chọn Tỉnh/thành</option>
                            {settings.workplace.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                          Trạng thái
                          <select
                            className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            value={editingForm.statusId}
                            onChange={(event) =>
                              updateEditingForm("statusId", event.target.value)
                            }
                          >
                            {(settings.status.length
                              ? settings.status.map(
                                  (item) => [item.id, item.name] as const,
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
                        <label className="grid gap-1.5 text-xs font-bold text-[#515a60]">
                          Ngày tạo
                          <input
                            className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            type="date"
                            required
                            value={editingForm.createdAt}
                            onChange={(event) =>
                              updateEditingForm("createdAt", event.target.value)
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
                {isLoadingMore && (
                  <div className="grid gap-3 border-t border-[#edf0ee] px-4 py-4" role="status" aria-label="Đang tải thêm công việc">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                )}
              </div>
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
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm("categoryId", event.target.value)
                    }
                  >
                    <option value="">Chọn danh mục</option>
                    {settings.category.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Phòng ban *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.departmentId}
                    onChange={(event) =>
                      updateForm("departmentId", event.target.value)
                    }
                  >
                    <option value="">Chọn phòng ban</option>
                    {settings.department.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Công ty *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.companyId}
                    onChange={(event) =>
                      updateForm("companyId", event.target.value)
                    }
                  >
                    <option value="">Chọn công ty</option>
                    {settings.company.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Nơi làm việc *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.workplaceId}
                    onChange={(event) =>
                      updateForm("workplaceId", event.target.value)
                    }
                  >
                    <option value="">Chọn Tỉnh/thành</option>
                    {settings.workplace.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-xs font-bold text-[#515a60]">
                  Trạng thái *
                  <select
                    className="w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                    required
                    value={form.statusId}
                    onChange={(event) =>
                      updateForm("statusId", event.target.value)
                    }
                  >
                    <option value="">Chọn trạng thái</option>
                    {(settings.status.length
                      ? settings.status.map((item) => [item.id, item.name] as const)
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
