"use client";

import { useMemo, useState } from "react";
import { data, fmtINR, fmtNum, fmtPct, type ValueMetrics } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { BarChartCard } from "@/components/charts/bar-chart";
import { BoxPlotChart } from "@/components/charts/box-plot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DimensionKey = "segment" | "category" | "channel" | "income" | "device" | "season";

const DIMENSIONS: { key: DimensionKey; label: string; map: Record<string, ValueMetrics> }[] = [
  { key: "segment", label: "Customer Segment", map: data.customer_value_by_segment },
  { key: "category", label: "Product Category", map: data.customer_value_by_category },
  { key: "channel", label: "Acquisition Channel", map: data.customer_value_by_channel },
  { key: "income", label: "Income Level", map: data.customer_value_by_income },
  { key: "device", label: "Device", map: data.customer_value_by_device },
  { key: "season", label: "Season", map: data.customer_value_by_season },
];

export default function CustomerValuePage() {
  const es = data.executive_summary;
  const [dimKey, setDimKey] = useState<DimensionKey>("segment");
  const dimension = DIMENSIONS.find((d) => d.key === dimKey)!;

  const entries = useMemo(
    () => Object.entries(dimension.map).sort((a, b) => b[1].revenue - a[1].revenue),
    [dimension]
  );

  const revenueData = entries.map(([name, v]) => ({ name, value: v.revenue }));
  const aovData = entries.map(([name, v]) => ({ name, value: v.aov }));
  const returnRateData = entries.map(([name, v]) => ({ name, value: v.return_rate }));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Business"
        title="Customer Value Analysis"
        description="A dashboard view of revenue, order value, return rate, profit margin, and repeat purchase behavior across the whole dataset and across each major breakdown dimension."
      />

      {/* Top-line KPIs */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Executive Summary</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Revenue" value={fmtINR(es.revenue)} accent="var(--status-good)" />
          <StatCard label="Orders" value={fmtNum(es.orders, 0)} />
          <StatCard label="Average Order Value" value={fmtINR(es.aov)} accent="var(--series-1)" />
          <StatCard label="Median Order Value" value={fmtINR(es.median_order_value)} />
          <StatCard label="Return Rate" value={fmtPct(es.return_rate)} accent="var(--status-serious)" />
          <StatCard label="Avg. Profit Margin" value={`${fmtNum(es.avg_profit_margin_pct, 1)}%`} />
          <StatCard label="Repeat Purchase Rate" value={fmtPct(es.repeat_customer_rate)} />
          <StatCard label="Conversion Rate" value={fmtPct(es.conversion_rate)} />
        </div>
      </section>

      {/* Breakdown selector */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Breakdown by Dimension</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a grouping dimension to compare value metrics across its categories.
            </p>
          </div>
          <Select value={dimKey} onValueChange={(v) => setDimKey(v as DimensionKey)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIMENSIONS.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by {dimension.label}</CardTitle>
              <CardDescription>Total revenue contributed by each group</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard data={revenueData} valueFormatter={(v) => fmtINR(v)} color="var(--series-1)" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AOV by {dimension.label}</CardTitle>
              <CardDescription>Average order value per group</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard data={aovData} valueFormatter={(v) => fmtINR(v)} color="var(--series-3)" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Return Rate by {dimension.label}</CardTitle>
              <CardDescription>Share of orders returned per group</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard data={returnRateData} valueFormatter={(v) => fmtPct(v)} color="var(--status-serious)" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full comparison table &mdash; {dimension.label}</CardTitle>
            <CardDescription>All value metrics for every group, sorted by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dimension.label}</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Unique Customers</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>AOV</TableHead>
                  <TableHead>Median Order Value</TableHead>
                  <TableHead>Return Rate</TableHead>
                  <TableHead>Avg. Margin</TableHead>
                  <TableHead>Repeat Rate</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(([name, v]) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtNum(v.sessions, 0)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtNum(v.unique_customers, 0)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtNum(v.orders, 0)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtINR(v.revenue)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtINR(v.aov)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtINR(v.median_order_value)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtPct(v.return_rate)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtNum(v.avg_profit_margin_pct, 1)}%</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtPct(v.repeat_customer_rate)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtPct(v.conversion_rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Distributions, not just averages */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Distributions, Not Just Averages</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AOV is a single number per segment, but it can hide very different underlying spreads. The box plot below
            shows the full order-value distribution (quartiles, whiskers, and outliers) for each behavioral segment.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Order value distribution by behavioral segment</CardTitle>
            <CardDescription>Quartiles, whiskers, and outliers per segment &mdash; not just the mean</CardDescription>
          </CardHeader>
          <CardContent>
            <BoxPlotChart groups={data.order_value_distribution_by_segment} valueFormatter={(v) => fmtINR(v, 0)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Two segments can share a similar AOV while one has a tight, predictable spread of order values and the
              other has a wide spread with high-value outliers pulling the mean up. Relying on AOV alone would treat
              these as identical when the underlying purchasing behavior &mdash; and the risk/opportunity profile &mdash;
              is materially different.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
