import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentMonthRange } from "@/lib/analyticsDates";
import { Task } from "@/models/Task";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const { start, end } = getCurrentMonthRange();
    const statuses = await Task.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const result = { total: 0, inProgress: 0, waiting: 0, cancelled: 0, completed: 0 };
    for (const item of statuses) {
      const status = item._id.trim().toLocaleLowerCase("vi");
      result.total += item.count;
      if (["done", "hoàn thành", "đã hoàn thành", "đã xong"].includes(status)) result.completed += item.count;
      else if (["in_progress", "đang thực hiện", "đang làm", "đang tiến hành"].includes(status)) result.inProgress += item.count;
      else if (["blocked", "không cần hỗ trợ nữa", "không cần nữa", "đã hủy"].includes(status)) result.cancelled += item.count;
      else result.waiting += item.count;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê tháng" }, { status: 500 });
  }
}
