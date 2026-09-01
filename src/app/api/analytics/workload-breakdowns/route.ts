import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { taskSettingsPipeline } from "@/lib/taskSettingsPipeline";

export const runtime = "nodejs";

type GroupCount = { _id: string | number; count: number };
type BreakdownAggregation = {
  weekdays: GroupCount[];
  departments: GroupCount[];
  categories: GroupCount[];
  meta: { firstCreatedAt: Date }[];
};

function vietnamDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function weekdayOccurrences(firstDate: Date) {
  const start = new Date(`${vietnamDateKey(firstDate)}T00:00:00Z`);
  const end = new Date(`${vietnamDateKey(new Date())}T00:00:00Z`);
  const occurrences = Array(7).fill(0) as number[];
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const isoDay = ((date.getUTCDay() + 6) % 7) + 1;
    occurrences[isoDay - 1] += 1;
  }
  return occurrences;
}

export async function GET() {
  try {
    await connectToDatabase();
    const [result] = await Task.aggregate<BreakdownAggregation>([
      ...taskSettingsPipeline(),
      {
        $facet: {
          weekdays: [
            { $group: { _id: { $isoDayOfWeek: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } }, count: { $sum: 1 } } },
          ],
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          categories: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          meta: [
            { $group: { _id: null, firstCreatedAt: { $min: "$createdAt" } } },
            { $project: { _id: 0, firstCreatedAt: 1 } },
          ],
        },
      },
    ]);

    const firstCreatedAt = result?.meta[0]?.firstCreatedAt;
    const occurrences = firstCreatedAt ? weekdayOccurrences(firstCreatedAt) : Array(7).fill(0) as number[];
    const weekdayCounts = new Map((result?.weekdays ?? []).map((item) => [Number(item._id), item.count]));
    const weekdays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map((label, index) => ({
      label,
      total: weekdayCounts.get(index + 1) ?? 0,
      average: occurrences[index] ? Math.round(((weekdayCounts.get(index + 1) ?? 0) / occurrences[index]) * 10) / 10 : 0,
    }));
    const normalize = (items: GroupCount[] = []) => items.map((item) => ({ label: String(item._id || "Chưa xác định"), count: item.count }));

    return NextResponse.json({ weekdays, departments: normalize(result?.departments), categories: normalize(result?.categories) });
  } catch {
    return NextResponse.json({ error: "Không thể tải thống kê phân bổ công việc" }, { status: 500 });
  }
}
