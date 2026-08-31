export type WeekdayAverage = { label: string; average: number; total: number };
export type WorkloadRanking = { label: string; count: number };
export type WorkloadBreakdowns = {
  weekdays: WeekdayAverage[];
  departments: WorkloadRanking[];
  categories: WorkloadRanking[];
};
