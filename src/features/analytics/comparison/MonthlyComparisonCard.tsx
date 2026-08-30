"use client";

import { useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { TODAY, useWorkloadMetric } from "./useWorkloadMetric";

export default function MonthlyComparisonCard() {
  const [date, setDate] = useState(TODAY);
  const metric = useWorkloadMetric("monthly", date);
  return <ComparisonCard label="So với TB tháng" date={date} onDateChange={(value) => { metric.reload(); setDate(value); }} {...metric} />;
}
