"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from "recharts";
import { SERIES_COLORS } from "@/lib/data";

export type BarDatum = { name: string; value: number; n?: number };

export function BarChartCard({
  data,
  height = 280,
  valueFormatter = (v: number) => v.toFixed(2),
  color,
  yDomain,
  horizontal = false,
  showValues = true,
}: {
  data: BarDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
  color?: string;
  yDomain?: [number, number];
  horizontal?: boolean;
  showValues?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, left: horizontal ? 24 : 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickFormatter={valueFormatter} domain={yDomain} axisLine={{ stroke: "var(--axis-line)" }} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--axis-line)" }} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--axis-line)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickFormatter={valueFormatter} domain={yDomain} axisLine={{ stroke: "var(--axis-line)" }} tickLine={false} />
          </>
        )}
        <Tooltip
          formatter={(v) => valueFormatter(Number(v))}
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: "var(--foreground)" }}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {showValues && (
            <LabelList
              dataKey="value"
              position={horizontal ? "right" : "top"}
              formatter={(v: React.ReactNode) => valueFormatter(Number(v))}
              style={{ fontSize: 11, fill: "var(--text-muted)" }}
            />
          )}
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
