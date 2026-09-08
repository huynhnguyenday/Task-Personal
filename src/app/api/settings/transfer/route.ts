import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SETTING_TYPES, Setting, type SettingType } from "@/models/Setting";
import { Task } from "@/models/Task";
import { invalidateAnalyticsSnapshot } from "@/lib/analyticsSnapshot";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as SettingType;
    const sourceId = searchParams.get("sourceId")?.trim() ?? "";
    if (!SETTING_TYPES.includes(type) || !Types.ObjectId.isValid(sourceId)) {
      return NextResponse.json({ error: "Thông tin cấu hình không hợp lệ" }, { status: 400 });
    }

    await connectToDatabase();
    const source = await Setting.exists({ _id: sourceId, type });
    if (!source) {
      return NextResponse.json({ error: "Không tìm thấy cấu hình nguồn" }, { status: 404 });
    }

    const tasks = await Task.find(
      { [`${type}Id`]: new Types.ObjectId(sourceId) },
      { description: 1, supportPerson: 1, createdAt: 1 },
    ).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      tasks: tasks.map((task) => ({
        id: task._id.toString(),
        description: task.description,
        supportPerson: task.supportPerson,
      })),
    });
  } catch (error) {
    console.error("GET /api/settings/transfer failed:", error);
    return NextResponse.json({ error: "Không thể tải danh sách task" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as SettingType;
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
    const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
    const hasTaskSelection = Array.isArray(body.taskIds);
    const taskIds: string[] = hasTaskSelection
      ? body.taskIds.filter((id: unknown): id is string => typeof id === "string" && Types.ObjectId.isValid(id))
      : [];

    if (
      !SETTING_TYPES.includes(type) ||
      !Types.ObjectId.isValid(sourceId) ||
      !Types.ObjectId.isValid(targetId)
    ) {
      return NextResponse.json({ error: "Thông tin chuyển giao không hợp lệ" }, { status: 400 });
    }
    if (hasTaskSelection && (!taskIds.length || taskIds.length !== body.taskIds.length)) {
      return NextResponse.json({ error: "Danh sách task được chọn không hợp lệ" }, { status: 400 });
    }
    if (sourceId === targetId) {
      return NextResponse.json({ error: "Danh mục đích phải khác danh mục nguồn" }, { status: 400 });
    }

    await connectToDatabase();
    const [source, target] = await Promise.all([
      Setting.findOne({ _id: sourceId, type }).lean(),
      Setting.findOne({ _id: targetId, type }).lean(),
    ]);

    if (!source || !target) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục nguồn hoặc danh mục đích cùng loại" },
        { status: 404 },
      );
    }

    const field = `${type}Id`;
    // Work directly with ObjectIds in the tasks collection: every task pointing
    // at the source setting is reassigned to the selected setting of the same type.
    const taskFilter: Record<string, unknown> = { [field]: new Types.ObjectId(sourceId) };
    if (hasTaskSelection) taskFilter._id = { $in: taskIds.map((id) => new Types.ObjectId(id)) };
    const result = await Task.collection.updateMany(
      taskFilter,
      { $set: { [field]: new Types.ObjectId(targetId) } },
    );
    invalidateAnalyticsSnapshot();

    return NextResponse.json({
      transferredCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      source: { id: source._id.toString(), name: source.name },
      target: { id: target._id.toString(), name: target.name },
    });
  } catch (error) {
    console.error("POST /api/settings/transfer failed:", error);
    return NextResponse.json({ error: "Không thể chuyển giao dữ liệu" }, { status: 500 });
  }
}
