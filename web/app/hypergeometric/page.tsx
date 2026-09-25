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
  binomialPMF,
  hypergeometricCurve,
  hypergeometricPMF,
  hypergeometricSummary,
} from "@/lib/analytics/randomVariables";

export default function HypergeometricPage() {
  const def = data.hypergeometric_default;

  const [NRaw, setN] = useState(def.N_pool_size);
  const [KRaw, setK] = useState(def.K_high_value);
  const [nRaw, setN2] = useState(def.n_sample_size);
  const [kRaw, setKTarget] = useState(def.k_target);

  // Self-healing derivation: `Math.min`/`Math.max` propagate NaN rather than
  // clamping it (Math.max(NaN, 0) === NaN), so any state that somehow went
  // non-finite -- a Slider edge case, a bad paste, anything -- is first
  // replaced with a sane default here, on every render, before any clamping
  // or math touches it. Nothing downstream of this block can see NaN/undefined.
  const safe = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
  const N = safe(NRaw, def.N_pool_size);
  // Derived (not synced via effects): every value re-clamps to the current N on each render.
  const K = Math.min(Math.max(safe(KRaw, def.K_high_value), 0), N);
  const n = Math.min(Math.max(safe(nRaw, def.n_sample_size), 0), N);

  const kMin = Math.max(0, n - (N - K));
  const kMax = Math.min(n, K);
  const k = Math.min(Math.max(safe(kRaw, def.k_target), kMin), Math.max(kMin, kMax));

  const summary = useMemo(() => hypergeometricSummary(N, K, n), [N, K, n]);
  const pExact = useMemo(() => hypergeometricPMF(N, K, n, k), [N, K, n, k]);
  const pApprox = useMemo(() => binomialPMF(n, N > 0 ? K / N : 0, k), [N, K, n, k]);
  const gap = Math.abs(pExact - pApprox);

  const curve = useMemo(() => hypergeometricCurve(N, K, n), [N, K, n]);
  const curveData = curve.k.map((ki, i) => ({ name: String(ki), value: curve.pmf[i] }));

  const nOverN = n / N;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Random Variables & Uncertainty"
        title="Campaign Sampling Without Replacement"
        badge="Model Simulation"
        description="A campaign pool contains N customers, K of them high-value. We randomly select n customers without replacement for a limited-slot campaign. What is the probability that exactly k of the selected customers are high-value?"
      />

      {/* Controls */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>
              Defaults: pool of {fmtNum(def.N_pool_size, 0)} customers, {fmtNum(def.K_high_value, 0)} high-value,
              sampling {fmtNum(def.n_sample_size, 0)}. K/N is seeded from the dataset&rsquo;s actual observed
              high-value customer share, {fmtPct(data.observed_high_value_share, 1)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Pool size (N)</span>
                <span className="font-mono tabular-nums">{fmtNum(N, 0)}</span>
              </div>
              <Slider value={[N]} onValueChange={(v) => setN(v[0])} min={50} max={2000} step={10} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">High-value customers in pool (K)</span>
                <span className="font-mono tabular-nums">
                  {fmtNum(K, 0)} ({fmtPct(K / N, 1)} of pool)
                </span>
              </div>
              <Slider value={[K]} onValueChange={(v) => setK(v[0])} min={0} max={N} step={1} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Sample size (n)</span>
                <span className="font-mono tabular-nums">{fmtNum(n, 0)}</span>
              </div>
              <Slider value={[n]} onValueChange={(v) => setN2(v[0])} min={0} max={N} step={1} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Target high-value selected (k)</span>
                <span className="font-mono tabular-nums">
                  {fmtNum(k, 0)}
                  {kMax <= kMin && " (only value possible at this N/K/n)"}
                </span>
              </div>
              {/* Base UI's Slider divides by (max - min) to place the thumb, which is NaN
                  when the valid k range collapses to a single point (kMin === kMax) --
                  e.g. N=50, K=50, n=40 forces k=40 exactly. Fall back to a disabled,
                  non-degenerate range in that case instead of feeding it min === max. */}
              <Slider
                value={[k]}
                onValueChange={(v) => setKTarget(v[0])}
                min={kMin}
                max={kMax > kMin ? kMax : kMin + 1}
                step={1}
                disabled={kMax <= kMin}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Live results */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Live-Computed Probabilities</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label={`P(X = ${k}), exact`} value={fmtPct(pExact, 2)} accent="var(--series-1)" />
          <StatCard label="Expected high-value in sample" value={fmtNum(summary.mean, 2)} />
          <StatCard label="SD(X)" value={fmtNum(summary.std, 2)} />
        </div>

        <FormulaBlock label="Hypergeometric formulas">
          {`P(X = k) = C(K, k) · C(N−K, n−k) / C(N, n)
E[X]     = n·(K/N)
Var(X)   = n·(K/N)·((N−K)/N)·((N−n)/(N−1))`}
        </FormulaBlock>

        <Card>
          <CardHeader>
            <CardTitle>PMF of X = high-value customers selected</CardTitle>
            <CardDescription>Sampling n = {fmtNum(n, 0)} without replacement from a pool of {fmtNum(N, 0)}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={curveData} valueFormatter={(v) => fmtPct(v, 2)} color="var(--series-1)" showValues={curveData.length <= 40} />
          </CardContent>
        </Card>
      </section>

      {/* Binomial approximation comparison */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Hypergeometric vs. the Naive Binomial Approximation</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label={`Hypergeometric: P(X = ${k})`} value={fmtPct(pExact, 3)} accent="var(--series-1)" />
          <StatCard label={`Binomial approx (p = K/N): P(X = ${k})`} value={fmtPct(pApprox, 3)} accent="var(--series-4)" />
          <StatCard label="Absolute gap" value={fmtPct(gap, 3)} />
        </div>
        <p className="text-sm text-muted-foreground">
          As a sanity check: at this page&rsquo;s default parameters (N = {def.N_pool_size}, K = {def.K_high_value},
          n = {def.n_sample_size}, k = {def.k_target}) the precomputed reference values are P(X = k) ={" "}
          {fmtNum(def.p_exact_k, 4)} (hypergeometric, exact) vs. {fmtNum(def.binomial_approx_p_exact_k, 4)} (binomial
          approximation) &mdash; matching what the live calculator above shows when the sliders are reset to those
          values.
        </p>
        <CaveatNote>
          The binomial approximation assumes sampling <strong>with replacement</strong> &mdash; a constant
          probability of drawing a high-value customer on every single draw. Sampling <strong>without
          replacement</strong>, as a real campaign selection does, is different: every customer selected changes the
          composition of the remaining pool, so the probability of the next draw being high-value shifts slightly
          after each pick. The hypergeometric distribution accounts for this; the binomial does not. The gap between
          the two shrinks as N grows large relative to n (currently n is {fmtPct(nOverN, 1)} of the pool) &mdash;
          with a huge pool and a small sample, removing one customer barely changes the remaining odds, and the
          binomial approximation becomes reasonable.
        </CaveatNote>
      </section>
    </div>
  );
}
