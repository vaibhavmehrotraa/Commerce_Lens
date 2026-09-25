"use client";

import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { BusinessQuestionBlock, CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { BarChartCard } from "@/components/charts/bar-chart";
import { LineChartCard } from "@/components/charts/line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RandomVariablesPage() {
  const rv = data.random_variable_items_purchased;
  const ev = data.expectation_variance;
  const ber = data.bernoulli;

  const pmfData = Object.entries(rv.pmf)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, p]) => ({ name: k, value: p }));

  const cdfRows = Object.entries(rv.cdf)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, p]) => ({ x: Number(k), cdf: p }));

  // Dynamically locate the pair of segments whose means are closest together
  // relative to how far apart their standard deviations are -- i.e. the pair
  // that best illustrates "similar average value, very different variability".
  const segEntries = Object.entries(ev.segment_value_mean_var_std);
  let bestPair: [string, string] = [segEntries[0][0], segEntries[1]?.[0] ?? segEntries[0][0]];
  let bestScore = -Infinity;
  for (let i = 0; i < segEntries.length; i++) {
    for (let j = i + 1; j < segEntries.length; j++) {
      const [nameA, a] = segEntries[i];
      const [nameB, b] = segEntries[j];
      const meanDiff = Math.abs(a.mean - b.mean);
      const stdDiff = Math.abs(a.std - b.std);
      // Reward a large std gap relative to a small mean gap.
      const score = stdDiff / (meanDiff + 1);
      if (score > bestScore) {
        bestScore = score;
        bestPair = [nameA, nameB];
      }
    }
  }
  const [pairA, pairB] = bestPair;
  const statA = ev.segment_value_mean_var_std[pairA];
  const statB = ev.segment_value_mean_var_std[pairB];
  const pairMeanDiffPct = Math.abs(statA.mean - statB.mean) / Math.max(statA.mean, statB.mean);
  const pairStdRatio = Math.max(statA.std, statB.std) / Math.min(statA.std, statB.std);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Random Variables & Uncertainty"
        title="Random Variables"
        description="A random variable assigns a number to the outcome of an uncertain process. X = items_purchased (per purchasing session) is discrete: it can only take a finite, countable set of values (1, 2, 3, …). Y = number of purchases generated in N sessions is also discrete, and is treated fully below (as an expected value here, and as a full probability model on the Conversion Forecast Simulator). Z = order_value is continuous: it can take any value in a range, not just whole numbers. All three are studied here directly from the observed dataset."
      />

      {/* PMF */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Probability Mass Function &mdash; Items Purchased</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>PMF of X = Items Purchased</CardTitle>
              <CardDescription>P(X = k) for each observed item count k, among purchasing sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard data={pmfData} valueFormatter={(v) => fmtPct(v)} color="var(--series-1)" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3 content-start lg:grid-cols-1">
            <StatCard label="Expected Value E[X]" value={fmtNum(rv.expected_value)} accent="var(--series-1)" sublabel="items" />
            <StatCard label="Variance" value={fmtNum(rv.variance)} />
            <StatCard label="Std. Deviation" value={fmtNum(rv.std)} sublabel="items" />
          </div>
        </div>
      </section>

      {/* CDF */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Cumulative Distribution Function</h2>
        <Card>
          <CardHeader>
            <CardTitle>CDF of X = Items Purchased</CardTitle>
            <CardDescription>F(k) = P(X &le; k)</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChartCard
              x="x"
              series={[{ key: "cdf", label: "F(k) = P(X ≤ k)", color: "var(--series-2)" }]}
              data={cdfRows}
              xFormatter={(v) => fmtNum(v, 0)}
              yFormatter={(v) => fmtPct(v, 0)}
            />
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          The PMF answers &ldquo;what is the probability X is <em>exactly</em> k?&rdquo; The CDF answers &ldquo;what
          is the probability X is <em>at most</em> k?&rdquo; A CDF is always monotonically non-decreasing and climbs
          to 1 as k reaches the largest possible value &mdash; here F(9) = {fmtPct(rv.cdf["9"] ?? 1, 1)}, since almost
          every purchasing session buys 9 items or fewer.
        </p>

        <ExplainLevels
          simple="The PMF is a lookup table of exact probabilities for each possible outcome. The CDF is a running total of those probabilities, so it tells you the chance of landing at or below a given value — useful for questions like 'what share of purchases involve 3 items or fewer?'"
          math={
            <FormulaBlock label="Definitions">
              {`PMF: P(X = x)
CDF: F(x) = P(X ≤ x) = Σ P(X = t)  for all t ≤ x
Properties: 0 ≤ F(x) ≤ 1, F is non-decreasing, F(max) = 1`}
            </FormulaBlock>
          }
          applied={
            <>
              For items purchased, P(X = 1) = {fmtPct(rv.pmf["1"])} is the single most likely outcome, and the CDF
              shows F(2) = {fmtPct(rv.cdf["2"])} &mdash; meaning roughly {fmtPct(rv.cdf["2"])} of purchasing sessions
              buy two items or fewer. Basket-size targeting (e.g. bundle offers) can use F(k) directly to estimate
              what share of customers a given basket-size threshold would reach.
            </>
          }
        />
      </section>

      {/* Expected value */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Expected Business Value</h2>
        <p className="text-sm text-muted-foreground">
          Expected value is a probability-weighted average of all possible outcomes &mdash; the long-run average you
          would see if the same random process repeated many, many times. It is <strong>not</strong> a prediction or
          guarantee for any single session or customer; an individual purchase could easily land above or below it.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard
            label="Expected Items / Purchase"
            value={fmtNum(ev.expected_items_per_purchase)}
            accent="var(--series-1)"
          />
          <StatCard label="Expected Order Value" value={fmtINR(ev.expected_order_value)} accent="var(--status-good)" />
          <StatCard
            label="Expected Conversions / 1,000 Sessions — E[Y]"
            value={fmtNum(ev.expected_conversions_per_1000_sessions, 1)}
          />
        </div>
        <BusinessQuestionBlock
          question="If we ran 1,000 fresh sessions through today's funnel, how many would we expect to convert?"
          metric="E[conversions per 1,000 sessions] = 1,000 × P(purchase)"
          observation={
            <>
              About <strong>{fmtNum(ev.expected_conversions_per_1000_sessions, 0)}</strong> conversions per 1,000
              sessions, on average.
            </>
          }
          interpretation="This is a planning figure for capacity and revenue forecasting, not a promise about any specific batch of 1,000 sessions — actual outcomes will vary around this average, sometimes considerably (see the Binomial simulator for how much)."
          caveat="Assumes future sessions behave like the historical sample; changes in traffic mix, pricing, or seasonality would shift the true probability."
        />
      </section>

      {/* Variance & SD */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Variance &amp; Standard Deviation by Segment</h2>
        <p className="text-sm text-muted-foreground">
          Two segments can have a very similar <em>average</em> order value while behaving completely differently in
          practice, if one is far more variable than the other. The table below compares mean, variance, standard
          deviation, and sample size for every customer segment.
        </p>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Mean Order Value</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Std. Deviation</TableHead>
                  <TableHead>n</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segEntries.map(([name, s]) => (
                  <TableRow
                    key={name}
                    className={name === pairA || name === pairB ? "bg-secondary/60" : undefined}
                  >
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>{fmtINR(s.mean)}</TableCell>
                    <TableCell>{fmtNum(s.variance, 0)}</TableCell>
                    <TableCell>{fmtINR(s.std)}</TableCell>
                    <TableCell>{fmtNum(s.n, 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <BusinessQuestionBlock
          question="Where does 'similar average value, very different variability' actually show up in this dataset?"
          metric="Segment pair minimizing mean gap while maximizing std. deviation gap"
          observation={
            <>
              <strong>{pairA}</strong> and <strong>{pairB}</strong> have mean order values within{" "}
              <strong>{fmtPct(pairMeanDiffPct)}</strong> of each other ({fmtINR(statA.mean)} vs {fmtINR(statB.mean)}),
              yet their standard deviations differ by roughly <strong>{fmtNum(pairStdRatio, 2)}&times;</strong> (
              {fmtINR(statA.std)} vs {fmtINR(statB.std)}).
            </>
          }
          interpretation="Two segments can look identical on a single 'average order value' KPI and still carry very different risk/predictability profiles. The higher-variance segment's order values are spread much more widely around the same center, so forecasting revenue or planning inventory for it is inherently less certain, even though the expected value looks the same."
          caveat="Highlighted pair is selected automatically each time this page loads, by maximizing the ratio of std-deviation gap to mean gap across all segment pairs — it is not a hand-picked example."
        />
      </section>

      {/* Bernoulli */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Bernoulli Random Variable &mdash; Did This Session Convert?</h2>
        <p className="text-sm text-muted-foreground">
          Zoom into a single session and ask one yes/no question: did it end in a purchase? That outcome is a{" "}
          <strong>Bernoulli trial</strong> &mdash; a random variable that takes value 1 (&ldquo;success&rdquo;, a
          purchase) with probability p, or 0 (&ldquo;failure&rdquo;) with probability 1&minus;p. Here p is simply the
          dataset&rsquo;s observed overall conversion rate.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="p (P success)" value={fmtPct(ber.p_success)} accent="var(--series-1)" />
          <StatCard label="1 − p (P failure)" value={fmtPct(ber.p_failure)} />
          <StatCard label="Mean = p" value={fmtNum(ber.mean, 4)} />
          <StatCard label="Variance = p(1−p)" value={fmtNum(ber.variance, 4)} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bernoulli Random Variable</CardTitle>
          </CardHeader>
          <CardContent>
            <ExplainLevels
              simple="A Bernoulli random variable is the simplest possible random variable: a single coin flip with a possibly unfair coin. Here, 'heads' means the session converted, and the coin's bias is set to match how often that actually happens in the data."
              math={
                <FormulaBlock label="Bernoulli(p)">
                  {`X ∈ {0, 1}
P(X = 1) = p,  P(X = 0) = 1 − p
E[X] = p
Var(X) = p(1 − p)
SD(X) = √(p(1 − p))`}
                </FormulaBlock>
              }
              applied={
                <>
                  With p = {fmtNum(ber.p_success, 4)}: E[X] = {fmtNum(ber.mean, 4)}, Var(X) ={" "}
                  {fmtNum(ber.variance, 4)}, SD(X) = {fmtNum(ber.std, 4)}. This single Bernoulli parameter is exactly
                  what feeds the Binomial model on the{" "}
                  <a href="/binomial" className="underline underline-offset-2">
                    Conversion Forecast Simulator
                  </a>{" "}
                  page, which treats n independent sessions as n repeated Bernoulli trials.
                </>
              }
            />
          </CardContent>
        </Card>
      </section>

      <CaveatNote>
        Every figure on this page is computed directly from the observed 60,000-row synthetic session dataset &mdash;
        the PMF, CDF, expected values, and Bernoulli parameter are empirical summaries, not assumed or fitted
        distributions. Forward-looking, assumption-driven models (Binomial, Hypergeometric, and continuous
        distributions) live on the following pages and are labeled as model simulations.
      </CaveatNote>
    </div>
  );
}
