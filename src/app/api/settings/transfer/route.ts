import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SETTING_TYPES, Setting, type SettingType } from "@/models/Setting";
import { Task } from "@/models/Task";
import { invalidateAnalyticsSnapshot } from "@/lib/analyticsSnapshot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as SettingType;
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
    const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";

    if (
      !SETTING_TYPES.includes(type) ||
      !Types.ObjectId.isValid(sourceId) ||
      !Types.ObjectId.isValid(targetId)
    ) {
      return NextResponse.json({ error: "Thông tin chuyển giao không hợp lệ" }, { status: 400 });
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
    const result = await Task.collection.updateMany(
      { [field]: new Types.ObjectId(sourceId) },
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
