import { NextResponse } from "next/server";
import { Types, type QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Task, type TaskDocument } from "@/models/Task";
import { SETTING_TYPES, Setting } from "@/models/Setting";
import { taskSettingsPipeline } from "@/lib/taskSettingsPipeline";

export const runtime = "nodejs";

const TASKS_PER_PAGE = 20;
const CONFIG_FIELDS = SETTING_TYPES;

async function resolveConfig(body: Record<string, unknown>) {
  const values: Record<string, unknown> = {};
  for (const type of CONFIG_FIELDS) {
    const idKey = `${type}Id`;
    const id = typeof body[idKey] === "string" ? body[idKey].trim() : "";
    const setting = id ? await Setting.findOne({ _id: id, type }).lean() : null;
    if (!setting) throw new Error(`INVALID_CONFIG:${type}`);
    values[idKey] = setting._id;
  }
  return values;
}

async function loadTask(id: Types.ObjectId | string) {
  const [task] = await Task.aggregate([
    { $match: { _id: typeof id === "string" ? new Types.ObjectId(id) : id } },
    ...taskSettingsPipeline(),
  ]);
  return task ? serializeTask(task) : null;
}

function serializeTask(task: Record<string, unknown>) {
  const result = { ...task };
  for (const type of CONFIG_FIELDS) {
    const value = result[`${type}Id`];
    result[`${type}Id`] = value ? String(value) : "";
  }
  return result;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const cursorDate = searchParams.get("cursorDate");
    const cursorId = searchParams.get("cursorId");
    const clauses: QueryFilter<TaskDocument>[] = [];
    const fieldFilters = [
      ["category", "category"],
      ["department", "department"],
      ["company", "company"],
      ["workplace", "workplace"],
      ["status", "status"],
    ] as const;

    for (const [parameter, field] of fieldFilters) {
      const values = searchParams.getAll(parameter).filter(Boolean);
      if (values.length) {
        const settingIds = await Setting.find({ type: field, name: { $in: values } }).distinct("_id");
        clauses.push({ [`${field}Id`]: { $in: settingIds } });
      }
    }

    const description = searchParams.get("description")?.trim();
    if (description) {
      clauses.push({
        description: { $regex: escapeRegExp(description), $options: "i" },
      });
    }

    const supportPerson = searchParams.get("supportPerson")?.trim();
    if (supportPerson) {
      clauses.push({
        supportPerson: { $regex: escapeRegExp(supportPerson), $options: "i" },
      });
    }

    const selectedDates = searchParams.getAll("createdAt").filter(Boolean);
    if (selectedDates.length) {
      const dateRanges = selectedDates.flatMap((value) => {
        const [day, month, year] = value.split("/").map(Number);
        if (!day || !month || !year) return [];
        return [
          {
            createdAt: {
              $gte: new Date(year, month - 1, day),
              $lt: new Date(year, month - 1, day + 1),
            },
          },
        ];
      });
      if (dateRanges.length) clauses.push({ $or: dateRanges });
    }

    if (cursorDate && cursorId) {
      clauses.push({
        $or: [
          { createdAt: { $lt: new Date(cursorDate) } },
          { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
        ],
      });
    }

    const query: QueryFilter<TaskDocument> = clauses.length
      ? { $and: clauses }
      : {};

    const tasks = await Task.aggregate([
      { $match: query },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: TASKS_PER_PAGE + 1 },
      ...taskSettingsPipeline(),
    ]);
    const hasMore = tasks.length > TASKS_PER_PAGE;
    const pageTasks = tasks.slice(0, TASKS_PER_PAGE);
    const lastTask = pageTasks.at(-1);

    return NextResponse.json({
      tasks: pageTasks.map((task) => serializeTask(task as unknown as Record<string, unknown>)),
      hasMore,
      nextCursor: lastTask
        ? {
            date: lastTask.createdAt,
            id: lastTask._id.toString(),
          }
        : null,
    });
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
      const idField = `${field}Id`;
      if (typeof body[idField] !== "string" || !body[idField].trim()) {
        return NextResponse.json(
          { error: `${label} là bắt buộc` },
          { status: 400 },
        );
      }
    }

    await connectToDatabase();
    const config = await resolveConfig(body);
    const task = await Task.create({
      description,
      supportPerson: body.supportPerson.trim(),
      ...config,
      notes: body.notes ?? "",
    });

    return NextResponse.json(await loadTask(task._id), { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);
    if (error instanceof Error && (error.name === "ValidationError" || error.message.startsWith("INVALID_CONFIG:"))) {
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
    const createdAtValue =
      typeof body.createdAt === "string" ? body.createdAt : "";
    const createdAt = new Date(`${createdAtValue}T00:00:00.000Z`);
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

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(createdAtValue) ||
      Number.isNaN(createdAt.getTime()) ||
      createdAt.toISOString().slice(0, 10) !== createdAtValue
    ) {
      return NextResponse.json(
        { error: "Ngày tạo không hợp lệ" },
        { status: 400 },
      );
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      const idField = `${field}Id`;
      if (typeof body[idField] !== "string" || !body[idField].trim()) {
        return NextResponse.json(
          { error: `${label} là bắt buộc` },
          { status: 400 },
        );
      }
    }

    await connectToDatabase();
    const config = await resolveConfig(body);
    const task = await Task.findByIdAndUpdate(
      id,
      {
        description,
        supportPerson: body.supportPerson.trim(),
        ...config,
        notes: body.notes ?? "",
        createdAt,
      },
      { new: true, runValidators: true, overwriteImmutable: true },
    ).lean();

    if (!task) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần sửa" },
        { status: 404 },
      );
    }

    return NextResponse.json(await loadTask(task._id));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_CONFIG:")) {
      return NextResponse.json({ error: "Cấu hình công việc không hợp lệ" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Không thể cập nhật công việc" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { error: "Mã công việc là bắt buộc" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const task = await Task.findByIdAndDelete(id).lean();
    if (!task) {
      return NextResponse.json(
        { error: "Không tìm thấy công việc cần xóa" },
        { status: 404 },
      );
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa công việc" },
      { status: 500 },
    );
  }
}
