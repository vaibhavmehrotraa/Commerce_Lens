"use client";

import {
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ScatterChartCard({
  points,
  fittedLine,
  height = 320,
  xLabel,
  yLabel,
  xFormatter = (v: number) => v.toFixed(1),
  yFormatter = (v: number) => v.toFixed(1),
}: {
  points: { x: number; y: number }[];
  fittedLine?: { slope: number; intercept: number };
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
}) {
  const xs = points.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const linePts = fittedLine
    ? [
        { x: xMin, fit: fittedLine.slope * xMin + fittedLine.intercept },
        { x: xMax, fit: fittedLine.slope * xMax + fittedLine.intercept },
      ]
    : [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart margin={{ top: 8, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" />
        <XAxis
          dataKey="x"
          type="number"
          name={xLabel}
          tickFormatter={xFormatter}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--axis-line)" }}
          tickLine={false}
          label={xLabel ? { value: xLabel, position: "bottom", fontSize: 12, fill: "var(--text-muted)" } : undefined}
        />
        <YAxis
          dataKey="y"
          type="number"
          name={yLabel}
          tickFormatter={yFormatter}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--axis-line)" }}
          tickLine={false}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--text-muted)" } : undefined}
        />
        <Tooltip
          formatter={(v, name) => [name === "x" ? xFormatter(Number(v)) : yFormatter(Number(v)), name === "x" ? xLabel : yLabel]}
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
          cursor={{ strokeDasharray: "3 3" }}
        />
        <Scatter data={points} fill="var(--series-1)" fillOpacity={0.45} isAnimationActive={false} />
        {fittedLine && (
          <Line
            data={linePts}
            dataKey="fit"
            xAxisId={0}
            stroke="var(--series-8)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            legendType="none"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
