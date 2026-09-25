"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import { SERIES_COLORS } from "@/lib/data";

export type LineSeries = { key: string; label: string; color?: string };

export function LineChartCard({
  x,
  series,
  data,
  height = 280,
  xFormatter = (v: number) => v.toFixed(1),
  yFormatter = (v: number) => v.toFixed(3),
  refX,
  refLabel,
}: {
  x: string;
  series: LineSeries[];
  data: Record<string, number>[];
  height?: number;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
  refX?: number;
  refLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
        <XAxis
          dataKey={x}
          tickFormatter={xFormatter}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--axis-line)" }}
          tickLine={false}
          type="number"
          domain={["dataMin", "dataMax"]}
        />
        <YAxis tickFormatter={yFormatter} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--axis-line)" }} tickLine={false} />
        <Tooltip
          formatter={(v) => yFormatter(Number(v))}
          labelFormatter={(v) => xFormatter(Number(v))}
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {refX !== undefined && (
          <ReferenceLine x={refX} stroke="var(--status-serious)" strokeDasharray="4 4" label={{ value: refLabel, position: "top", fontSize: 11, fill: "var(--text-muted)" }} />
        )}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}
