import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SETTING_TYPES, Setting, type SettingType } from "@/models/Setting";
import { Task } from "@/models/Task";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const items = await Setting.find().sort({ name: 1 }).lean();
    const includeIds = new URL(request.url).searchParams.get("format") === "items";
    const grouped = {
      category: [],
      department: [],
      company: [],
      workplace: [],
      status: [],
    } as Record<SettingType, unknown[]>;

    for (const item of items) grouped[item.type].push(includeIds ? { id: item._id.toString(), name: item.name } : item.name);
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
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!SETTING_TYPES.includes(type) || (!id && !oldName) || !name) {
      return NextResponse.json(
        { error: "Loại, tên cũ và tên mới là bắt buộc" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const item = await Setting.findOneAndUpdate(
      id ? { _id: id, type } : { type, name: oldName },
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const type = body.type as SettingType;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const id = typeof body.id === "string" ? body.id : "";

    if (!SETTING_TYPES.includes(type) || (!id && !name)) {
      return NextResponse.json(
        { error: "Loại và tên cấu hình là bắt buộc" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const item = await Setting.findOne(id ? { _id: id, type } : { type, name }).lean();

    if (!item) {
      return NextResponse.json(
        { error: "Không tìm thấy giá trị cần xóa" },
        { status: 404 },
      );
    }

    if (await Task.exists({ [`${type}Id`]: item._id })) {
      return NextResponse.json({ error: "Cấu hình đang được task sử dụng nên không thể xóa" }, { status: 409 });
    }
    await Setting.deleteOne({ _id: item._id });
    return NextResponse.json({ type, name: item.name });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa cấu hình" },
      { status: 500 },
    );
  }
}
