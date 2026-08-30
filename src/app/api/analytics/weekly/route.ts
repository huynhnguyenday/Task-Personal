import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentWeekRange } from "@/lib/analyticsDates";
import { Task } from "@/models/Task";

export const runtime = "nodejs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    let { start, end } = getCurrentWeekRange();
    if (from || to) {
      if (!from || !to || !DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) return NextResponse.json({ error: "Khoảng ngày không hợp lệ" }, { status: 400 });
      start = new Date(`${from}T00:00:00+07:00`);
      end = new Date(`${to}T00:00:00+07:00`);
      end.setUTCDate(end.getUTCDate() + 1);
      const selectedDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
      if (selectedDays < 1 || selectedDays > 31) return NextResponse.json({ error: "Chỉ có thể xem tối đa 31 ngày" }, { status: 400 });
    }
    const counts = await Task.aggregate<{ _id: string; count: number; tasks: { id: string; description: string; supportPerson: string; category: string; department: string; company: string; workplace: string; status: string; notes: string; createdAt: Date }[] }>([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: {
        _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "Asia/Ho_Chi_Minh" } },
        count: { $sum: 1 },
        tasks: { $push: { id: { $toString: "$_id" }, description: "$description", supportPerson: "$supportPerson", category: "$category", department: "$department", company: "$company", workplace: "$workplace", status: "$status", notes: "$notes", createdAt: "$createdAt" } },
      } },
    ]);
    const countMap = new Map(counts.map((item) => [item._id, item]));
    const numberOfDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    const days = Array.from({ length: numberOfDays }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
      const result = countMap.get(key);
      return { date: key, count: result?.count ?? 0, tasks: result?.tasks ?? [] };
    });
    return NextResponse.json(days);
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê tuần" }, { status: 500 });
  }
}
