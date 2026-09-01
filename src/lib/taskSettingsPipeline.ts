import type { PipelineStage } from "mongoose";

export const TASK_SETTING_TYPES = ["category", "department", "company", "workplace", "status"] as const;

export function taskSettingsPipeline(): PipelineStage[] {
  return TASK_SETTING_TYPES.flatMap((type) => [
    {
      $lookup: {
        from: "settings",
        localField: `${type}Id`,
        foreignField: "_id",
        as: `_${type}Setting`,
      },
    },
    {
      $set: {
        [type]: { $ifNull: [{ $first: `$_${type}Setting.name` }, ""] },
      },
    },
    { $unset: `_${type}Setting` },
  ] as PipelineStage[]);
}
