"use client";

import { useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { TODAY, useWorkloadMetric } from "./useWorkloadMetric";

export default function DailyComparisonCard() {
  const [date, setDate] = useState(TODAY);
  const metric = useWorkloadMetric("daily", date);
  return <ComparisonCard label="So với TB mỗi ngày" date={date} onDateChange={(value) => { metric.reload(); setDate(value); }} {...metric} />;
}
