"use client";

import { useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { TODAY, useWorkloadMetric } from "./useWorkloadMetric";

export default function WeeklyComparisonCard() {
  const [date, setDate] = useState(TODAY);
  const metric = useWorkloadMetric("weekly", date);
  return <ComparisonCard label="So với TB mỗi tuần" date={date} onDateChange={(value) => { metric.reload(); setDate(value); }} {...metric} />;
}
