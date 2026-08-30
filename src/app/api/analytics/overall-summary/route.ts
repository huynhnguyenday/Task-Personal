import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getElapsedCalendarPeriods } from "@/lib/analyticsDates";

export const runtime = "nodejs";

function roundAverage(value: number) {
  return Math.round(value * 10) / 10;
}

export async function GET() {
  try {
    await connectToDatabase();

    const [total, firstTask, activeDays] = await Promise.all([
      Task.countDocuments(),
      Task.findOne().sort({ createdAt: 1 }).select({ createdAt: 1 }).lean(),
      Task.aggregate<{ count: number }>([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }, count: { $sum: 1 } } },
      ]),
    ]);

    if (!firstTask || total === 0) {
      return NextResponse.json({ total: 0, monthlyAverage: 0, weeklyAverage: 0, dailyAverage: 0 });
    }

    const periods = getElapsedCalendarPeriods(new Date(firstTask.createdAt));

    return NextResponse.json({
      total,
      monthlyAverage: roundAverage(total / periods.months),
      weeklyAverage: roundAverage(total / periods.weeks),
      dailyAverage: roundAverage(activeDays.length ? total / activeDays.length : 0),
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê tổng quan" }, { status: 500 });
  }
}
