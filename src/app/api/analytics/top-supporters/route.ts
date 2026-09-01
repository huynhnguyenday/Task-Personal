import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentMonthRange } from "@/lib/analyticsDates";
import { Task } from "@/models/Task";
import { taskSettingsPipeline } from "@/lib/taskSettingsPipeline";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const { start, end } = getCurrentMonthRange();
    const people = await Task.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, supportPerson: { $ne: "" } } },
      ...taskSettingsPipeline(),
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: "$supportPerson",
        count: { $sum: 1 },
        departments: { $addToSet: "$department" },
        tasks: { $push: { id: { $toString: "$_id" }, description: "$description", supportPerson: "$supportPerson", category: "$category", department: "$department", company: "$company", workplace: "$workplace", status: "$status", categoryId: { $toString: "$categoryId" }, departmentId: { $toString: "$departmentId" }, companyId: { $toString: "$companyId" }, workplaceId: { $toString: "$workplaceId" }, statusId: { $toString: "$statusId" }, notes: "$notes", createdAt: "$createdAt" } },
      } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: "$_id", count: 1, departments: 1, tasks: 1 } },
    ]);
    return NextResponse.json(people);
  } catch {
    return NextResponse.json({ error: "Không thể tải top người yêu cầu hỗ trợ" }, { status: 500 });
  }
}
