export type WeeklyTask = {
  id: string;
  description: string;
  supportPerson: string;
  category: string;
  department: string;
  company: string;
  workplace: string;
  status: string;
  notes: string;
  createdAt: string;
};
export type WeeklyDay = { date: string; count: number; tasks: WeeklyTask[] };
export type Supporter = { name: string; count: number };
export type MonthlyStatus = { total: number; inProgress: number; waiting: number; cancelled: number; completed: number };
export type WorkloadComparison = { total: number; monthlyPercent: number | null; weeklyPercent: number | null; dailyPercent: number | null };
