import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getElapsedCalendarPeriods } from "@/lib/analyticsDates";
import { getAnalyticsSnapshot } from "@/lib/analyticsSnapshot";

export const runtime = "nodejs";

function roundAverage(value: number) {
  return Math.round(value * 10) / 10;
}

export async function GET() {
  try {
    await connectToDatabase();

    const { total, firstCreatedAt, activeDays } = await getAnalyticsSnapshot();

    if (!firstCreatedAt || total === 0) {
      return NextResponse.json({ total: 0, monthlyAverage: 0, weeklyAverage: 0, dailyAverage: 0 });
    }

    const periods = getElapsedCalendarPeriods(firstCreatedAt);

    return NextResponse.json({
      total,
      monthlyAverage: roundAverage(total / periods.months),
      weeklyAverage: roundAverage(total / periods.weeks),
      dailyAverage: roundAverage(activeDays ? total / activeDays : 0),
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê tổng quan" }, { status: 500 });
  }
}
