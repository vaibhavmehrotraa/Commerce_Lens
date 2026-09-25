"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { StatCard } from "@/components/viz/stat-card";
import { BarChartCard } from "@/components/charts/bar-chart";
import { BoxPlotChart } from "@/components/charts/box-plot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const es = data.executive_summary;
  const funnel = data.funnel;

  const funnelData = [
    { name: "Sessions", value: funnel.sessions },
    { name: "Viewed Products", value: funnel.viewed_products },
    { name: "Added to Cart", value: funnel.added_to_cart },
    { name: "Purchased", value: funnel.purchased },
  ];

  const segmentData = Object.entries(data.conversion_by_segment)
    .sort((a, b) => b[1].rate - a[1].rate)
    .map(([name, v]) => ({ name, value: v.rate }));

  const segmentDist = Object.entries(data.segment_distribution).map(([name, v]) => ({
    name,
    value: v.proportion,
  }));

  const topAssociations = [
    { label: "Add to Cart → Purchase", value: data.probability_engine.P_purchase_given_cart, base: data.probability_engine.P_purchase },
    { label: "Discount Exposed → Purchase", value: data.association.discount_x_purchase["True"]?.rate ?? 0, base: data.probability_engine.P_purchase },
    { label: "Returning Customer → Purchase", value: data.probability_engine.P_purchase_given_returning, base: data.probability_engine.P_purchase },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="border-b border-border pb-10">
        <Badge variant="secondary" className="mb-4">
          Business Analytics &middot; Statistics &middot; Probability &middot; Data Visualization
        </Badge>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          CommerceLens: E-commerce Purchase, Customer Value & Probability Intelligence
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Treating {fmtNum(data.dataset_meta.n_rows, 0)} customer shopping sessions as a probability problem &mdash;
          from descriptive statistics through conditional probability, Bayes&rsquo; theorem, and distribution
          modeling &mdash; to support real targeting and operational decisions. Every number on this site is
          computed live from the underlying dataset.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/case-study" className={buttonVariants({})}>
            Read the case study <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link href="/probability" className={buttonVariants({ variant: "outline" })}>
            Explore the Probability Engine
          </Link>
          <Link href="/data-explorer" className={buttonVariants({ variant: "outline" })}>
            Open Data Explorer
          </Link>
        </div>
      </section>

      {/* KPI row */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Executive Summary</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Sessions" value={fmtNum(es.sessions, 0)} />
          <StatCard label="Unique Customers" value={fmtNum(es.unique_customers, 0)} />
          <StatCard label="Conversion Rate" value={fmtPct(es.conversion_rate)} accent="var(--series-1)" />
          <StatCard label="Revenue" value={fmtINR(es.revenue)} accent="var(--status-good)" />
          <StatCard label="Average Order Value" value={fmtINR(es.aov)} />
          <StatCard label="Median Order Value" value={fmtINR(es.median_order_value)} />
          <StatCard label="Return Rate" value={fmtPct(es.return_rate)} accent="var(--status-serious)" />
          <StatCard label="Repeat Customer Rate" value={fmtPct(es.repeat_customer_rate)} />
        </div>
      </section>

      {/* Funnel + segment distribution */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Funnel</CardTitle>
            <CardDescription>Sessions &rarr; product views &rarr; cart &rarr; purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard
              data={funnelData}
              valueFormatter={(v) => fmtNum(v, 0)}
              color="var(--series-1)"
              horizontal
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {fmtPct(funnel.purchased / funnel.sessions)} of sessions end in a purchase, and{" "}
              {fmtPct(data.probability_engine.P_purchase_given_cart)} of sessions that add to cart go on to
              purchase (P(Purchase | Cart)). Purchases don&rsquo;t strictly require a cart step in this dataset
              &mdash; some sessions convert directly &mdash; which is why the last bar isn&rsquo;t a subset of the
              third.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segment Distribution</CardTitle>
            <CardDescription>Share of sessions by behavioral segment (rule-based, not ML)</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={segmentDist} valueFormatter={(v) => fmtPct(v)} color="var(--series-3)" />
          </CardContent>
        </Card>
      </section>

      {/* Order value distribution */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Order Value Distribution</CardTitle>
            <CardDescription>
              Quartiles, whiskers, and outliers per behavioral segment &mdash; not just the mean order value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BoxPlotChart groups={data.order_value_distribution_by_segment} valueFormatter={(v) => fmtINR(v, 0)} />
            <p className="mt-2 text-xs text-muted-foreground">
              Median order value across the dataset is {fmtINR(es.median_order_value)}, versus a mean (AOV) of{" "}
              {fmtINR(es.aov)} &mdash; see{" "}
              <Link href="/descriptive" className="underline underline-offset-2">
                Descriptive Statistics
              </Link>{" "}
              for the full breakdown.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Conversion by segment + associations */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversion by Customer Segment</CardTitle>
            <CardDescription>P(Purchase | Segment) &mdash; an observational relationship</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={segmentData} valueFormatter={(v) => fmtPct(v)} color="var(--series-2)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Behavioral Associations with Purchase</CardTitle>
            <CardDescription>Conditional purchase probability vs. the baseline rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topAssociations.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{a.label}</span>
                  <span className="font-mono tabular-nums">
                    {fmtPct(a.value)} <span className="text-muted-foreground">vs {fmtPct(a.base)} baseline</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (a.value / Math.max(a.value, a.base, 0.01)) * 100)}%`, backgroundColor: "var(--series-1)" }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              These are observational, conditional relationships in the dataset &mdash; see{" "}
              <Link href="/association" className="underline underline-offset-2">
                Association
              </Link>{" "}
              for the full analysis and the correlation-vs-causation caveat.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Probability + distribution insight teasers */}
      <section className="grid gap-6 lg:grid-cols-3">
        <TeaserCard
          href="/probability"
          title="Probability Engine"
          value={fmtPct(data.probability_engine.P_purchase_given_cart)}
          label="P(Purchase | Add to Cart)"
        />
        <TeaserCard
          href="/binomial"
          title="Conversion Forecast"
          value={fmtNum(data.binomial_default.summary.mean, 1)}
          label={`Expected conversions per ${data.binomial_default.n} sessions`}
        />
        <TeaserCard
          href="/customer-value"
          title="Customer Value"
          value={fmtINR(data.customer_value_by_segment["Loyal"]?.aov ?? 0)}
          label="Average order value, Loyal segment"
        />
      </section>

      {/* Storyline */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">How this project is structured</h2>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:grid-cols-7">
          {["Data", "Customer Behavior", "Statistical Description", "Association", "Probability", "Uncertainty", "Business Decision"].map(
            (step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex h-full items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: "var(--series-1)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight className="hidden h-3.5 w-3.5 text-muted-foreground lg:block" />}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

function TeaserCard({ href, title, value, label }: { href: string; title: string; value: string; label: string }) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            {title}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--series-1)" }}>
            {value}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
