"use client";

import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { BusinessQuestionBlock, CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { BarChartCard } from "@/components/charts/bar-chart";
import { ScatterChartCard } from "@/components/charts/scatter-chart";
import { BoxPlotChart } from "@/components/charts/box-plot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ASSOC_NOT_CAUSATION =
  "This is an observational, cross-sectional association in the dataset — it does not establish that this factor causes purchase behavior. Confounding variables (e.g. customer intent, price, timing) could drive both.";

function groupRateData(map: Record<string, { rate: number; n: number }>) {
  return Object.entries(map)
    .sort((a, b) => b[1].rate - a[1].rate)
    .map(([name, v]) => ({ name, value: v.rate, n: v.n }));
}

function strength(r: number) {
  const a = Math.abs(r);
  if (a < 0.1) return "negligible";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  return "strong";
}

function direction(r: number) {
  if (r > 0.02) return "positive";
  if (r < -0.02) return "negative";
  return "essentially no";
}

export default function AssociationPage() {
  const a = data.association;

  const numericPairs = [
    {
      key: "duration_x_products",
      title: "Session Duration vs. Products Viewed",
      question: "Do longer sessions tend to view more products?",
      d: a.duration_x_products,
      xLabel: "Session Duration (min)",
      yLabel: "Products Viewed",
      xFmt: (v: number) => v.toFixed(1),
      yFmt: (v: number) => v.toFixed(0),
    },
    {
      key: "products_viewed_x_order_value",
      title: "Products Viewed vs. Order Value",
      question: "Do customers who view more products end up placing larger orders?",
      d: a.products_viewed_x_order_value,
      xLabel: "Products Viewed",
      yLabel: "Order Value (₹)",
      xFmt: (v: number) => v.toFixed(0),
      yFmt: (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`,
    },
    {
      key: "previous_orders_x_total_spend",
      title: "Previous Orders vs. Total Customer Spend",
      question: "Do customers with more past orders have higher lifetime spend?",
      d: a.previous_orders_x_total_spend,
      xLabel: "Previous Orders",
      yLabel: "Total Spend (₹)",
      xFmt: (v: number) => v.toFixed(0),
      yFmt: (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`,
    },
  ] as const;

  const featuredCategorical = [
    {
      key: "device_x_purchase",
      title: "Device Type vs. Purchase Rate",
      question: "Does the device customers shop on relate to whether they purchase?",
      map: a.device_x_purchase,
    },
    {
      key: "income_x_purchase",
      title: "Income Level vs. Purchase Rate",
      question: "Does income level relate to purchase conversion?",
      map: a.income_x_purchase,
    },
    {
      key: "discount_x_purchase",
      title: "Discount Exposure vs. Purchase Rate",
      question: "Are customers exposed to a discount more likely to purchase?",
      map: a.discount_x_purchase,
    },
  ] as const;

  const moreCategorical = [
    {
      key: "segment_x_purchase",
      title: "Customer Segment vs. Purchase Rate",
      question: "How does behavior (purchase likelihood) differ across customer segments?",
      map: a.segment_x_purchase,
    },
    {
      key: "channel_x_purchase",
      title: "Acquisition Channel vs. Purchase Rate",
      question: "Does the acquisition channel a session came from relate to whether it converts?",
      map: a.channel_x_purchase,
    },
    {
      key: "campaign_x_purchase",
      title: "Campaign Exposure vs. Purchase Rate",
      question: "Are customers exposed to a marketing campaign more likely to purchase?",
      map: a.campaign_x_purchase,
    },
  ] as const;

  const segmentOrderValue = data.customer_value_by_segment;
  const segmentAovRows = Object.entries(segmentOrderValue)
    .sort((a2, b2) => b2[1].aov - a2[1].aov)
    .map(([name, v]) => ({ name, value: v.aov }));
  const topAovSegment = segmentAovRows[0];
  const bottomAovSegment = segmentAovRows[segmentAovRows.length - 1];

  const deviceCols = ["Desktop", "Mobile", "Tablet"];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Data → Customer Behavior → Association"
        title="Association"
        description="Measuring how pairs of variables move together — conditional purchase rates across groups, and correlation between numeric behaviors. Every relationship here is observational: association, not causation."
      />

      {/* Categorical x purchase */}
      <section className="space-y-6">
        <h2 className="text-lg font-medium">Group-Level Purchase Rates</h2>
        {featuredCategorical.map((sec) => {
          const rows = groupRateData(sec.map);
          const top = rows[0];
          const bottom = rows[rows.length - 1];
          return (
            <div key={sec.key} className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{sec.title}</CardTitle>
                  <CardDescription>P(Purchase | Group)</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChartCard data={rows} valueFormatter={(v) => fmtPct(v)} color="var(--series-2)" />
                </CardContent>
              </Card>
              <BusinessQuestionBlock
                question={sec.question}
                metric="Conditional purchase rate, P(Purchase | Group)"
                observation={
                  <>
                    <strong>{top.name}</strong> converts at {fmtPct(top.value)} (n = {fmtNum(top.n ?? 0, 0)}) versus{" "}
                    <strong>{bottom.name}</strong> at {fmtPct(bottom.value)} (n = {fmtNum(bottom.n ?? 0, 0)}) — a gap
                    of {fmtPct(top.value - bottom.value)}.
                  </>
                }
                interpretation={`Purchase likelihood clearly differs across ${sec.title.split(" vs.")[0].toLowerCase()} groups in this sample, which is useful for targeting and channel/segment prioritization.`}
                caveat={ASSOC_NOT_CAUSATION}
              />
            </div>
          );
        })}
      </section>

      {/* More associations accordion */}
      <section>
        <h2 className="mb-4 text-lg font-medium">More Associations with Purchase</h2>
        <Accordion>
          {moreCategorical.map((sec) => {
            const rows = groupRateData(sec.map);
            const top = rows[0];
            const bottom = rows[rows.length - 1];
            return (
              <AccordionItem key={sec.key} value={sec.key}>
                <AccordionTrigger>{sec.title}</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <BarChartCard data={rows} valueFormatter={(v) => fmtPct(v)} color="var(--series-4)" horizontal />
                  <BusinessQuestionBlock
                    question={sec.question}
                    metric="Conditional purchase rate, P(Purchase | Group)"
                    observation={
                      <>
                        <strong>{top.name}</strong> converts at {fmtPct(top.value)} (n = {fmtNum(top.n ?? 0, 0)})
                        versus <strong>{bottom.name}</strong> at {fmtPct(bottom.value)} (n ={" "}
                        {fmtNum(bottom.n ?? 0, 0)}) — a gap of {fmtPct(top.value - bottom.value)}.
                      </>
                    }
                    interpretation={`Purchase likelihood clearly differs across ${sec.title.split(" vs.")[0].toLowerCase()} groups in this sample, which is useful for targeting and prioritization decisions.`}
                    caveat={ASSOC_NOT_CAUSATION}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* Categorical x numerical */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Categorical × Numerical: Segment vs. Order Value</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Value Distribution by Customer Segment</CardTitle>
              <CardDescription>Box plot: numerical variable (order value) split by categorical group (segment)</CardDescription>
            </CardHeader>
            <CardContent>
              <BoxPlotChart groups={data.order_value_distribution_by_segment} valueFormatter={(v) => fmtINR(v, 0)} />
            </CardContent>
          </Card>
          <BusinessQuestionBlock
            question="Does typical order value differ across customer segments?"
            metric="Mean order value (AOV) by segment, ₹"
            observation={
              <>
                <strong>{topAovSegment.name}</strong> customers have the highest average order value at{" "}
                <strong>{fmtINR(topAovSegment.value, 0)}</strong>, versus <strong>{bottomAovSegment.name}</strong> at{" "}
                {fmtINR(bottomAovSegment.value, 0)} — a difference of{" "}
                {fmtINR(topAovSegment.value - bottomAovSegment.value, 0)}. The box plot shows the full spread (Q1
                &ndash;Q3, median, and outliers) behind each of these segment averages.
              </>
            }
            interpretation="Segment membership is associated with meaningfully different typical basket sizes, not just different conversion rates — useful for tailoring merchandising or promotions by segment."
            caveat={ASSOC_NOT_CAUSATION}
          />
        </div>
      </section>

      {/* Numeric x numeric */}
      <section className="space-y-8">
        <h2 className="text-lg font-medium">Numeric Correlations</h2>
        {numericPairs.map((p) => (
          <div key={p.key} className="space-y-4">
            <BusinessQuestionBlock
              question={p.question}
              metric="Covariance, Pearson correlation coefficient (r), and OLS fitted line"
              observation={
                <>
                  cov(X, Y) = <strong>{p.d.covariance.toFixed(3)}</strong>, r ={" "}
                  <strong>{p.d.correlation.toFixed(3)}</strong>, fitted line y = {p.d.fitted_line.slope.toFixed(3)}
                  ·x + {p.d.fitted_line.intercept.toFixed(2)}, R&sup2; = {p.d.fitted_line.r_squared.toFixed(3)}.
                </>
              }
              interpretation={`A ${direction(p.d.correlation)} relationship of ${strength(p.d.correlation)} strength: as ${p.xLabel.toLowerCase()} increases, ${p.yLabel.toLowerCase()} tends to ${p.d.correlation > 0 ? "increase" : p.d.correlation < 0 ? "decrease" : "show no consistent change"} on average, though R² = ${p.d.fitted_line.r_squared.toFixed(3)} means the linear fit explains only ${fmtPct(p.d.fitted_line.r_squared)} of the variance — most of the spread is unexplained by this single variable.`}
              caveat={ASSOC_NOT_CAUSATION}
            />
            <Card>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
                <CardDescription>
                  Sampled points with ordinary least-squares fitted line overlay (n = {p.d.scatter.x.length} plotted)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScatterChartCard
                  points={p.d.scatter.x.map((xi, i) => ({ x: xi, y: p.d.scatter.y[i] }))}
                  fittedLine={p.d.fitted_line}
                  xLabel={p.xLabel}
                  yLabel={p.yLabel}
                  xFormatter={p.xFmt}
                  yFormatter={p.yFmt}
                />
              </CardContent>
            </Card>
          </div>
        ))}
      </section>

      {/* Category x device table */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Category × Device (Relative Frequency)</h2>
        <Card>
          <CardHeader>
            <CardTitle>Device Share within Each Purchase Category</CardTitle>
            <CardDescription>Row percentages: P(Device | Category)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  {deviceCols.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(a.category_x_device.row_relative_freq).map(([cat, row]) => (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    {deviceCols.map((c) => (
                      <TableCell key={c}>{fmtPct(row[c] ?? 0)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-sm text-muted-foreground">
              Device share is remarkably stable across categories — Mobile accounts for roughly 68&ndash;69% of
              sessions in every category, with Desktop around 24% and Tablet around 7%. This near-uniformity is
              itself informative: it suggests device choice is driven by a customer&rsquo;s general shopping habit
              rather than the specific product category being browsed, i.e. category and device appear close to
              independent in this sample.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Explain levels: correlation */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Correlation</CardTitle>
          </CardHeader>
          <CardContent>
            <ExplainLevels
              simple="Correlation measures how strongly two numeric variables move together, on a scale from -1 to +1. Close to +1 means they rise together; close to -1 means one rises as the other falls; close to 0 means little to no linear relationship. It never tells you which variable, if either, is causing the other to change."
              math={
                <FormulaBlock label="Pearson correlation coefficient">
                  {`r = cov(X, Y) / (σx · σy)

where cov(X, Y) = E[(X − μx)(Y − μy)]
      σx, σy = standard deviations of X and Y`}
                </FormulaBlock>
              }
              applied={
                <>
                  For session duration vs. products viewed, r = {a.duration_x_products.correlation.toFixed(3)} — a
                  {" "}{strength(a.duration_x_products.correlation)} positive relationship, the strongest of the three
                  numeric pairs examined on this page. By contrast, products viewed vs. order value has r ={" "}
                  {a.products_viewed_x_order_value.correlation.toFixed(3)}, essentially no linear relationship in
                  this sample.
                </>
              }
            />
          </CardContent>
        </Card>
      </section>

      <CaveatNote>
        Every association on this page — categorical group-rate comparisons and numeric correlations alike — is an
        <strong> observational relationship</strong> computed on a synthetic sample. None of it should be read as
        evidence that one variable causes another; confounders, sampling, and the synthetic data-generating process
        can all produce apparent associations that would not hold, or would hold differently, in a controlled
        experiment or a different population.
      </CaveatNote>
    </div>
  );
}
