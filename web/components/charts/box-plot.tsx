"use client";

import { useMemo, useState } from "react";
import { quartiles, outlierBounds } from "@/lib/analytics/descriptive";
import { SERIES_COLORS } from "@/lib/data";

type Box = {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
};

function buildBox(name: string, values: number[]): Box {
  const q = quartiles(values);
  const bounds = outlierBounds(values);
  const inliers = values.filter((v) => v >= bounds.lower && v <= bounds.upper);
  const outliers = values.filter((v) => v < bounds.lower || v > bounds.upper);
  return {
    name,
    min: Math.min(...inliers),
    q1: q.q1,
    median: q.q2,
    q3: q.q3,
    max: Math.max(...inliers),
    outliers,
  };
}

export function BoxPlotChart({
  groups,
  height = 320,
  valueFormatter = (v: number) => v.toFixed(0),
}: {
  groups: Record<string, number[]>;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const boxes = useMemo(
    () => Object.entries(groups).filter(([, v]) => v.length > 0).map(([name, values]) => buildBox(name, values)),
    [groups]
  );

  const allVals = boxes.flatMap((b) => [b.min, b.max, ...b.outliers]);
  const yMax = Math.max(...allVals) * 1.05;
  const yMin = Math.min(0, Math.min(...allVals));

  const width = 640;
  const marginLeft = 56;
  const marginBottom = 28;
  const marginTop = 12;
  const plotW = width - marginLeft - 12;
  const plotH = height - marginTop - marginBottom;
  const bandW = plotW / boxes.length;
  const boxW = Math.min(64, bandW * 0.5);

  const yScale = (v: number) => marginTop + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const ticks = 5;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / ticks);

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[480px]">
        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={marginLeft} x2={width - 12} y1={yScale(t)} y2={yScale(t)} stroke="var(--gridline)" strokeDasharray="3 3" />
            <text x={marginLeft - 8} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
              {valueFormatter(t)}
            </text>
          </g>
        ))}
        <line x1={marginLeft} x2={marginLeft} y1={marginTop} y2={marginTop + plotH} stroke="var(--axis-line)" />
        <line x1={marginLeft} x2={width - 12} y1={marginTop + plotH} y2={marginTop + plotH} stroke="var(--axis-line)" />

        {boxes.map((b, i) => {
          const cx = marginLeft + bandW * i + bandW / 2;
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          const isHover = hover === b.name;
          return (
            <g
              key={b.name}
              onMouseEnter={() => setHover(b.name)}
              onMouseLeave={() => setHover(null)}
              opacity={hover && !isHover ? 0.55 : 1}
            >
              <line x1={cx} x2={cx} y1={yScale(b.min)} y2={yScale(b.q1)} stroke={color} strokeWidth={1.5} />
              <line x1={cx} x2={cx} y1={yScale(b.q3)} y2={yScale(b.max)} stroke={color} strokeWidth={1.5} />
              <line x1={cx - boxW / 4} x2={cx + boxW / 4} y1={yScale(b.min)} y2={yScale(b.min)} stroke={color} strokeWidth={1.5} />
              <line x1={cx - boxW / 4} x2={cx + boxW / 4} y1={yScale(b.max)} y2={yScale(b.max)} stroke={color} strokeWidth={1.5} />
              <rect
                x={cx - boxW / 2}
                y={yScale(b.q3)}
                width={boxW}
                height={Math.max(1, yScale(b.q1) - yScale(b.q3))}
                fill={color}
                fillOpacity={0.22}
                stroke={color}
                strokeWidth={1.5}
                rx={2}
              />
              <line x1={cx - boxW / 2} x2={cx + boxW / 2} y1={yScale(b.median)} y2={yScale(b.median)} stroke={color} strokeWidth={2.5} />
              {b.outliers.slice(0, 40).map((o, j) => (
                <circle key={j} cx={cx} cy={yScale(o)} r={2.5} fill="var(--status-critical)" fillOpacity={0.55} />
              ))}
              <text x={cx} y={height - marginBottom + 16} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {b.name.length > 10 ? b.name.slice(0, 9) + "…" : b.name}
              </text>
              {isHover && (
                <g>
                  <rect x={cx - 62} y={yScale(b.q3) - 58} width={124} height={52} rx={6} fill="var(--popover)" stroke="var(--border)" />
                  <text x={cx} y={yScale(b.q3) - 42} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                    Q3 {valueFormatter(b.q3)} &middot; Med {valueFormatter(b.median)}
                  </text>
                  <text x={cx} y={yScale(b.q3) - 28} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                    Q1 {valueFormatter(b.q1)} &middot; n outliers {b.outliers.length}
                  </text>
                  <text x={cx} y={yScale(b.q3) - 14} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                    range [{valueFormatter(b.min)}, {valueFormatter(b.max)}]
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
