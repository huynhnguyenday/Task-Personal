import path from "node:path";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { taskSettingsPipeline } from "@/lib/taskSettingsPipeline";

export const runtime = "nodejs";

function parseDate(value: string | null, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  const date = new Date(`${value}T${time}+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const normalizeStatus = (value: string) => value.trim().toLocaleLowerCase("vi");
const isDone = (status: string) =>
  ["done", "hoàn thành", "đã hoàn thành", "đã xong"].includes(normalizeStatus(status));
const isInProgress = (status: string) =>
  ["in_progress", "đang thực hiện", "đang làm", "đang tiến hành"].includes(normalizeStatus(status));
const isWaiting = (status: string) =>
  ["đang chờ", "waiting"].includes(normalizeStatus(status));
const isExportable = (status: string) =>
  isDone(status) || isInProgress(status) || isWaiting(status);

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"), true);
    if (!from || !to || from > to) return NextResponse.json({ error: "Khoảng thời gian không hợp lệ" }, { status: 400 });

    await connectToDatabase();
    const tasks = (await Task.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $sort: { createdAt: 1, _id: 1 } },
      ...taskSettingsPipeline(),
    ]))
      .filter((task) => isExportable(task.status));

    if (searchParams.get("preview") === "1") {
      return NextResponse.json({
        total: tasks.length,
        completed: tasks.filter((task) => isDone(task.status)).length,
        tasks: tasks.map((task, index) => ({
          number: index + 1,
          category: task.category,
          description: task.description,
          result: isDone(task.status) ? "Đã hoàn thành theo yêu cầu." : "Đang thực hiện",
          startedAt: formatDate(new Date(task.createdAt)),
          supportPerson: task.supportPerson,
          status: task.status,
          completed: isDone(task.status),
        })),
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(process.cwd(), "src", "templates", "bao-cao-tuan.xlsx"));
    const worksheet = workbook.getWorksheet("Bao cao tuan") ?? workbook.worksheets[0];
    if (!worksheet) throw new Error("Không tìm thấy sheet mẫu");

    const footerStart = worksheet.getColumn("A").values.findIndex(
      (value) => typeof value === "string" && value.includes("TÓM TẮT KẾT QUẢ TUẦN"),
    );
    if (footerStart < 8) throw new Error("Không xác định được vùng tóm tắt của file mẫu");

    const availableTaskRows = footerStart - 8;
    const extraRows = Math.max(0, tasks.length - availableTaskRows);
    if (extraRows > 0) {
      const footerMerges = [
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 6],
      ] as const;
      for (const [startOffset, endOffset] of footerMerges) {
        worksheet.unMergeCells(`A${footerStart + startOffset}:M${footerStart + endOffset}`);
      }
      worksheet.spliceRows(
        footerStart,
        0,
        ...Array.from({ length: extraRows }, () => Array(17).fill(null)),
      );
      for (let index = 0; index < extraRows; index += 1) {
        const row = worksheet.getRow(footerStart + index);
        const sourceRow = worksheet.getRow(8);
        row.height = sourceRow.height;
        for (let column = 1; column <= 17; column += 1) {
          row.getCell(column).style = { ...sourceRow.getCell(column).style };
        }
      }
      for (const [startOffset, endOffset] of footerMerges) {
        worksheet.mergeCells(
          `A${footerStart + extraRows + startOffset}:M${footerStart + extraRows + endOffset}`,
        );
      }
    }

    const taskAreaEnd = footerStart + extraRows - 1;
    for (let rowNumber = 8; rowNumber <= taskAreaEnd; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      for (let column = 1; column <= 17; column += 1) row.getCell(column).value = null;
    }

    worksheet.getCell("A3").value = `Thời gian: Từ ngày ${formatDate(from)} đến ${formatDate(to)}`;
    worksheet.getCell("B5").value = tasks.length;
    worksheet.getCell("E5").value = tasks.filter((task) => isDone(task.status)).length;
    worksheet.getCell("H5").value = 0;

    tasks.forEach((task, index) => {
      const row = worksheet.getRow(8 + index);
      const done = isDone(task.status);
      const startedAt = new Date(task.createdAt);
      row.getCell("A").value = index + 1;
      row.getCell("B").value = task.category;
      row.getCell("C").value = task.description;
      row.getCell("D").value = done ? "Đã hoàn thành theo yêu cầu." : "Đang thực hiện";
      row.getCell("E").value = 1;
      row.getCell("F").value = startedAt;
      row.getCell("G").value = "Nguyễn Hữu Huỳnh";
      row.getCell("H").value = startedAt;
      row.getCell("I").value = task.supportPerson;
      row.getCell("M").value = "Không có";
      row.getCell("Q").value = done ? "✓" : null;
    });

    const reportTable = worksheet.getTable("BaoCaoTuanTable");
    if (reportTable) {
      reportTable.ref = `A7:Q${Math.max(8, 7 + tasks.length)}`;
      reportTable.commit();
    }

    const output = await workbook.xlsx.writeBuffer();
    const filename = `Bao_cao_tuan_${searchParams.get("from")}_${searchParams.get("to")}.xlsx`;
    return new Response(new Uint8Array(output), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return NextResponse.json({ error: "Không thể tạo file báo cáo" }, { status: 500 });
  }
}
