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
  categoryId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  workplaceId?: mongoose.Types.ObjectId;
  statusId?: mongoose.Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

const taskSchema = new Schema<TaskDocument>(
  {
    description: { type: String, required: true, trim: true },
    supportPerson: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Setting" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Setting" },
    companyId: { type: Schema.Types.ObjectId, ref: "Setting" },
    workplaceId: { type: Schema.Types.ObjectId, ref: "Setting" },
    statusId: { type: Schema.Types.ObjectId, ref: "Setting" },
  },
  { timestamps: true },
);

// Match newest-first cursor pagination and the date-bounded analytics reads.
taskSchema.index({ createdAt: -1, _id: -1 });
taskSchema.index({ supportPerson: 1, createdAt: -1 });
taskSchema.index({ categoryId: 1 });
taskSchema.index({ departmentId: 1 });
taskSchema.index({ companyId: 1 });
taskSchema.index({ workplaceId: 1 });
taskSchema.index({ statusId: 1 });

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
