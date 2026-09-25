"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/viz/page-header";
import { FormulaBlock } from "@/components/viz/formula-block";
import { StatCard } from "@/components/viz/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as d from "@/lib/analytics/descriptive";

function parseNumbers(text: string): number[] {
  return text
    .split(/[,\s\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

const DEFAULT_UNIVARIATE = "420, 650, 710, 820, 890, 940, 1020, 1150, 1340, 1550, 1890, 2450, 3100, 8900";
const DEFAULT_X = "2, 3, 4, 5, 6, 7, 8, 9, 10, 12";
const DEFAULT_Y = "610, 780, 905, 1120, 1240, 1510, 1690, 1850, 2010, 2430";

export default function CalculatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Try it yourself"
        title="Interactive Statistics Calculator"
        description="Every calculator below runs the same TypeScript functions (lib/analytics/*) that power the rest of the site. Paste your own numbers to see the formula, the calculation, and a plain-language business read of the result."
      />

      <Tabs defaultValue="univariate">
        <TabsList>
          <TabsTrigger value="univariate">Univariate</TabsTrigger>
          <TabsTrigger value="bivariate">Covariance &amp; Correlation</TabsTrigger>
          <TabsTrigger value="probability">Conditional Probability</TabsTrigger>
          <TabsTrigger value="expectation">Expected Value</TabsTrigger>
        </TabsList>

        <TabsContent value="univariate" className="pt-4">
          <UnivariateCalculator />
        </TabsContent>
        <TabsContent value="bivariate" className="pt-4">
          <BivariateCalculator />
        </TabsContent>
        <TabsContent value="probability" className="pt-4">
          <ConditionalProbabilityCalculator />
        </TabsContent>
        <TabsContent value="expectation" className="pt-4">
          <ExpectedValueCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UnivariateCalculator() {
  const [text, setText] = useState(DEFAULT_UNIVARIATE);
  const [pctInput, setPctInput] = useState("90");
  const values = useMemo(() => parseNumbers(text), [text]);
  const valid = values.length > 0;
  const s = useMemo(() => (valid ? d.summary(values) : null), [values, valid]);
  const modeVal = useMemo(() => (valid ? d.mode(values) : null), [values, valid]);
  const pctP = Math.min(100, Math.max(0, Number(pctInput) || 0));
  const pctResult = useMemo(
    () => (valid ? d.percentile(values, pctP) : null),
    [values, valid, pctP]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mean, Median, Mode, Range, Percentiles, Quartiles, IQR, Variance, SD</CardTitle>
        <CardDescription>Enter a list of numbers (e.g. a set of order values), separated by commas, spaces or newlines.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">Input values</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="font-mono text-sm" />
          <div className="mt-1 text-xs text-muted-foreground">{values.length} valid numbers parsed</div>
        </div>

        {s && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Mean" value={d.mean(values).toFixed(2)} />
              <StatCard label="Median" value={d.median(values).toFixed(2)} />
              <StatCard label="Mode" value={String(modeVal)} />
              <StatCard label="Range" value={d.range(values).toFixed(2)} />
              <StatCard label="Q1" value={s.q1.toFixed(2)} />
              <StatCard label="Q3" value={s.q3.toFixed(2)} />
              <StatCard label="IQR" value={s.iqr.toFixed(2)} />
              <StatCard label="Variance" value={s.variance.toFixed(2)} />
              <StatCard label="Std. Deviation" value={s.std.toFixed(2)} />
            </div>

            <FormulaBlock label="Formulas">
{`mean(x)     = Σxᵢ / n
median(x)   = middle value of sorted x (average of two middles if n is even)
mode(x)     = most frequently occurring value
range(x)    = max(x) - min(x)
variance    = Σ(xᵢ - mean)² / (n - 1)          [sample variance]
std dev     = √variance
IQR         = Q3 - Q1
outlier fence = [Q1 - 1.5·IQR,  Q3 + 1.5·IQR]`}
            </FormulaBlock>

            <div className="rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">Business interpretation: </span>
              {s.mean > s.median * 1.05 ? (
                <>
                  The mean (₹{s.mean.toFixed(0)}) is noticeably above the median (₹{s.median.toFixed(0)}), which points to a
                  right-skewed distribution — a handful of large values are pulling the average up. The median is the more
                  representative &ldquo;typical&rdquo; figure here.
                </>
              ) : s.median > s.mean * 1.05 ? (
                <>The median exceeds the mean, suggesting a left-skewed distribution with a tail of unusually small values.</>
              ) : (
                <>Mean and median are close, suggesting a fairly symmetric distribution.</>
              )}{" "}
              {s.n_outliers > 0 && (
                <>
                  {s.n_outliers} of {s.n} values fall outside the Tukey IQR fence [{s.outlier_lower_bound.toFixed(0)},{" "}
                  {s.outlier_upper_bound.toFixed(0)}] and would be flagged as statistical outliers.
                </>
              )}
            </div>

            <ul className="ml-4 list-disc space-y-1.5 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Mode ({String(modeVal)})</strong>: the single most frequently
                occurring value — useful when you need one representative &ldquo;typical&rdquo; transaction (e.g. the
                most common order size) rather than an average that no real order may equal.
              </li>
              <li>
                <strong className="text-foreground">Range ({s.range.toFixed(2)})</strong>: the gap between the
                smallest and largest value. It is easy to explain but highly sensitive to a single extreme
                order — treat it as a rough headline, not a robust spread measure.
              </li>
              <li>
                <strong className="text-foreground">Variance ({s.variance.toFixed(2)})</strong> and{" "}
                <strong className="text-foreground">standard deviation ({s.std.toFixed(2)})</strong>: variance is in
                squared units and mostly useful as an intermediate calculation; standard deviation converts it back
                to the original unit, so &ldquo;typical orders sit within roughly ±₹{s.std.toFixed(0)} of the
                mean&rdquo; is directly interpretable for planning inventory or revenue ranges.
              </li>
            </ul>

            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium">Percentile calculator:</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={pctInput}
                  onChange={(e) => setPctInput(e.target.value)}
                  className="h-8 w-20"
                />
                <span className="text-xs text-muted-foreground">th percentile</span>
              </div>
              <FormulaBlock label="Formula">
{`percentile(x, p) = value at rank (p/100)·(n-1) in sorted x,
                    linearly interpolated between the two nearest ranks`}
              </FormulaBlock>
              <div className="mt-2">
                P{pctP} = <span className="font-medium">{pctResult !== null ? pctResult.toFixed(2) : "–"}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Business interpretation: </span>
                {pctResult !== null && (
                  <>
                    {pctP}% of the {s.n} observed values fall at or below {pctResult.toFixed(2)}. Percentiles like
                    P90 or P95 are what teams typically use for SLA-style targets (e.g. &ldquo;95% of orders deliver
                    within X days&rdquo;) since, unlike the mean, they are not distorted by a handful of extreme
                    values.
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BivariateCalculator() {
  const [xText, setXText] = useState(DEFAULT_X);
  const [yText, setYText] = useState(DEFAULT_Y);
  const x = useMemo(() => parseNumbers(xText), [xText]);
  const y = useMemo(() => parseNumbers(yText), [yText]);
  const n = Math.min(x.length, y.length);
  const valid = n >= 2;
  const cov = valid ? d.covariance(x.slice(0, n), y.slice(0, n)) : null;
  const corr = valid ? d.correlation(x.slice(0, n), y.slice(0, n)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Covariance &amp; Correlation</CardTitle>
        <CardDescription>Enter two equal-length lists (e.g. products viewed vs. order value) to measure their linear association.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">X values</Label>
            <Textarea value={xText} onChange={(e) => setXText(e.target.value)} rows={3} className="font-mono text-sm" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Y values</Label>
            <Textarea value={yText} onChange={(e) => setYText(e.target.value)} rows={3} className="font-mono text-sm" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Using the first {n} paired values from each list.</div>

        {cov !== null && corr !== null && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Covariance" value={cov.toFixed(3)} />
              <StatCard label="Correlation (r)" value={corr.toFixed(3)} accent="var(--series-1)" />
            </div>
            <FormulaBlock label="Formulas">
{`cov(X,Y) = Σ(xᵢ - x̄)(yᵢ - ȳ) / (n - 1)
r        = cov(X,Y) / (σx · σy)          [-1 ≤ r ≤ 1]`}
            </FormulaBlock>
            <div className="rounded-lg border border-border p-3 text-sm">
              <span className="font-medium">Business interpretation: </span>
              Covariance ({cov.toFixed(3)}) is {cov >= 0 ? "positive" : "negative"}, meaning X and Y tend to move in
              the {cov >= 0 ? "same" : "opposite"} direction — but because covariance is expressed in the product of
              X&rsquo;s and Y&rsquo;s raw units, its magnitude alone can&rsquo;t be compared across variable pairs.
              Correlation standardizes it: r = {corr.toFixed(3)} indicates a{" "}
              {Math.abs(corr) > 0.7 ? "strong" : Math.abs(corr) > 0.3 ? "moderate" : "weak"}{" "}
              {corr >= 0 ? "positive" : "negative"} linear association — as X increases, Y tends to{" "}
              {corr >= 0 ? "increase" : "decrease"} as well. This is an observational association, not evidence that X causes Y.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ConditionalProbabilityCalculator() {
  const [nAB, setNAB] = useState("140");
  const [nB, setNB] = useState("254");
  const [nTotal, setNTotal] = useState("600");
  const a = Number(nAB) || 0;
  const b = Number(nB) || 0;
  const total = Number(nTotal) || 0;
  const pB = total > 0 ? b / total : 0;
  const pAB = total > 0 ? a / total : 0;
  const pAgivenB = b > 0 ? a / b : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conditional Probability, P(A | B)</CardTitle>
        <CardDescription>
          Enter observed counts &mdash; e.g. sessions with both an add-to-cart AND a purchase, sessions with an
          add-to-cart, and total sessions &mdash; to compute P(Purchase | Cart) from raw counts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Count of A ∩ B</Label>
            <Input value={nAB} onChange={(e) => setNAB(e.target.value)} type="number" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Count of B</Label>
            <Input value={nB} onChange={(e) => setNB(e.target.value)} type="number" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Total observations</Label>
            <Input value={nTotal} onChange={(e) => setNTotal(e.target.value)} type="number" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="P(A ∩ B)" value={(pAB * 100).toFixed(1) + "%"} />
          <StatCard label="P(B)" value={(pB * 100).toFixed(1) + "%"} />
          <StatCard label="P(A | B)" value={(pAgivenB * 100).toFixed(1) + "%"} accent="var(--series-1)" />
        </div>

        <FormulaBlock label="Formula">{`P(A | B) = P(A ∩ B) / P(B) = ${a} / ${b} = ${pAgivenB.toFixed(4)}`}</FormulaBlock>

        <div className="rounded-lg border border-border p-3 text-sm">
          <span className="font-medium">Business interpretation: </span>
          Given that B occurred, there is a {(pAgivenB * 100).toFixed(1)}% chance A also occurred in this sample &mdash;
          compare this to P(A) unconditionally to see whether B is associated with a higher or lower chance of A.
        </div>
      </CardContent>
    </Card>
  );
}

type PmfRow = { value: string; prob: string };

function ExpectedValueCalculator() {
  const [rows, setRows] = useState<PmfRow[]>([
    { value: "0", prob: "0.10" },
    { value: "1", prob: "0.35" },
    { value: "2", prob: "0.30" },
    { value: "3", prob: "0.15" },
    { value: "4", prob: "0.10" },
  ]);

  const parsed = rows
    .map((r) => ({ value: Number(r.value), prob: Number(r.prob) }))
    .filter((r) => Number.isFinite(r.value) && Number.isFinite(r.prob));

  const probSum = parsed.reduce((s, r) => s + r.prob, 0);
  const ev = parsed.reduce((s, r) => s + r.value * r.prob, 0);
  const ex2 = parsed.reduce((s, r) => s + r.value * r.value * r.prob, 0);
  const variance = ex2 - ev * ev;

  function updateRow(i: number, field: keyof PmfRow, val: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expected Value of a Discrete Random Variable</CardTitle>
        <CardDescription>
          Build a probability mass function (value, probability) &mdash; e.g. items purchased per session &mdash; and
          compute its expected value and variance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="w-24"
                value={r.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                placeholder="x"
              />
              <span className="text-xs text-muted-foreground">P(X = x)</span>
              <Input
                className="w-24"
                value={r.prob}
                onChange={(e) => updateRow(i, "prob", e.target.value)}
                placeholder="p"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, { value: "", prob: "" }])}>
              Add row
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRows((prev) => prev.slice(0, -1))}
              disabled={rows.length <= 1}
            >
              Remove row
            </Button>
          </div>
          <div className={`text-xs ${Math.abs(probSum - 1) > 0.01 ? "text-[var(--status-critical)]" : "text-muted-foreground"}`}>
            Probabilities sum to {probSum.toFixed(3)} {Math.abs(probSum - 1) > 0.01 ? "— a valid PMF must sum to 1" : "✓"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="E[X]" value={ev.toFixed(3)} accent="var(--series-1)" />
          <StatCard label="Var(X)" value={variance.toFixed(3)} />
          <StatCard label="SD(X)" value={Math.sqrt(Math.max(variance, 0)).toFixed(3)} />
        </div>

        <FormulaBlock label="Formulas">
{`E[X]     = Σ x · P(X=x)
Var(X)   = E[X²] - (E[X])²
SD(X)    = √Var(X)`}
        </FormulaBlock>

        <div className="rounded-lg border border-border p-3 text-sm">
          <span className="font-medium">Business interpretation: </span>
          E[X] = {ev.toFixed(2)} is the long-run, probability-weighted average outcome — not a guarantee for any single
          session. Two variables can share the same E[X] but differ sharply in Var(X), meaning very different
          predictability around that average.
        </div>
      </CardContent>
    </Card>
  );
}
