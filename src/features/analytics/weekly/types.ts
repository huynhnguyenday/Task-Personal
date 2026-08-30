import type { TaskDetail } from "../shared/types";

export type WeeklyTask = TaskDetail;

export type WeeklyDay = { date: string; count: number; tasks: WeeklyTask[] };
