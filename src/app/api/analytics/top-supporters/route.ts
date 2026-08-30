import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentMonthRange } from "@/lib/analyticsDates";
import { Task } from "@/models/Task";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const { start, end } = getCurrentMonthRange();
    const people = await Task.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: start, $lt: end }, supportPerson: { $ne: "" } } },
      { $group: { _id: "$supportPerson", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);
    return NextResponse.json(people);
  } catch {
    return NextResponse.json({ error: "Không thể tải top người yêu cầu hỗ trợ" }, { status: 500 });
  }
}
