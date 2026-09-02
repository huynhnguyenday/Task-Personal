"use client";

import { FormEvent, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightArrowLeft,
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
  const [transferringItem, setTransferringItem] = useState<{
    type: SettingType;
    index: number;
  } | null>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    setTransferringItem(null);
    setEditingItem(null);
    setDeletingItem(null);
    setActiveType(type);
    setName("");
    setError("");
  }

  function startEditing(type: SettingType, index: number, item: SettingItem) {
    setTransferringItem(null);
    setActiveType(null);
    setDeletingItem(null);
    setEditingItem({ type, index });
    setEditingName(item.name);
    setError("");
  }

  function askToDelete(type: SettingType, index: number) {
    setTransferringItem(null);
    setActiveType(null);
    setEditingItem(null);
    setDeletingItem({ type, index });
    setError("");
  }

  function startTransferring(type: SettingType, index: number) {
    const firstTarget = settings[type].find((_, itemIndex) => itemIndex !== index);
    setActiveType(null);
    setEditingItem(null);
    setDeletingItem(null);
    setTransferringItem({ type, index });
    setTransferTargetId(firstTarget?.id ?? "");
    setError("");
    setNotice("");
  }

  async function transferSetting() {
    if (!transferringItem || !transferTargetId) return;
    const source = settings[transferringItem.type][transferringItem.index];
    const target = settings[transferringItem.type].find((item) => item.id === transferTargetId);
    if (!source || !target) return;

    setIsTransferring(true);
    setError("");
    try {
      const response = await fetch("/api/settings/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transferringItem.type,
          sourceId: source.id,
          targetId: target.id,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể chuyển giao dữ liệu");
      const transferredCount = Number(result.transferredCount) || 0;
      setNotice(
        transferredCount > 0
          ? `Đã chuyển ${transferredCount} công việc từ “${source.name}” sang “${target.name}”.`
          : `Không có công việc nào thuộc “${source.name}” để chuyển.`,
      );
      setTransferringItem(null);
      setTransferTargetId("");
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : "Không thể chuyển giao dữ liệu");
    } finally {
      setIsTransferring(false);
    }
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
    <main className="scrollbar-settings min-h-dvh bg-[#f5f7f5] bg-[radial-gradient(circle_at_90%_0%,#e4efe7_0,transparent_32%)] px-3 py-5 pb-20 text-[#20252b] sm:px-4 sm:py-8">
      <header className="mx-auto max-w-[1440px] border-b border-[#e3e7e9] pb-5 pl-14 sm:pb-7 sm:pl-0">
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
      {notice && (
        <p className="mx-auto mb-4 max-w-[1440px] border border-[#b9d8cb] bg-[#e3f0e9] px-3 py-2.5 text-[13px] text-[#1e604a]">
          {notice}
        </p>
      )}
      <section className="mx-auto grid max-w-[1440px] gap-3.5 min-[761px]:grid-cols-2 min-[1024px]:grid-cols-3">
        {sections.map((section) => (
          <article
            className="flex min-h-[280px] flex-col overflow-hidden border border-[#e3e7e9] bg-white p-4 sm:h-[350px] sm:p-[22px]"
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
                className="my-4 grid shrink-0 grid-cols-[minmax(0,1fr)_64px] gap-[7px]"
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
                            className="grid h-7 w-7 shrink-0 place-items-center border-0 bg-transparent text-[#727a82] transition hover:bg-[#e3f0e9] hover:text-[#28745b] disabled:cursor-not-allowed disabled:opacity-35"
                            type="button"
                            aria-label={`Chuyển giao dữ liệu từ ${item.name}`}
                            title="Chuyển giao"
                            disabled={settings[section.type].length < 2}
                            onClick={() => startTransferring(section.type, index)}
                          >
                            <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                          </button>
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
      {transferringItem && (() => {
        const section = sections.find((item) => item.type === transferringItem.type);
        const source = settings[transferringItem.type][transferringItem.index];
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17221dcc] p-0 sm:items-center sm:p-6" role="presentation">
            <section
              className="w-full max-w-[560px] border border-[#d9dfe0] bg-white p-5 shadow-2xl sm:p-7"
              role="dialog"
              aria-modal="true"
              aria-labelledby="transfer-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">CHUYỂN GIAO</p>
                  <h2 id="transfer-title" className="text-lg">Chuyển dữ liệu {section?.title.toLowerCase()}</h2>
                </div>
                <button className="grid h-9 w-9 shrink-0 place-items-center text-[#727a82] hover:bg-[#f5f7f5]" type="button" aria-label="Đóng" onClick={() => setTransferringItem(null)} disabled={isTransferring}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#515a60]">
                Toàn bộ công việc đang dùng <strong className="text-[#20252b]">{source.name}</strong> sẽ được chuyển sang giá trị đích bên dưới. Giá trị nguồn vẫn được giữ lại.
              </p>
              <label className="mt-5 block text-xs font-bold uppercase tracking-[0.8px] text-[#515a60]" htmlFor="transfer-target">Chuyển đến</label>
              <select
                id="transfer-target"
                className="mt-2 h-12 w-full border border-[#d9dfe0] bg-[#fafbfa] px-3 text-sm text-[#20252b] outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]"
                value={transferTargetId}
                onChange={(event) => setTransferTargetId(event.target.value)}
                disabled={isTransferring}
              >
                {settings[transferringItem.type].filter((item) => item.id !== source.id).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {error && <p className="mt-3 text-[13px] text-[#a34646]">{error}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button className="h-11 border border-[#d9dfe0] bg-white px-5 text-sm text-[#515a60] hover:bg-[#f5f7f5] disabled:opacity-60" type="button" onClick={() => setTransferringItem(null)} disabled={isTransferring}>Hủy</button>
                <button className="h-11 bg-[#28745b] px-5 text-sm font-bold text-white hover:bg-[#1e604a] disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => void transferSetting()} disabled={isTransferring || !transferTargetId}>
                  {isTransferring ? "Đang chuyển..." : "Xác nhận chuyển giao"}
                </button>
              </div>
            </section>
          </div>
        );
      })()}
    </main>
  );
}
