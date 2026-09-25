"use client";

import { useState } from "react";
import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { BusinessQuestionBlock, CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { BarChartCard } from "@/components/charts/bar-chart";
import { BoxPlotChart } from "@/components/charts/box-plot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NUMERIC_FIELDS: { key: keyof typeof data.descriptive_numeric; label: string }[] = [
  { key: "customer_age", label: "Customer Age" },
  { key: "session_duration_min", label: "Session Duration (min)" },
  { key: "pages_viewed", label: "Pages Viewed" },
  { key: "products_viewed", label: "Products Viewed" },
  { key: "searches", label: "Searches" },
  { key: "cart_items", label: "Cart Items" },
  { key: "estimated_delivery_days", label: "Estimated Delivery Days" },
  { key: "delivery_delay_days", label: "Delivery Delay Days" },
  { key: "engagement_score", label: "Engagement Score" },
];

const CATEGORICAL_SECTIONS: { key: keyof typeof data.descriptive_categorical; label: string; question: string }[] = [
  {
    key: "customer_segment",
    label: "Customer Segment",
    question: "What percentage of customers fall into each behavioral segment?",
  },
  {
    key: "income_level",
    label: "Income Level",
    question: "What percentage of customers fall into each income bracket?",
  },
  {
    key: "device",
    label: "Device",
    question: "What device do customers use to shop?",
  },
];

export default function DescriptivePage() {
  const [field, setField] = useState<(typeof NUMERIC_FIELDS)[number]["key"]>("session_duration_min");
  const ov = data.descriptive_order_value;
  const bq = data.business_questions_descriptive;
  const s = data.descriptive_numeric[field];
  const fieldLabel = NUMERIC_FIELDS.find((f) => f.key === field)!.label;

  const skewRatio = ov.mean / ov.median;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Data → Customer Behavior → Statistical Description"
        title="Descriptive Statistics"
        description="Summarizing the shape, center, and spread of session-level behavior and order value across 60,000 synthetic e-commerce sessions before any modeling is attempted."
      />

      {/* Opening business question */}
      <section>
        <BusinessQuestionBlock
          question="What does a typical order look like?"
          metric="Mean vs. median order value; modal category and device"
          observation={
            <>
              Mean order value is <strong>{fmtINR(ov.mean)}</strong> while the median is only{" "}
              <strong>{fmtINR(ov.median)}</strong> &mdash; the mean is about{" "}
              <strong>{fmtNum(skewRatio, 1)}&times;</strong> the median. The most common purchase category is{" "}
              <strong>{bq.modal_category}</strong>, and the most common device is <strong>{bq.modal_device}</strong>.
            </>
          }
          interpretation="Mean substantially exceeding median indicates a right-skewed (long-tailed) order value distribution: most orders are modest, but a minority of large orders pull the average upward. The median is the more representative 'typical order' figure here; the mode describes the single most frequent category/device rather than a central value."
          caveat="Order value here is computed only over purchased sessions (n = orders), not all sessions."
        />
      </section>

      {/* Numeric explorer */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Numeric Variable Explorer</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {NUMERIC_FIELDS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={field === f.key ? "default" : "outline"}
              onClick={() => setField(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Mean" value={fmtNum(s.mean)} accent="var(--series-1)" />
          <StatCard label="Median" value={fmtNum(s.median)} />
          <StatCard label="Std. Deviation" value={fmtNum(s.std)} />
          <StatCard label="IQR" value={fmtNum(s.iqr)} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{fieldLabel} &mdash; Full Summary</CardTitle>
            <CardDescription>n = {fmtNum(s.n, 0)} sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>n</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Median</TableHead>
                  <TableHead>Std</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Q1</TableHead>
                  <TableHead>Q2</TableHead>
                  <TableHead>Q3</TableHead>
                  <TableHead>IQR</TableHead>
                  <TableHead>P90</TableHead>
                  <TableHead>P95</TableHead>
                  <TableHead>P99</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{fmtNum(s.n, 0)}</TableCell>
                  <TableCell>{fmtNum(s.mean)}</TableCell>
                  <TableCell>{fmtNum(s.median)}</TableCell>
                  <TableCell>{fmtNum(s.std)}</TableCell>
                  <TableCell>{fmtNum(s.min)}</TableCell>
                  <TableCell>{fmtNum(s.max)}</TableCell>
                  <TableCell>{fmtNum(s.range)}</TableCell>
                  <TableCell>{fmtNum(s.q1)}</TableCell>
                  <TableCell>{fmtNum(s.q2)}</TableCell>
                  <TableCell>{fmtNum(s.q3)}</TableCell>
                  <TableCell>{fmtNum(s.iqr)}</TableCell>
                  <TableCell>{fmtNum(s.p90)}</TableCell>
                  <TableCell>{fmtNum(s.p95)}</TableCell>
                  <TableCell>{fmtNum(s.p99)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Categorical frequencies */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Categorical Frequencies</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {CATEGORICAL_SECTIONS.map((sec) => {
            const dist = Object.entries(data.descriptive_categorical[sec.key])
              .sort((a, b) => b[1].proportion - a[1].proportion)
              .map(([name, v]) => ({ name, value: v.proportion, n: v.count }));
            return (
              <Card key={sec.key}>
                <CardHeader>
                  <CardTitle>{sec.label} Distribution</CardTitle>
                  <CardDescription>{sec.question}</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChartCard data={dist} valueFormatter={(v) => fmtPct(v)} color="var(--series-3)" horizontal />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Outlier / box plot section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Order Value Spread & Outliers by Segment</h2>
        <Card>
          <CardHeader>
            <CardTitle>Order Value Distribution by Customer Segment</CardTitle>
            <CardDescription>Box shows Q1&ndash;Q3 (IQR); whiskers extend to the most extreme non-outlier values; dots are Tukey-fence outliers</CardDescription>
          </CardHeader>
          <CardContent>
            <BoxPlotChart groups={data.order_value_distribution_by_segment} valueFormatter={(v) => fmtINR(v, 0)} />
          </CardContent>
        </Card>

        <BusinessQuestionBlock
          question="What customers lie beyond the IQR-based outlier thresholds?"
          metric="Tukey fences: lower = Q1 − 1.5·IQR, upper = Q3 + 1.5·IQR"
          observation={
            <>
              For order value, Q1 = {fmtINR(ov.q1)}, Q3 = {fmtINR(ov.q3)}, IQR = {fmtINR(ov.iqr)}, giving an upper
              fence of <strong>{fmtINR(ov.outlier_upper_bound)}</strong> (the lower fence,{" "}
              {fmtINR(ov.outlier_lower_bound)}, is negative and therefore non-binding since order values cannot be
              negative). <strong>{fmtNum(ov.n_outliers, 0)}</strong> orders ({fmtPct(ov.pct_outliers)}) exceed this
              upper fence. A sample of the largest outlier values includes{" "}
              {data.order_value_outliers_sample.slice(0, 6).map((v, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {fmtINR(v)}
                </span>
              ))}
              .
            </>
          }
          interpretation="These are statistically extreme orders relative to the bulk of the distribution, not necessarily errors. They likely correspond to bulk purchases, high-value electronics/fashion baskets, or premium customers, and merit separate treatment in AOV or revenue-per-session calculations since they can dominate the mean."
          caveat="Tukey fences are a heuristic convention (1.5×IQR), not a statistical test of anomaly; some of these are legitimate large orders."
        />
      </section>

      {/* Business questions block */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Order Value Thresholds</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <BusinessQuestionBlock
            question="What proportion of orders fall below ₹1,000?"
            metric="P(order_value < 1000)"
            observation={<><strong>{fmtPct(bq.pct_orders_below_1000)}</strong> of orders are below ₹1,000.</>}
            interpretation={
              <>
                A substantial share of purchases are low-ticket, consistent with the median ({fmtINR(ov.median, 0)})
                sitting well under the mean and reinforcing the right-skew story above.
              </>
            }
            caveat="This is a simple threshold count on the observed sample, not a forecast of future order mix."
          />
          <BusinessQuestionBlock
            question="What proportion of orders fall above ₹5,000?"
            metric="P(order_value > 5000)"
            observation={<><strong>{fmtPct(bq.pct_orders_above_5000)}</strong> of orders exceed ₹5,000.</>}
            interpretation="Roughly one in five orders is a high-ticket purchase; these disproportionately drive total revenue even though they are a minority of transactions, which is typical of skewed value distributions in e-commerce."
            caveat="Category or seasonal mix shifts could change this proportion; it is a snapshot of the current sample."
          />
        </div>
      </section>

      {/* Explain levels */}
      <section className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Percentiles, Quartiles &amp; IQR</CardTitle>
          </CardHeader>
          <CardContent>
            <ExplainLevels
              simple="A percentile tells you what fraction of values fall below a point. The median (50th percentile) splits the data in half. Quartiles split the data into four equal chunks (Q1 = 25th percentile, Q2 = median, Q3 = 75th percentile). The interquartile range (IQR = Q3 − Q1) captures where the 'middle half' of the data sits, ignoring extreme values."
              math={
                <FormulaBlock label="Definitions">
                  {`P_k = value below which k% of observations fall
Q1 = P25, Q2 = P50 (median), Q3 = P75
IQR = Q3 − Q1
Outlier fences: [Q1 − 1.5·IQR, Q3 + 1.5·IQR]`}
                </FormulaBlock>
              }
              applied={
                <>
                  For order value in this dataset: Q1 = {fmtINR(ov.q1)}, Q2 (median) = {fmtINR(ov.q2)}, Q3 ={" "}
                  {fmtINR(ov.q3)}, so IQR = {fmtINR(ov.iqr)}. The 90th/95th/99th percentiles are {fmtINR(ov.p90)},{" "}
                  {fmtINR(ov.p95)}, and {fmtINR(ov.p99)} respectively &mdash; the large jump from P90 to P99 is
                  further evidence of the long right tail already visible in the mean/median gap.
                </>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outlier Detection (Tukey Fences)</CardTitle>
          </CardHeader>
          <CardContent>
            <ExplainLevels
              simple="Tukey's method flags a value as an outlier if it's 'too far' from the middle 50% of the data — specifically, more than 1.5 times the IQR beyond Q1 or Q3. It's a simple, distribution-free rule of thumb used to spot unusually small or large values worth a closer look."
              math={
                <FormulaBlock label="Tukey fences">
                  {`lower_fence = Q1 − 1.5 × IQR
upper_fence = Q3 + 1.5 × IQR
outlier if x < lower_fence  OR  x > upper_fence`}
                </FormulaBlock>
              }
              applied={
                <>
                  For order value: lower fence = {fmtINR(ov.outlier_lower_bound)} (non-binding, since it&apos;s negative)
                  and upper fence = {fmtINR(ov.outlier_upper_bound)}. This flags {fmtNum(ov.n_outliers, 0)} of{" "}
                  {fmtNum(ov.n, 0)} orders ({fmtPct(ov.pct_outliers)}) as statistical outliers &mdash; visible as the
                  scattered points above each box in the chart above.
                </>
              }
            />
          </CardContent>
        </Card>
      </section>

      <CaveatNote>
        All figures on this page are computed from a 60,000-row <strong>synthetic</strong> e-commerce sessions
        dataset generated for this project. Distribution shapes (e.g. right-skew in order value) are realistic of
        e-commerce data generally, but exact percentile values, outlier counts, and category/device splits are
        specific to this sample and should not be read as real market statistics.
      </CaveatNote>
    </div>
  );
}
