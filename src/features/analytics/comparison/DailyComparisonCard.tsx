"use client";

import { useEffect, useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { getToday, useWorkloadMetric } from "./useWorkloadMetric";

export default function DailyComparisonCard() {
  const [date, setDate] = useState("");
  useEffect(() => { const frame = requestAnimationFrame(() => setDate(getToday())); return () => cancelAnimationFrame(frame); }, []);
  const metric = useWorkloadMetric("daily", date);
  return <ComparisonCard label="So với TB mỗi ngày" ratio fallbackDate={getToday()} date={date} onDateChange={(value) => { metric.reload(); setDate(value); }} {...metric} />;
}
