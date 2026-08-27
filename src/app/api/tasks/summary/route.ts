import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/models/Task";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const totals = await Task.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return NextResponse.json(
      Object.fromEntries(totals.map(({ _id, count }) => [_id, count])),
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể tải thống kê trạng thái" },
      { status: 500 },
    );
  }
}
