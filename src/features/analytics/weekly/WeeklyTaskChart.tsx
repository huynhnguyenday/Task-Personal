"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip, type Plugin, type TooltipModel } from "chart.js";
import { Skeleton } from "@/components/LoadingSkeleton";
import TaskDetailModal from "./TaskDetailModal";
import type { WeeklyDay, WeeklyTask } from "./types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function formatLocalDate(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function initialRange() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return { from: formatLocalDate(monday), to: formatLocalDate(today) };
}

const defaultRange = initialRange();

export default function WeeklyTaskChart() {
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [appliedRange, setAppliedRange] = useState(defaultRange);
  const [data, setData] = useState<WeeklyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showValues, setShowValues] = useState(true);
  const [selectedTask, setSelectedTask] = useState<WeeklyTask | null>(null);
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTooltipHovered = useRef(false);
  const activePointIndex = useRef<number | null>(null);
  const activePointProgress = useRef(0);
  const activeAnimationFrame = useRef<number | null>(null);
  const showValuesRef = useRef(showValues);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/analytics/weekly?from=${appliedRange.from}&to=${appliedRange.to}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Không thể tải biểu đồ");
        setData(result);
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Không thể tải biểu đồ");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedRange]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from > to) return setError("Ngày bắt đầu phải trước ngày kết thúc.");
    const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;
    if (days > 31) return setError("Vui lòng chọn tối đa 31 ngày.");
    setError("");
    setLoading(true);
    setAppliedRange({ from, to });
  }

  const chartData = {
    labels: data.map((day) => String(Number(day.date.slice(-2)))),
    datasets: [{ label: "Số task", data: data.map((day) => day.count), borderColor: "#28745b", backgroundColor: "rgba(40, 116, 91, 0.12)", pointBackgroundColor: "#ffffff", pointBorderColor: "#28745b", pointHoverBackgroundColor: "#ffffff", pointHoverBorderWidth: 0, pointRadius: 5, pointHoverRadius: 5, pointBorderWidth: 3, borderWidth: 3, tension: 0.35, fill: true }],
  };

  const valueLabels = useMemo<Plugin<"line">>(() => ({
    id: "task-value-labels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const activeIndex = activePointIndex.current;
      if (activeIndex !== null) {
        const activePoint = chart.getDatasetMeta(0).data[activeIndex];
        if (activePoint) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(activePoint.x, activePoint.y, 5 + activePointProgress.current * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40, 116, 91, ${activePointProgress.current})`;
          ctx.fill();
          ctx.restore();
        }
      }
      if (!showValuesRef.current) return;
      ctx.save();
      ctx.fillStyle = "#173f33";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      chart.getDatasetMeta(0).data.forEach((point, index) => ctx.fillText(String(data[index]?.count ?? 0), point.x, point.y - 12));
      ctx.restore();
    },
  }), [data]);

  function toggleValues() {
    const nextValue = !showValuesRef.current;
    showValuesRef.current = nextValue;
    setShowValues(nextValue);
    chartRef.current?.draw();
  }

  function animateActivePoint(target: number, clearWhenDone = false) {
    if (activeAnimationFrame.current !== null) cancelAnimationFrame(activeAnimationFrame.current);
    const startValue = activePointProgress.current;
    const startedAt = performance.now();
    const duration = 180;
    const animate = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      activePointProgress.current = startValue + (target - startValue) * eased;
      chartRef.current?.draw();
      if (elapsed < 1) activeAnimationFrame.current = requestAnimationFrame(animate);
      else {
        activeAnimationFrame.current = null;
        if (clearWhenDone) activePointIndex.current = null;
      }
    };
    activeAnimationFrame.current = requestAnimationFrame(animate);
  }

  function renderTooltip(context: { chart: ChartJS; tooltip: TooltipModel<"line"> }) {
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) return;
    if (context.tooltip.opacity === 0) {
      if (isTooltipHovered.current || tooltipElement.matches(":hover")) return;
      if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
      if (activePointIndex.current !== null) {
        chartRef.current?.setActiveElements([{ datasetIndex: 0, index: activePointIndex.current }]);
        chartRef.current?.draw();
      }
      tooltipHideTimer.current = setTimeout(() => {
        if (isTooltipHovered.current || tooltipElement.matches(":hover")) return;
        tooltipElement.style.opacity = "0";
        tooltipElement.style.pointerEvents = "none";
        animateActivePoint(0, true);
        chartRef.current?.setActiveElements([]);
      }, 180);
      return;
    }
    if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
    const index = context.tooltip.dataPoints?.[0]?.dataIndex ?? 0;
    const day = data[index];
    if (!day) return;
    if (activePointIndex.current !== index) {
      activePointIndex.current = index;
      activePointProgress.current = 0;
      animateActivePoint(1);
    }

    tooltipElement.replaceChildren();
    const header = document.createElement("div");
    header.className = "flex shrink-0 items-center justify-between gap-4 border-b border-white/15 px-4 py-3";
    const date = document.createElement("strong");
    date.className = "text-sm";
    date.textContent = `Ngày ${day.date.split("-").reverse().join("/")}`;
    const count = document.createElement("span");
    count.className = "rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold";
    count.textContent = `${day.count} task`;
    header.append(date, count);

    const list = document.createElement("div");
    list.className = "scrollbar-tooltip grid h-[176px] content-start gap-2 overflow-y-auto p-3";
    if (!day.tasks.length) {
      const empty = document.createElement("p");
      empty.className = "m-0 py-12 text-center text-xs text-white/60";
      empty.textContent = "Không có task trong ngày này";
      list.append(empty);
    } else {
      day.tasks.forEach((task, taskIndex) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "w-full rounded border-0 bg-white/10 px-3 py-2 text-left text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#79af9b]";
        item.addEventListener("click", () => setSelectedTask(task));
        const description = document.createElement("p");
        description.className = "m-0 line-clamp-2 text-xs font-semibold leading-4";
        description.textContent = `${taskIndex + 1}. ${task.description}`;
        const person = document.createElement("p");
        person.className = "m-0 mt-1 truncate text-[10px] text-white/60";
        person.textContent = `Người hỗ trợ: ${task.supportPerson}`;
        item.append(description, person);
        list.append(item);
      });
    }
    tooltipElement.append(header, list);
    const left = context.tooltip.caretX + 316 <= context.chart.width
      ? context.tooltip.caretX + 16
      : Math.max(context.tooltip.caretX - 316, 8);
    const top = Math.min(Math.max(context.tooltip.caretY - 114, 8), Math.max(context.chart.height - 236, 8));
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
    tooltipElement.style.opacity = "1";
    tooltipElement.style.pointerEvents = "auto";
  }

  return (
    <article className="flex min-h-0 flex-col border border-[#e3e7e9] bg-white p-3.5 sm:p-4">
      <div className="flex shrink-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div><p className="text-[10px] font-bold tracking-[1.4px] text-[#28745b]">THEO KHOẢNG NGÀY</p><h2 className="mt-1 text-lg font-semibold">Số lượng task</h2></div>
        <form className="flex flex-wrap items-end gap-2" onSubmit={applyFilter}>
          <button className={`h-9 border px-3 text-xs font-bold transition ${showValues ? "border-[#28745b] bg-[#e3f0e9] text-[#28745b]" : "border-[#d9dfe0] bg-white text-[#727a82]"}`} type="button" aria-pressed={showValues} onClick={toggleValues}>{showValues ? "Ẩn số" : "Hiện số"}</button>
          <label className="grid gap-1 text-[10px] font-bold text-[#727a82]">TỪ NGÀY<input className="h-9 border border-[#d9dfe0] bg-[#fafbfa] px-2 text-xs outline-none focus:border-[#28745b]" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required /></label>
          <label className="grid gap-1 text-[10px] font-bold text-[#727a82]">ĐẾN NGÀY<input className="h-9 border border-[#d9dfe0] bg-[#fafbfa] px-2 text-xs outline-none focus:border-[#28745b]" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} required /></label>
          <button className="h-9 bg-[#28745b] px-3 text-xs font-bold text-white transition hover:bg-[#1e604a] disabled:opacity-60" type="submit" disabled={loading}>Áp dụng</button>
        </form>
      </div>
      {error && <p className="mt-2 text-xs text-[#a34646]">{error}</p>}
      <div className="mt-2 min-h-[120px] min-w-0 flex-1 overflow-visible">
        {loading ? <div className="flex h-full items-end gap-4 overflow-hidden">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="min-h-12 min-w-0 flex-1" width={`${48 + index * 6}%`} />)}</div> : (
          <div className="relative h-full min-w-0 overflow-visible"><Line ref={chartRef} plugins={[valueLabels]} data={chartData} options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: "nearest", intersect: true }, animation: { duration: 650 }, layout: { padding: { top: 18 } }, plugins: { legend: { display: false }, tooltip: { enabled: false, external: renderTooltip } }, scales: { x: { title: { display: true, text: "Ngày", color: "#727a82" }, grid: { display: false }, ticks: { color: "#727a82", maxTicksLimit: 16 } }, y: { beginAtZero: true, suggestedMax: Math.max(...data.map((day) => day.count), 1) + 1, ticks: { precision: 0, color: "#727a82" }, grid: { color: "#edf0ee" } } } }} /><div ref={tooltipRef} className="pointer-events-none absolute z-20 h-[245px] w-[300px] overflow-hidden rounded-lg bg-[#173f33] text-white opacity-0 shadow-[0_16px_40px_rgba(20,35,29,0.32)] transition-opacity" onMouseEnter={() => { isTooltipHovered.current = true; if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current); if (activePointIndex.current !== null) { chartRef.current?.setActiveElements([{ datasetIndex: 0, index: activePointIndex.current }]); animateActivePoint(1); } }} onMouseLeave={(event) => { isTooltipHovered.current = false; chartRef.current?.setActiveElements([]); animateActivePoint(0, true); event.currentTarget.style.opacity = "0"; event.currentTarget.style.pointerEvents = "none"; }} /></div>
        )}
      </div>
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </article>
  );
}
