"use client";

import { FormEvent, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPencil,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { SettingListSkeleton } from "@/components/LoadingSkeleton";

type SettingType =
  | "category"
  | "department"
  | "company"
  | "workplace"
  | "status";
type SettingItem = { id: string; name: string };
type Settings = Record<SettingType, SettingItem[]>;

const sections: { type: SettingType; title: string; description: string }[] = [
  {
    type: "category",
    title: "Danh mục",
    description: "Nhóm các loại công việc thường gặp.",
  },
  {
    type: "department",
    title: "Phòng ban",
    description: "Các phòng ban bạn thường phối hợp.",
  },
  {
    type: "company",
    title: "Công ty",
    description: "Danh sách công ty hoặc khách hàng.",
  },
  {
    type: "workplace",
    title: "Nơi làm việc",
    description: "Các Tỉnh/thành phố nơi bạn làm việc.",
  },
  {
    type: "status",
    title: "Trạng thái",
    description: "Các trạng thái theo dõi tiến độ công việc.",
  },
];
const emptySettings: Settings = {
  category: [],
  department: [],
  company: [],
  workplace: [],
  status: [],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [activeType, setActiveType] = useState<SettingType | null>(null);
  const [editingItem, setEditingItem] = useState<{
    type: SettingType;
    index: number;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    type: SettingType;
    index: number;
  } | null>(null);
  const [editingName, setEditingName] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings?format=items")
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        setSettings(await response.json());
      })
      .catch(() => setError("Chưa thể kết nối với cơ sở dữ liệu."))
      .finally(() => setIsLoading(false));
  }, []);

  function startAdding(type: SettingType) {
    setEditingItem(null);
    setDeletingItem(null);
    setActiveType(type);
    setName("");
    setError("");
  }

  function startEditing(type: SettingType, index: number, item: SettingItem) {
    setActiveType(null);
    setDeletingItem(null);
    setEditingItem({ type, index });
    setEditingName(item.name);
    setError("");
  }

  function askToDelete(type: SettingType, index: number) {
    setActiveType(null);
    setEditingItem(null);
    setDeletingItem({ type, index });
    setError("");
  }

  async function deleteSetting() {
    if (!deletingItem) return;
    const { type, index } = deletingItem;
    const item = settings[type][index];
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: item.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Không thể xóa cấu hình");
      }
      setSettings((current) => ({
        ...current,
        [type]: current[type].filter((_, itemIndex) => itemIndex !== index),
      }));
      setDeletingItem(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa cấu hình",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function cancelEditing() {
    if (!isSaving) {
      setEditingItem(null);
      setEditingName("");
      setError("");
    }
  }

  async function saveEdit() {
    if (!editingItem || !editingName.trim()) return;
    const item = settings[editingItem.type][editingItem.index];
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingItem.type,
          id: item.id,
          name: editingName,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể sửa cấu hình");
      setSettings((current) => ({
        ...current,
        [editingItem.type]: current[editingItem.type].map((item, index) =>
          index === editingItem.index ? { id: String(result._id), name: result.name } : item,
        ),
      }));
      setEditingItem(null);
      setEditingName("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể sửa cấu hình",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeType || !name.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeType, name }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể tạo cấu hình");
      setSettings((current) => ({
        ...current,
        [activeType]: [...current[activeType], { id: String(result._id), name: result.name }],
      }));
      setActiveType(null);
      setName("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể tạo cấu hình",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="scrollbar-settings min-h-screen bg-[#f5f7f5] bg-[radial-gradient(circle_at_90%_0%,#e4efe7_0,transparent_32%)] px-2 py-[22px] pb-[50px] text-[#20252b] sm:px-4 sm:py-8 sm:pb-20">
      <header className="mx-auto max-w-[1440px] border-b border-[#e3e7e9] pb-7">
        <div className="flex items-center gap-3.5">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">
              PERSONAL WORKSPACE
            </p>
            <h1 className="text-xl tracking-[-0.4px]">Cấu hình workspace</h1>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-[1440px] pb-[20px] pt-[20px]">
        <div>
          <p className="mb-1 text-[15px] font-bold tracking-[1.5px] text-[#28745b]">
            THIẾT LẬP
          </p>
          <p className="mt-1 text-sm text-[#727a82]">
            Quản lý các giá trị sẽ xuất hiện trong biểu mẫu thêm công việc.
          </p>
        </div>
      </section>
      {error && !activeType && (
        <p className="mx-auto mb-4 max-w-[1440px] text-[13px] text-[#a34646]">
          {error}
        </p>
      )}
      <section className="mx-auto grid max-w-[1440px] gap-3.5 min-[761px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {sections.map((section) => (
          <article
            className="flex h-[350px] flex-col overflow-hidden border border-[#e3e7e9] bg-white p-[22px]"
            key={section.type}
          >
            <div className="flex shrink-0 items-start justify-between gap-2.5 border-b border-[#e3e7e9] pb-[18px]">
              <div>
                <h3 className="text-lg leading-[1.4]">{section.title}</h3>
                <p className="mt-1.5 text-xs leading-[1.5] text-[#727a82]">
                  {section.description}
                </p>
              </div>
              <button
                className="grid h-8 w-8 place-items-center border border-[#28745b] bg-[#e3f0e9] text-[22px] leading-none text-[#28745b] transition hover:bg-[#28745b] hover:text-white"
                type="button"
                onClick={() => startAdding(section.type)}
                aria-label={`Thêm ${section.title.toLowerCase()}`}
              >
                +
              </button>
            </div>
            {activeType === section.type && (
              <form
                className="my-4 flex shrink-0 gap-[7px]"
                onSubmit={handleSubmit}
              >
                <input
                  className="min-w-0 flex-1 border border-[#d9dfe0] bg-[#fafbfa] px-3 py-[11px] text-[13px] font-normal text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={`Tên ${section.title.toLowerCase()}`}
                  required
                />
                <button
                  className="border-0 bg-[#28745b] px-[13px] text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "..." : "Lưu"}
                </button>
              </form>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {isLoading ? (
                <SettingListSkeleton />
              ) : settings[section.type].length ? (
                <ul className="mt-[17px] grid list-none gap-2 p-0">
                  {settings[section.type].map((item, index) => (
                    <li
                      className={`flex items-center gap-2 px-[11px] py-[9px] text-[13px] transition-[height] duration-200 ${deletingItem?.type === section.type && deletingItem.index === index ? "min-h-12 bg-[#fae0e0] text-[#a34646]" : "bg-[#f5f7f5] text-[#515a60]"} ${editingItem?.type === section.type && editingItem.index === index ? "h-20" : "min-h-10"}`}
                      key={item.id}
                    >
                      {deletingItem?.type === section.type &&
                      deletingItem.index === index ? (
                        <>
                          <span className="min-w-0 flex-1 truncate font-bold">
                            Xóa “{item.name}”?
                          </span>
                          <div className="flex shrink-0 gap-1">
                            <button
                              className="grid h-8 w-8 place-items-center border-0 bg-[#bd4c4c] text-white transition hover:bg-[#a34646] disabled:cursor-wait disabled:opacity-60"
                              type="button"
                              aria-label={`Đồng ý xóa ${item.name}`}
                              title="Đồng ý xóa"
                              disabled={isDeleting}
                              onClick={() => void deleteSetting()}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className="grid h-8 w-8 place-items-center border-0 bg-white text-[#727a82] transition hover:text-[#20252b] disabled:opacity-60"
                              type="button"
                              aria-label="Hủy xóa"
                              title="Hủy"
                              disabled={isDeleting}
                              onClick={() => setDeletingItem(null)}
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          </div>
                        </>
                      ) : editingItem?.type === section.type &&
                        editingItem.index === index ? (
                        <>
                          <input
                            autoFocus
                            className="min-w-0 flex-1 self-stretch border border-[#d9dfe0] bg-white px-2.5 text-[13px] text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") void saveEdit();
                              if (event.key === "Escape") cancelEditing();
                            }}
                          />
                          <div className="flex shrink-0 gap-1">
                            <button
                              className="grid h-8 w-8 place-items-center border border-[#28745b] bg-[#28745b] text-base text-white hover:bg-[#1e604a] disabled:opacity-60"
                              type="button"
                              aria-label="Lưu thay đổi"
                              onClick={() => void saveEdit()}
                              disabled={isSaving}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className="grid h-8 w-8 place-items-center border border-[#d9dfe0] bg-white text-base text-[#727a82] hover:border-[#a34646] hover:text-[#a34646]"
                              type="button"
                              aria-label="Hủy chỉnh sửa"
                              onClick={cancelEditing}
                              disabled={isSaving}
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1">{item.name}</span>
                          <button
                            className="grid h-7 w-7 shrink-0 place-items-center border-0 bg-transparent text-[#727a82] transition hover:bg-[#e3f0e9] hover:text-[#28745b]"
                            type="button"
                            aria-label={`Sửa ${item.name}`}
                            onClick={() =>
                              startEditing(section.type, index, item)
                            }
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                          <button
                            className="grid h-7 w-7 shrink-0 place-items-center border-0 bg-transparent text-[#727a82] transition hover:bg-[#fae0e0] hover:text-[#bd4c4c]"
                            type="button"
                            aria-label={`Xóa ${item.name}`}
                            title="Xóa"
                            onClick={() => askToDelete(section.type, index)}
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-xs text-[#9aa1a4]">
                  Chưa có giá trị nào
                </p>
              )}
              {error && activeType === section.type && (
                <p className="mt-3.5 text-[13px] text-[#a34646]">{error}</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
