"use client";

import { useEffect, useState } from "react";
import ComparisonCard from "./ComparisonCard";
import { getToday, RECORDING_START, useWorkloadMetric } from "./useWorkloadMetric";

function toWeekValue(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekToMonday(weekValue: string) {
  const [yearText, weekText] = weekValue.split("-W");
  const januaryFourth = new Date(Date.UTC(Number(yearText), 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() + 6) % 7) + (Number(weekText) - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

export default function WeeklyComparisonCard() {
  const [week, setWeek] = useState("");
  useEffect(() => { const frame = requestAnimationFrame(() => setWeek(toWeekValue(getToday()))); return () => cancelAnimationFrame(frame); }, []);
  const monday = week ? weekToMonday(week) : "";
  const metricDate = monday && monday < RECORDING_START ? RECORDING_START : monday;
  const metric = useWorkloadMetric("weekly", metricDate);
  return <ComparisonCard label="So với TB mỗi tuần" ratio pickerType="week" min={toWeekValue(RECORDING_START)} fallbackDate={toWeekValue(getToday())} date={week} onDateChange={(value) => { metric.reload(); setWeek(value); }} {...metric} />;
}
