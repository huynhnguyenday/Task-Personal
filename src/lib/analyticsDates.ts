const VIETNAM_OFFSET = "+07:00";
const DAY = 86_400_000;

function vietnamDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function keyAsUtc(key: string) {
  return new Date(`${key}T00:00:00Z`);
}

function mondayOfWeek(key: string) {
  const date = keyAsUtc(key);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}

export function getElapsedCalendarPeriods(firstDate: Date, endDate = new Date()) {
  const firstKey = vietnamDateKey(firstDate);
  const endKey = vietnamDateKey(endDate);
  const first = keyAsUtc(firstKey);
  const end = keyAsUtc(endKey);
  const [firstYear, firstMonth] = firstKey.split("-").map(Number);
  const [endYear, endMonth] = endKey.split("-").map(Number);

  return {
    days: Math.floor((end.getTime() - first.getTime()) / DAY) + 1,
    weeks: Math.floor((mondayOfWeek(endKey).getTime() - mondayOfWeek(firstKey).getTime()) / (7 * DAY)) + 1,
    months: (endYear - firstYear) * 12 + endMonth - firstMonth + 1,
  };
}

function startOfDay(date: Date) {
  return new Date(`${date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })}T00:00:00${VIETNAM_OFFSET}`);
}

export function getCurrentWeekRange() {
  const today = startOfDay(new Date());
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short" }).format(today);
  const dayIndex: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - dayIndex[weekday]);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export function getCurrentMonthRange() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return {
    start: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00${VIETNAM_OFFSET}`),
    end: new Date(`${month === 12 ? year + 1 : year}-${String((month % 12) + 1).padStart(2, "0")}-01T00:00:00${VIETNAM_OFFSET}`),
  };
}
