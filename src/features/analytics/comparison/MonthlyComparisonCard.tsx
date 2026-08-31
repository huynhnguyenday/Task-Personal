"use client";

import { useEffect, useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { getToday, RECORDING_START, useWorkloadMetric } from "./useWorkloadMetric";

export default function MonthlyComparisonCard() {
  const [month, setMonth] = useState("");
  useEffect(() => { const frame = requestAnimationFrame(() => setMonth(getToday().slice(0, 7))); return () => cancelAnimationFrame(frame); }, []);
  const metricDate = !month ? "" : month === RECORDING_START.slice(0, 7) ? RECORDING_START : `${month}-01`;
  const metric = useWorkloadMetric("monthly", metricDate);
  return <ComparisonCard label="So với TB tháng" ratio pickerType="month" min={RECORDING_START.slice(0, 7)} fallbackDate={getToday().slice(0, 7)} date={month} onDateChange={setMonth} {...metric} />;
}
