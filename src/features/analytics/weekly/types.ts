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
