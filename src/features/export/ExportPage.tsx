"use client";

import { FormEvent, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faDownload, faEye, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ExportPreviewSkeleton } from "@/components/LoadingSkeleton";

type PreviewTask = {
  number: number;
  category: string;
  description: string;
  result: string;
  startedAt: string;
  supportPerson: string;
  status: string;
  completed: boolean;
};

type PreviewData = { total: number; completed: number; tasks: PreviewTask[] };

function localDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatInputDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

const sheetHeaders = [
  "STT",
  "DANH MỤC",
  "Nội dung",
  "Kết quả thực hiện tuần báo cáo",
  "Số giờ thực hiện",
  "Ngày bắt đầu",
  "PIC 1",
  "Deadline 1",
  "PIC 2",
  "Deadline 2",
  "PIC 3",
  "Deadline 3",
  "Kiến nghị/Đề xuất",
  "BOD chỉ đạo",
  "Đạt",
  "Trễ > 2",
  "Không đạt",
];

export default function ExportPage() {
  const today = localDate();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function previewReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from > to) return setError("Ngày bắt đầu không được sau ngày kết thúc.");
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&preview=1`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể xem trước báo cáo");
      setPreview(result);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Không thể xem trước báo cáo");
    } finally {
      setIsLoading(false);
    }
  }

  async function exportReport() {
    setIsExporting(true);
    setError("");
    try {
      const response = await fetch(`/api/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Không thể xuất báo cáo");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bao_cao_tuan_${from}_${to}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPreview(null);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không thể xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] bg-[radial-gradient(circle_at_90%_0%,#e4efe7_0,transparent_32%)] px-4 py-8 text-[#20252b]">
      <header className="mx-auto max-w-[1440px] border-b border-[#e3e7e9] pb-7 pl-14 sm:pl-0">
        <p className="mb-1 text-[10px] font-bold tracking-[1.5px] text-[#28745b]">PERSONAL WORKSPACE</p>
        <h1 className="text-2xl tracking-[-0.4px]">Xuất dữ liệu</h1>
      </header>

      <section className="mx-auto mt-6 max-w-[760px] border border-[#e3e7e9] bg-white p-6 shadow-[0_12px_35px_rgba(32,37,43,0.06)] sm:p-9">
        <form onSubmit={previewReport}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[#515a60]">
              <span className="flex items-center gap-2"><FontAwesomeIcon className="text-[#28745b]" icon={faCalendarDays} />Từ ngày</span>
              <input className="h-12 border border-[#d9dfe0] bg-[#fafbfa] px-3 outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#515a60]">
              <span className="flex items-center gap-2"><FontAwesomeIcon className="text-[#28745b]" icon={faCalendarDays} />Đến ngày</span>
              <input className="h-12 border border-[#d9dfe0] bg-[#fafbfa] px-3 outline-none focus:border-[#28745b] focus:ring-2 focus:ring-[#e3f0e9]" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} required />
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-[#a34646]">{error}</p>}
          <button className="mt-7 inline-flex h-12 items-center justify-center gap-2.5 bg-[#28745b] px-6 text-sm font-bold text-white transition hover:bg-[#1e604a] disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isLoading}>
            <FontAwesomeIcon icon={faEye} />{isLoading ? "Đang tải bản xem trước..." : "Xem trước file"}
          </button>
        </form>
      </section>

      {isLoading && <ExportPreviewSkeleton />}

      {preview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#20252b]/55 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Xem trước báo cáo">
          <section className="flex max-h-[94vh] w-full max-w-[1500px] flex-col bg-[#eef0ee] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#e3e7e9] p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold tracking-[1.5px] text-[#28745b]">BẢN XEM TRƯỚC</p>
                <h2 className="mt-1 text-xl">Báo cáo từ {from} đến {to}</h2>
                <p className="mt-2 text-sm text-[#727a82]">Bản mô phỏng worksheet sẽ được tải xuống</p>
              </div>
              <button className="grid h-10 w-10 shrink-0 place-items-center bg-[#f5f7f5] text-[#515a60] hover:bg-[#e3e7e9]" type="button" aria-label="Đóng xem trước" onClick={() => setPreview(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
              <div className="mx-auto min-w-[1900px] bg-white p-8 shadow-[0_3px_18px_rgba(32,37,43,0.16)]">
                <table className="w-full table-fixed border-collapse font-[Arial,sans-serif] text-[11px] text-black">
                  <colgroup>
                    <col className="w-[48px]" /><col className="w-[180px]" /><col className="w-[300px]" /><col className="w-[210px]" /><col className="w-[90px]" />
                    <col className="w-[105px]" /><col className="w-[145px]" /><col className="w-[105px]" /><col className="w-[145px]" /><col className="w-[105px]" />
                    <col className="w-[120px]" /><col className="w-[105px]" /><col className="w-[170px]" /><col className="w-[130px]" /><col className="w-[65px]" /><col className="w-[65px]" /><col className="w-[75px]" />
                  </colgroup>
                  <tbody>
                    <tr><td className="h-10 text-center text-lg font-bold" colSpan={17}>BÁO CÁO TUẦN - PHÒNG TỔNG HỢP</td></tr>
                    <tr><td className="h-7 font-bold" colSpan={17}>Chuyên viên : Nguyễn Hữu Huỳnh</td></tr>
                    <tr><td className="h-7 font-bold" colSpan={17}>Thời gian: Từ ngày {formatInputDate(from)} đến {formatInputDate(to)}</td></tr>
                    <tr><td className="h-7 font-bold" colSpan={17}>Địa điểm: Văn phòng Công ty Cổ phần TMDVKT Chấn Hưng</td></tr>
                    <tr className="h-9 text-center font-bold">
                      <td className="border border-black bg-[#d9eaf7]">Tổng số công việc</td><td className="border border-black text-base" colSpan={2}>{preview.total}</td>
                      <td className="border border-black bg-[#d9ead3]">Hoàn thành</td><td className="border border-black text-base" colSpan={2}>{preview.completed}</td>
                      <td className="border border-black bg-[#fce5cd]">Trễ &gt; 2 ngày</td><td className="border border-black text-base" colSpan={2}>0</td>
                      <td className="border border-black bg-[#f4cccc]">Không đạt</td><td className="border border-black" colSpan={7}>0</td>
                    </tr>
                    <tr><td className="h-5" colSpan={17} /></tr>
                    <tr className="h-14 bg-[#d9eaf7] text-center font-bold">
                      {sheetHeaders.map((header) => <td className="border border-black px-1.5" key={header}>{header}</td>)}
                    </tr>
                    {preview.tasks.map((task) => {
                      const values = [task.number, task.category, task.description, task.result, 1, task.startedAt, "Nguyễn Hữu Huỳnh", task.startedAt, task.supportPerson, "", "", "", "Không có", "", "", "", task.completed ? "✓" : ""];
                      return <tr className={`h-12 align-middle ${task.number % 2 === 1 ? "bg-[#e9f3e5]" : "bg-white"}`} key={task.number}>{values.map((value, index) => <td className={`border border-black px-1.5 py-1 ${[0, 4, 5, 7, 9, 11, 14, 15, 16].includes(index) ? "text-center" : "text-left"}`} key={index}>{value}</td>)}</tr>;
                    })}
                    {!preview.tasks.length && <tr><td className="h-20 border border-black text-center text-[#727a82]" colSpan={17}>Không có task phù hợp với bộ lọc trong khoảng thời gian này.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="flex justify-end gap-3 border-t border-[#e3e7e9] p-5 sm:p-6">
              <button className="h-11 border border-[#d9dfe0] bg-white px-5 text-sm font-bold text-[#515a60] hover:bg-[#f5f7f5]" type="button" onClick={() => setPreview(null)}>Chọn lại</button>
              <button className="inline-flex h-11 items-center gap-2 bg-[#28745b] px-5 text-sm font-bold text-white hover:bg-[#1e604a] disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => void exportReport()} disabled={isExporting || !preview.tasks.length}><FontAwesomeIcon icon={faDownload} />{isExporting ? "Đang tạo file..." : "Xuất file Excel"}</button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
