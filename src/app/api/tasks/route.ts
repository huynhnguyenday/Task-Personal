import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Task, type TaskStatus } from "@/models/Task";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách công việc" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const requiredFields = {
      supportPerson: "Người cần hỗ trợ",
      category: "Danh mục",
      department: "Phòng ban",
      company: "Công ty",
      workplace: "Nơi làm việc",
      status: "Trạng thái",
    } as const;

    if (!description) {
      return NextResponse.json(
        { error: "Mô tả công việc là bắt buộc" },
        { status: 400 },
      );
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { error: `${label} là bắt buộc` },
          { status: 400 },
        );
      }
    }

    const status = body.status as TaskStatus;

    await connectToDatabase();
    const task = await Task.create({
      description,
      supportPerson: body.supportPerson.trim(),
      category: body.category.trim(),
      department: body.department.trim(),
      company: body.company.trim(),
      workplace: body.workplace.trim(),
      status,
      notes: body.notes ?? "",
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Dữ liệu công việc không hợp lệ" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Không thể tạo công việc" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const requiredFields = {
      supportPerson: "Người cần hỗ trợ",
      category: "Danh mục",
      department: "Phòng ban",
      company: "Công ty",
      workplace: "Nơi làm việc",
      status: "Trạng thái",
    } as const;

    if (!id || !description) {
      return NextResponse.json(
        { error: "Mã và mô tả công việc là bắt buộc" },
        { status: 400 },
      );
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { error: `${label} là bắt buộc` },
          { status: 400 },
        );
      }
    }

    const status = body.status as TaskStatus;

    await connectToDatabase();
    const task = await Task.findByIdAndUpdate(
      id,
      {
        description,
        supportPerson: body.supportPerson.trim(),
        category: body.category.trim(),
        department: body.department.trim(),
        company: body.company.trim(),
        workplace: body.workplace.trim(),
        status,
        notes: body.notes ?? "",
      },
      { new: true, runValidators: true },
    ).lean();

    if (!task) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần sửa" },
        { status: 404 },
      );
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật công việc" },
      { status: 500 },
    );
  }
}
