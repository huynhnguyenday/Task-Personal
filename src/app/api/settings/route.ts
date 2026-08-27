import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SETTING_TYPES, Setting, type SettingType } from "@/models/Setting";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Setting.find().sort({ name: 1 }).lean();
    const grouped = {
      category: [],
      department: [],
      company: [],
      workplace: [],
      status: [],
    } as Record<SettingType, string[]>;

    for (const item of items) grouped[item.type].push(item.name);
    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json(
      { error: "Không thể tải cấu hình" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as SettingType;
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!SETTING_TYPES.includes(type) || !name) {
      return NextResponse.json(
        { error: "Loại và tên cấu hình là bắt buộc" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const item = await Setting.create({ type, name });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings failed:", error);
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Giá trị này đã tồn tại" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Không thể tạo cấu hình" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as SettingType;
    const oldName = typeof body.oldName === "string" ? body.oldName.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!SETTING_TYPES.includes(type) || !oldName || !name) {
      return NextResponse.json(
        { error: "Loại, tên cũ và tên mới là bắt buộc" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const item = await Setting.findOneAndUpdate(
      { type, name: oldName },
      { name },
      { new: true, runValidators: true },
    ).lean();

    if (!item) {
      return NextResponse.json(
        { error: "Không tìm thấy giá trị cần sửa" },
        { status: 404 },
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("PUT /api/settings failed:", error);
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Giá trị này đã tồn tại" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Không thể cập nhật cấu hình" },
      { status: 500 },
    );
  }
}
