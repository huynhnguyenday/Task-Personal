import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";

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
      const [current, history] = await Promise.all([
        Task.countDocuments({ createdAt: { $gte: later(range.start, RECORDING_START), $lt: range.end } }),
        Task.countDocuments({ createdAt: { $gte: RECORDING_START, $lt: range.start } }),
      ]);
      return NextResponse.json({ value: percent(current, history, range.periods) });
    }
    const start = boundary(date);
    const periods = Math.max(0, (start.getTime() - RECORDING_START.getTime()) / DAY);
    const [current, history] = await Promise.all([
      Task.countDocuments({ createdAt: { $gte: start, $lt: new Date(start.getTime() + DAY) } }),
      Task.countDocuments({ createdAt: { $gte: RECORDING_START, $lt: start } }),
    ]);
    return NextResponse.json({ value: percent(current, history, periods) });
  } catch {
    return NextResponse.json({ error: "Không thể tải chỉ số công việc" }, { status: 500 });
  }
}
