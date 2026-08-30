"use client";

import { useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { RECORDING_START, TODAY, useWorkloadMetric } from "./useWorkloadMetric";

export default function MonthlyComparisonCard() {
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const metricDate = month === RECORDING_START.slice(0, 7) ? RECORDING_START : `${month}-01`;
  const metric = useWorkloadMetric("monthly", metricDate);
  return <ComparisonCard label="So với TB tháng" pickerType="month" min={RECORDING_START.slice(0, 7)} date={month} onDateChange={(value) => { metric.reload(); setMonth(value); }} {...metric} />;
}
