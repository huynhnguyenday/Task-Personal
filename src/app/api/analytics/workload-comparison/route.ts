import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { getElapsedCalendarPeriods } from "@/lib/analyticsDates";

export const runtime = "nodejs";
const RECORDING_START_KEY = "2026-08-14";
const RECORDING_START = new Date(`${RECORDING_START_KEY}T00:00:00+07:00`);
const DAY = 86_400_000;

function boundary(value: string) { return new Date(`${value}T00:00:00+07:00`); }
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function later(first: Date, second: Date) { return first > second ? first : second; }
function percent(current: number, history: number, periods: number) {
  const average = periods > 0 ? history / periods : 0;
  return average > 0 ? Math.round(((current - average) / average) * 100) : current;
}

function monthRange(value: string) {
  const [year, month] = value.split("-").map(Number);
  return {
    start: boundary(`${year}-${String(month).padStart(2, "0")}-01`),
    end: boundary(`${month === 12 ? year + 1 : year}-${String((month % 12) + 1).padStart(2, "0")}-01`),
    periods: Math.max(0, year * 12 + month - (2026 * 12 + 8)),
  };
}

function weekRange(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const start = boundary(dateKey(date));
  return { start, end: new Date(start.getTime() + 7 * DAY), periods: Math.max(0, (start.getTime() - RECORDING_START.getTime()) / (7 * DAY)) };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const metric = params.get("metric");
    const date = params.get("date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    if (!/^(total|monthly|weekly|daily)$/.test(metric ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < RECORDING_START_KEY) {
      return NextResponse.json({ error: "Tham số thống kê không hợp lệ" }, { status: 400 });
    }
    await connectToDatabase();
    if (metric === "total" || metric === "monthly") {
      const range = monthRange(date);
      const [current, history] = await Promise.all([
        Task.countDocuments({ createdAt: { $gte: later(range.start, RECORDING_START), $lt: range.end } }),
        Task.countDocuments({ createdAt: { $gte: RECORDING_START, $lt: range.start } }),
      ]);
      return NextResponse.json({ value: metric === "total" ? current : percent(current, history, range.periods) });
    }
    if (metric === "weekly") {
      const range = weekRange(date);
      const [current, total, firstTask] = await Promise.all([
        Task.countDocuments({ createdAt: { $gte: later(range.start, RECORDING_START), $lt: range.end } }),
        Task.countDocuments(),
        Task.findOne().sort({ createdAt: 1 }).select({ createdAt: 1 }).lean(),
      ]);
      if (!firstTask || total === 0) return NextResponse.json({ value: 0 });
      const weeklyAverage = total / getElapsedCalendarPeriods(new Date(firstTask.createdAt)).weeks;
      return NextResponse.json({ value: Math.round((current / weeklyAverage) * 100) });
    }
    const start = boundary(date);
    const [current, activeDays] = await Promise.all([
      Task.countDocuments({ createdAt: { $gte: start, $lt: new Date(start.getTime() + DAY) } }),
      Task.aggregate<{ count: number }>([
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }, count: { $sum: 1 } } },
      ]),
    ]);
    const totalOnWorkingDays = activeDays.reduce((sum, day) => sum + day.count, 0);
    const dailyAverage = activeDays.length ? totalOnWorkingDays / activeDays.length : 0;
    return NextResponse.json({ value: dailyAverage > 0 ? Math.round((current / dailyAverage) * 100) : 0 });
  } catch {
    return NextResponse.json({ error: "Không thể tải chỉ số công việc" }, { status: 500 });
  }
}
