import mongoose, { Schema } from "mongoose";

export const SETTING_TYPES = [
  "category",
  "department",
  "company",
  "workplace",
  "status",
] as const;
export type SettingType = (typeof SETTING_TYPES)[number];

export type SettingDocument = {
  _id: mongoose.Types.ObjectId;
  type: SettingType;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const settingSchema = new Schema<SettingDocument>(
  {
    type: { type: String, enum: SETTING_TYPES, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

settingSchema.index({ type: 1, name: 1 }, { unique: true });

const cachedSettingModel = mongoose.models.Setting as
  | mongoose.Model<SettingDocument>
  | undefined;
const cachedTypePath = cachedSettingModel?.schema.path("type");
const cachedTypeEnum = cachedTypePath?.options.enum;

if (
  cachedSettingModel &&
  (!Array.isArray(cachedTypeEnum) ||
    !cachedTypeEnum.includes("workplace") ||
    !cachedTypeEnum.includes("status"))
) {
  delete mongoose.models.Setting;
}

export const Setting =
  (mongoose.models.Setting as mongoose.Model<SettingDocument> | undefined) ??
  mongoose.model<SettingDocument>("Setting", settingSchema);
