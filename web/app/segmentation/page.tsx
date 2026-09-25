"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { FormulaBlock } from "@/components/viz/formula-block";
import { CaveatNote } from "@/components/viz/business-question";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BEHAVIOR_ORDER = ["New", "Occasional", "Regular", "Loyal"];

export default function SegmentationPage() {
  const segmentDist = BEHAVIOR_ORDER.filter((s) => data.segment_distribution[s]).map((name) => ({
    name,
    value: data.segment_distribution[name].proportion,
    n: data.segment_distribution[name].count,
  }));

  const valueSegOrder = ["High Value", "Mid Value", "Low Value", "No Purchase Yet"];
  const valueSegDist = valueSegOrder
    .filter((s) => data.value_segment_distribution[s])
    .map((name) => ({
      name,
      value: data.value_segment_distribution[name].proportion,
      n: data.value_segment_distribution[name].count,
    }));

  const conversionBySegment = BEHAVIOR_ORDER.filter((s) => data.conversion_by_segment[s]).map((name) => ({
    name,
    value: data.conversion_by_segment[name].rate,
    n: data.conversion_by_segment[name].n,
  }));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Customer Segmentation"
        title="Customer Segmentation"
        badge="Rule-based, not ML"
        description="Every segment on this page is assigned by an explicit, documented rule applied to historical customer fields at dataset-generation time — not by an unsupervised clustering model. The rule for each scheme is stated in full below, so every downstream number can be traced back to a definition, not a black box."
      />

      {/* Scheme 1: behavioral segment */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Behavioral Segment &mdash; <code className="text-base font-normal text-muted-foreground">customer_segment</code></h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on each customer&rsquo;s historical order count (<code>previous_orders</code>) at the time of the session.
          </p>
        </div>
        <FormulaBlock label="Assignment rule">
{`previous_orders == 0        →  "New"
previous_orders 1–2         →  "Occasional"
previous_orders 3–7         →  "Regular"
previous_orders 8+          →  "Loyal"`}
        </FormulaBlock>
        <Card>
          <CardHeader>
            <CardTitle>Distribution of sessions by behavioral segment</CardTitle>
            <CardDescription>Share of the {fmtNum(data.dataset_meta.n_rows, 0)}-session dataset in each segment</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={segmentDist} valueFormatter={(v) => fmtPct(v)} color="var(--series-1)" />
          </CardContent>
        </Card>
      </section>

      {/* Scheme 2: value segment */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Value Segment &mdash; <code className="text-base font-normal text-muted-foreground">customer_value_segment</code></h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on each customer&rsquo;s total spend in the dataset window (<code>customer_total_spend</code>), by quartile.
          </p>
        </div>
        <FormulaBlock label="Assignment rule">
{`customer_total_spend ≥ 75th percentile             →  "High Value"
customer_total_spend ≥ 40th percentile (< 75th)     →  "Mid Value"
0 < customer_total_spend < 40th percentile          →  "Low Value"
customer_total_spend == 0 (no purchases)            →  "No Purchase Yet"`}
        </FormulaBlock>
        <Card>
          <CardHeader>
            <CardTitle>Distribution of sessions by value segment</CardTitle>
            <CardDescription>Share of sessions whose customer falls in each spend tier</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={valueSegDist} valueFormatter={(v) => fmtPct(v)} color="var(--series-4)" />
          </CardContent>
        </Card>
      </section>

      {/* Segment profile comparison */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Segment Profile Comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How the behavioral segments differ on value and conversion metrics, computed directly from sessions in each segment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversion rate by behavioral segment</CardTitle>
            <CardDescription>P(Purchase | Segment) &mdash; an observational relationship, not a causal one</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={conversionBySegment} valueFormatter={(v) => fmtPct(v)} color="var(--series-2)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full metric comparison</CardTitle>
            <CardDescription>All value metrics side by side, by behavioral segment</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>AOV</TableHead>
                  <TableHead>Median Order Value</TableHead>
                  <TableHead>Return Rate</TableHead>
                  <TableHead>Repeat Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BEHAVIOR_ORDER.filter((s) => data.customer_value_by_segment[s]).map((seg) => {
                  const v = data.customer_value_by_segment[seg];
                  const conv = data.conversion_by_segment[seg];
                  return (
                    <TableRow key={seg}>
                      <TableCell className="font-medium">{seg}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtNum(v.sessions, 0)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtPct(conv?.rate ?? v.conversion_rate)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtINR(v.revenue)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtINR(v.aov)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtINR(v.median_order_value)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtPct(v.return_rate)}</TableCell>
                      <TableCell className="font-mono tabular-nums">{fmtPct(v.repeat_customer_rate)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <CaveatNote>
          Loyal-segment sessions convert at a higher rate ({fmtPct(data.conversion_by_segment["Loyal"]?.rate ?? 0)}) than
          New-segment sessions ({fmtPct(data.conversion_by_segment["New"]?.rate ?? 0)}) in this dataset. Because the segment
          itself is defined by past purchase history, this observational difference partly reflects existing tenure and
          trust rather than proof that any given intervention would move a New customer to Loyal-level conversion.
        </CaveatNote>
      </section>

      {/* Link to data explorer */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium">Want to slice further?</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              These segment definitions are fixed rules, but you can explore how they interact with age, income, device,
              acquisition channel, category, purchase status, and return status ad hoc in the Data Explorer.
            </p>
          </div>
          <Link href="/data-explorer" className={buttonVariants({ variant: "outline" })}>
            Open Data Explorer <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
