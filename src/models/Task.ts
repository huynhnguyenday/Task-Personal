import mongoose, { Schema } from "mongoose";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
] as const;

export type TaskStatus = string;

export type TaskDocument = {
  _id: mongoose.Types.ObjectId;
  description: string;
  supportPerson: string;
  category: string;
  department: string;
  company: string;
  workplace: string;
  status: TaskStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

const taskSchema = new Schema<TaskDocument>(
  {
    description: { type: String, required: true, trim: true },
    supportPerson: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    workplace: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      default: "TODO",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const cachedTaskModel = mongoose.models.Task as
  | mongoose.Model<TaskDocument>
  | undefined;
const cachedStatusEnum = cachedTaskModel?.schema.path("status")?.options.enum;

if (cachedTaskModel && Array.isArray(cachedStatusEnum)) {
  delete mongoose.models.Task;
}

export const Task =
  (mongoose.models.Task as mongoose.Model<TaskDocument> | undefined) ??
  mongoose.model<TaskDocument>("Task", taskSchema);
