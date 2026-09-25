"use client";

import { useMemo, useState } from "react";
import { data, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { CaveatNote } from "@/components/viz/business-question";
import { FormulaBlock } from "@/components/viz/formula-block";
import { BarChartCard } from "@/components/charts/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  binomialCdfGE,
  binomialCdfLE,
  binomialCurve,
  binomialPMF,
  binomialSummary,
} from "@/lib/analytics/randomVariables";

const N_MIN = 10;
const N_MAX = 2000;
const N_STEP = 10;

export default function BinomialPage() {
  const def = data.binomial_default;

  const [nRaw, setN] = useState(def.n);
  const [pRaw, setP] = useState(def.p);
  const [kRaw, setK] = useState(Math.round(def.summary.mean));
  // Self-healing derivation: if any raw state ever goes non-finite (a Slider
  // edge case, etc.), fall back to the default rather than letting NaN/undefined
  // propagate -- Math.min/Math.max do NOT clamp NaN, they just return NaN.
  const safe = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
  const n = safe(nRaw, def.n);
  const p = safe(pRaw, def.p);
  // Derived (not synced via effect): clamps automatically whenever n shrinks below the stored k.
  const k = Math.min(Math.max(safe(kRaw, Math.round(def.summary.mean)), 0), n);

  const summary = useMemo(() => binomialSummary(n, p), [n, p]);
  const pExact = useMemo(() => binomialPMF(n, p, k), [n, p, k]);
  const pLE = useMemo(() => binomialCdfLE(n, p, k), [n, p, k]);
  const pGE = useMemo(() => binomialCdfGE(n, p, k), [n, p, k]);

  const curve = useMemo(() => binomialCurve(n, p), [n, p]);
  // Focus the chart on the region carrying effectively all probability mass
  // so it stays legible even when n is large; the full curve is used for
  // every numeric calculation above.
  const windowed = useMemo(() => {
    const lo = Math.max(0, Math.floor(summary.mean - 4 * summary.std));
    const hi = Math.min(n, Math.ceil(summary.mean + 4 * summary.std));
    return curve.k
      .map((ki, i) => ({ name: String(ki), value: curve.pmf[i] }))
      .filter((_, i) => curve.k[i] >= lo && curve.k[i] <= hi);
  }, [curve, n, summary]);
  const isWindowed = windowed.length < curve.k.length;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Random Variables & Uncertainty"
        title="Conversion Forecast Simulator"
        badge="Model Simulation"
        description="A binomial model treats n upcoming sessions as n independent, identical Bernoulli trials, each converting with probability p. Adjust n, p, and a target conversion count k below to see how the resulting probability distribution shifts — this is a forward-looking planning tool, not a re-analysis of historical rows."
      />

      {/* Controls */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>
              Defaults to n = {def.n} sessions at p = {fmtNum(def.p, 4)}, the dataset&rsquo;s observed overall
              conversion rate &mdash; change either to explore &ldquo;what if&rdquo; scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Number of sessions (n)</span>
                <span className="font-mono tabular-nums">{fmtNum(n, 0)}</span>
              </div>
              <Slider value={[n]} onValueChange={(v) => setN(v[0])} min={N_MIN} max={N_MAX} step={N_STEP} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Conversion probability (p)</span>
                <span className="font-mono tabular-nums">{fmtNum(p, 3)}</span>
              </div>
              <Slider value={[p]} onValueChange={(v) => setP(v[0])} min={0} max={1} step={0.01} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Target conversions (k)</span>
                <span className="font-mono tabular-nums">{fmtNum(k, 0)}</span>
              </div>
              <Slider value={[k]} onValueChange={(v) => setK(v[0])} min={0} max={n} step={1} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Live results */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Live-Computed Probabilities</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label={`P(X = ${k})`} value={fmtPct(pExact, 2)} accent="var(--series-1)" />
          <StatCard label={`P(X ≤ ${k})`} value={fmtPct(pLE, 2)} />
          <StatCard label={`P(X ≥ ${k})`} value={fmtPct(pGE, 2)} />
          <StatCard label="E[X] = np" value={fmtNum(summary.mean, 1)} sublabel="expected conversions" />
          <StatCard label="Var(X) = np(1−p)" value={fmtNum(summary.variance, 2)} />
          <StatCard label="SD(X)" value={fmtNum(summary.std, 2)} sublabel="conversions" />
        </div>

        <FormulaBlock label="Binomial formulas">
          {`P(X = k) = C(n, k) · p^k · (1 − p)^(n − k)
E[X]     = n·p
Var(X)   = n·p·(1 − p)
SD(X)    = √(n·p·(1 − p))`}
        </FormulaBlock>

        <Card>
          <CardHeader>
            <CardTitle>PMF of X = number of conversions in {fmtNum(n, 0)} sessions</CardTitle>
            <CardDescription>
              P(X = {k}) = <strong>{fmtPct(pExact, 2)}</strong>
              {isWindowed && " · chart focused on mean ± 4 SD, where essentially all probability mass sits"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={windowed} valueFormatter={(v) => fmtPct(v, 2)} color="var(--series-1)" showValues={windowed.length <= 40} />
          </CardContent>
        </Card>
      </section>

      {/* Assumptions */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">The Binomial Model&rsquo;s Assumptions</h2>
        <Card>
          <CardContent className="space-y-3 pt-2 text-sm">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <strong>A fixed number of trials, n.</strong> We decide in advance how many sessions we&rsquo;re
                forecasting over.
              </li>
              <li>
                <strong>Each trial has exactly two outcomes.</strong> A session either converts or it doesn&rsquo;t
                &mdash; no partial outcomes.
              </li>
              <li>
                <strong>A constant success probability p across all trials.</strong> Every session is assumed to
                convert with the same probability p, trial after trial.
              </li>
              <li>
                <strong>Trials are independent (i.i.d.).</strong> One session&rsquo;s outcome is assumed to give no
                information about another&rsquo;s.
              </li>
            </ol>
            <CaveatNote>
              Real e-commerce traffic can violate assumption #3 &mdash; seasonality, campaigns, and pricing changes
              all shift the true conversion probability over time, so p is rarely truly constant &mdash; and
              assumption #4, since a single customer&rsquo;s repeat sessions are correlated with each other, not
              independent. The binomial model is a simplifying planning assumption. It is different in kind from the{" "}
              <a href="/descriptive" className="underline underline-offset-2">
                observed historical dataset
              </a>{" "}
              used elsewhere on this site, which doesn&rsquo;t assume any of this — it just counts what happened.
            </CaveatNote>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
