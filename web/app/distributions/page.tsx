"use client";

import { useMemo, useState } from "react";
import { data, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { CaveatNote } from "@/components/viz/business-question";
import { FormulaBlock } from "@/components/viz/formula-block";
import { LineChartCard } from "@/components/charts/line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  exponentialCurve,
  exponentialCdfLE,
  exponentialMemorylessCheck,
  exponentialSummary,
  exponentialSurvival,
  triangularCdfLE,
  triangularCurve,
  triangularSummary,
  uniformCdfLE,
  uniformCurve,
  uniformProbBetween,
  uniformSummary,
} from "@/lib/analytics/distributions";

export default function DistributionsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Random Variables & Uncertainty"
        title="Continuous Distribution Lab"
        badge="Model Simulation"
        description="Continuous random variables can take any value within a range, not just whole numbers. Each tab below fits a business scenario to a theoretical distribution shape parameterized by assumptions or an observed rate — these are forward-looking models, not distributions re-derived by fitting raw per-row data."
      />

      <Tabs defaultValue="uniform">
        <TabsList>
          <TabsTrigger value="uniform">Uniform</TabsTrigger>
          <TabsTrigger value="triangular">Triangular</TabsTrigger>
          <TabsTrigger value="exponential">Exponential</TabsTrigger>
        </TabsList>

        <TabsContent value="uniform" className="pt-6">
          <UniformTab />
        </TabsContent>
        <TabsContent value="triangular" className="pt-6">
          <TriangularTab />
        </TabsContent>
        <TabsContent value="exponential" className="pt-6">
          <ExponentialTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  // NaN-safe: Math.min/Math.max propagate NaN rather than clamping it, so a
  // non-finite input (a stray slider edge case, etc.) falls back to `lo`
  // instead of poisoning every downstream calculation.
  if (!Number.isFinite(v)) return lo;
  return Math.min(Math.max(v, lo), hi);
}

// ---------------------------------------------------------------------
// Uniform
// ---------------------------------------------------------------------
function UniformTab() {
  const def = data.uniform_default;
  const [a, setA] = useState(def.params.a);
  const [b, setB] = useState(def.params.b);
  const [x, setX] = useState((def.params.a + def.params.b) / 2);
  const [range, setRange] = useState<[number, number]>([def.params.a + (def.params.b - def.params.a) * 0.25, def.params.a + (def.params.b - def.params.a) * 0.75]);

  const pad = Math.max(1, (b - a) * 0.2);
  const xMin = a - pad;
  const xMax = b + pad;
  const xClamped = clamp(x, xMin, xMax);
  const [r1, r2] = range;
  const r1c = clamp(r1, xMin, xMax);
  const r2c = clamp(Math.max(r2, r1c), xMin, xMax);

  const summary = useMemo(() => uniformSummary(a, b), [a, b]);
  const curve = useMemo(() => uniformCurve(a, b), [a, b]);
  const curveData = curve.x.map((xi, i) => ({ x: xi, pdf: curve.pdf[i], cdf: curve.cdf[i] }));

  const pLE = uniformCdfLE(xClamped, a, b);
  const pGT = 1 - pLE;
  const pBetween = uniformProbBetween(r1c, r2c, a, b);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <strong>Business scenario:</strong> within a fixed promotional window, a session is equally likely to start
        at any moment &mdash; session arrival time is modeled as Uniform(a, b).
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Default window: a = {def.params.a}, b = {def.params.b} (hours into the window)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Window start (a)</span>
              <span className="font-mono tabular-nums">{fmtNum(a, 1)}</span>
            </div>
            <Slider value={[a]} onValueChange={(v) => setA(Math.min(v[0], b - 1))} min={0} max={60} step={1} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Window end (b)</span>
              <span className="font-mono tabular-nums">{fmtNum(b, 1)}</span>
            </div>
            <Slider value={[b]} onValueChange={(v) => setB(Math.max(v[0], a + 1))} min={1} max={72} step={1} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Mean" value={fmtNum(summary.mean, 2)} accent="var(--series-1)" />
        <StatCard label="Variance" value={fmtNum(summary.variance, 2)} />
        <StatCard label="Std. Deviation" value={fmtNum(summary.std, 2)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Density &amp; Cumulative Distribution</CardTitle>
          <CardDescription>PDF is flat between a and b; CDF rises linearly from 0 to 1</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartCard
            x="x"
            series={[
              { key: "pdf", label: "PDF", color: "var(--series-1)" },
              { key: "cdf", label: "CDF", color: "var(--series-2)" },
            ]}
            data={curveData}
            xFormatter={(v) => fmtNum(v, 1)}
            yFormatter={(v) => fmtNum(v, 2)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Point &amp; Range Probabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Evaluate at x</span>
              <span className="font-mono tabular-nums">{fmtNum(xClamped, 2)}</span>
            </div>
            <Slider value={[xClamped]} onValueChange={(v) => setX(v[0])} min={xMin} max={xMax} step={0.1} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatCard label={`P(X ≤ ${fmtNum(xClamped, 1)})`} value={fmtPct(pLE, 2)} />
              <StatCard label={`P(X > ${fmtNum(xClamped, 1)})`} value={fmtPct(pGT, 2)} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Evaluate between x1 and x2</span>
              <span className="font-mono tabular-nums">
                {fmtNum(r1c, 2)} – {fmtNum(r2c, 2)}
              </span>
            </div>
            <Slider value={[r1c, r2c]} onValueChange={(v) => setRange([v[0], v[1]])} min={xMin} max={xMax} step={0.1} />
            <div className="mt-3">
              <StatCard label={`P(${fmtNum(r1c, 1)} < X ≤ ${fmtNum(r2c, 1)})`} value={fmtPct(pBetween, 2)} accent="var(--series-1)" />
            </div>
          </div>
        </CardContent>
      </Card>

      <FormulaBlock label="Uniform(a, b) formulas">
        {`f(x) = 1 / (b − a)      for a ≤ x ≤ b
F(x) = (x − a) / (b − a)
E[X] = (a + b) / 2
Var(X) = (b − a)² / 12`}
      </FormulaBlock>

      <CaveatNote>
        Uniformity is a strong assumption: it says every moment in the window is equally likely to see a session
        start. It can be reasonable for a short, evenly-promoted flash window, but is usually a poor fit for a real
        marketing campaign, where traffic typically spikes right after launch or around reminder emails/push
        notifications rather than spreading evenly — this is a simplifying model choice, not a fact verified against
        raw session timestamps.
      </CaveatNote>
    </div>
  );
}

// ---------------------------------------------------------------------
// Triangular
// ---------------------------------------------------------------------
function TriangularTab() {
  const def = data.triangular_default;
  const [min, setMin] = useState(def.params.min);
  const [mode, setMode] = useState(def.params.mode);
  const [max, setMax] = useState(def.params.max);

  const summary = useMemo(() => triangularSummary(min, mode, max), [min, mode, max]);
  const curve = useMemo(() => triangularCurve(min, mode, max), [min, mode, max]);
  const curveData = curve.x.map((xi, i) => ({ x: xi, pdf: curve.pdf[i], cdf: curve.cdf[i] }));

  const pLe5 = triangularCdfLE(5, min, mode, max);
  const pGt7 = 1 - triangularCdfLE(7, min, mode, max);
  const atDefault = min === def.params.min && mode === def.params.mode && max === def.params.max;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <strong>Business scenario:</strong> delivery time is uncertain, but ops can estimate a best case, a most
        likely case, and a worst case &mdash; a natural fit for the Triangular(min, mode, max) distribution.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            Default estimate: min = {def.params.min}, mode = {def.params.mode}, max = {def.params.max} days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Fastest case (min)</span>
              <span className="font-mono tabular-nums">{fmtNum(min, 1)}</span>
            </div>
            <Slider value={[min]} onValueChange={(v) => setMin(Math.min(v[0], mode))} min={0} max={20} step={0.5} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Most likely (mode)</span>
              <span className="font-mono tabular-nums">{fmtNum(mode, 1)}</span>
            </div>
            <Slider value={[mode]} onValueChange={(v) => setMode(clamp(v[0], min, max))} min={0} max={25} step={0.5} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Worst case (max)</span>
              <span className="font-mono tabular-nums">{fmtNum(max, 1)}</span>
            </div>
            <Slider value={[max]} onValueChange={(v) => setMax(Math.max(v[0], mode))} min={0} max={30} step={0.5} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Mean" value={fmtNum(summary.mean, 2)} sublabel="days" accent="var(--series-1)" />
        <StatCard label="Variance" value={fmtNum(summary.variance, 2)} />
        <StatCard label="Std. Deviation" value={fmtNum(summary.std, 2)} sublabel="days" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Density &amp; Cumulative Distribution</CardTitle>
          <CardDescription>PDF rises to a peak at the mode, then falls to the max</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartCard
            x="x"
            series={[
              { key: "pdf", label: "PDF", color: "var(--series-1)" },
              { key: "cdf", label: "CDF", color: "var(--series-2)" },
            ]}
            data={curveData}
            xFormatter={(v) => fmtNum(v, 1)}
            yFormatter={(v) => fmtNum(v, 2)}
            refX={mode}
            refLabel="mode"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="P(Delivery ≤ 5 days)" value={fmtPct(pLe5, 2)} accent="var(--series-1)" />
        <StatCard label="P(Delivery > 7 days)" value={fmtPct(pGt7, 2)} accent="var(--status-serious)" />
      </div>
      {atDefault && (
        <p className="text-xs text-muted-foreground">
          At these default parameters, the live values above (P ≤ 5 = {fmtNum(pLe5, 4)}, P &gt; 7 ={" "}
          {fmtNum(pGt7, 4)}) match the precomputed reference values (P ≤ 5 = {fmtNum(def.p_le_5, 4)}, P &gt; 7 ={" "}
          {fmtNum(def.p_gt_7, 4)}).
        </p>
      )}

      <FormulaBlock label="Triangular(min, mode, max) formulas">
        {`E[X]   = (min + mode + max) / 3
Var(X) = (min² + mode² + max² − min·mode − min·max − mode·max) / 18`}
      </FormulaBlock>

      <CaveatNote>
        Triangular is useful precisely when you only have three rough estimates (best/likely/worst case) and not
        enough historical delivery data to fit a full empirical distribution — it&rsquo;s a lightweight way to encode
        expert judgment into a probability model, not a distribution discovered from raw delivery logs.
      </CaveatNote>
    </div>
  );
}

// ---------------------------------------------------------------------
// Exponential
// ---------------------------------------------------------------------
function ExponentialTab() {
  const def = data.exponential_default;
  const [rate, setRate] = useState(def.params.rate);
  const [t, setT] = useState(Math.round(1 / def.params.rate));
  const [s, setS] = useState(Math.round(0.5 / def.params.rate));
  const [tExtra, setTExtra] = useState(Math.round(0.5 / def.params.rate));

  const summary = useMemo(() => exponentialSummary(rate), [rate]);
  const curve = useMemo(() => exponentialCurve(rate), [rate]);
  const curveData = curve.x.map((xi, i) => ({ x: xi, pdf: curve.pdf[i], cdf: curve.cdf[i] }));

  const tMax = Math.max(50, Math.ceil(6 / rate));
  const tClamped = clamp(t, 0, tMax);
  const pLE = exponentialCdfLE(tClamped, rate);
  const pGT = exponentialSurvival(tClamped, rate);

  const sClamped = clamp(s, 0, tMax);
  const tExtraClamped = clamp(tExtra, 0, tMax);
  const memoryless = exponentialMemorylessCheck(rate, sClamped, tExtraClamped);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <strong>Business scenario:</strong> the time between a customer&rsquo;s purchases (a waiting time) is modeled
        as Exponential(rate) &mdash; a common default for &ldquo;time until the next event&rdquo; processes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Parameter</CardTitle>
          <CardDescription>
            Default rate ={fmtNum(def.params.rate, 3)} events/day, i.e. an expected wait of{" "}
            {fmtNum(1 / def.params.rate, 1)} days between purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Rate (λ)</span>
              <span className="font-mono tabular-nums">{fmtNum(rate, 3)}</span>
            </div>
            <Slider value={[rate]} onValueChange={(v) => setRate(v[0])} min={0.01} max={0.5} step={0.005} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Expected wait 1/λ" value={fmtNum(summary.mean, 1)} sublabel="days" accent="var(--series-1)" />
        <StatCard label="Variance" value={fmtNum(summary.variance, 1)} />
        <StatCard label="Std. Deviation" value={fmtNum(summary.std, 1)} sublabel="days" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Density &amp; Cumulative Distribution</CardTitle>
          <CardDescription>PDF decays from λ at x = 0; CDF rises toward 1</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartCard
            x="x"
            series={[
              { key: "pdf", label: "PDF", color: "var(--series-1)" },
              { key: "cdf", label: "CDF", color: "var(--series-2)" },
            ]}
            data={curveData}
            xFormatter={(v) => fmtNum(v, 0)}
            yFormatter={(v) => fmtNum(v, 3)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waiting-Time Probabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Evaluate at t (days)</span>
              <span className="font-mono tabular-nums">{fmtNum(tClamped, 0)}</span>
            </div>
            <Slider value={[tClamped]} onValueChange={(v) => setT(v[0])} min={0} max={tMax} step={1} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={`P(T ≤ ${fmtNum(tClamped, 0)})`} value={fmtPct(pLE, 2)} />
            <StatCard label={`P(T > ${fmtNum(tClamped, 0)})`} value={fmtPct(pGT, 2)} />
          </div>
        </CardContent>
      </Card>

      <FormulaBlock label="Exponential(λ) formulas">
        {`f(t) = λ·e^(−λt)      for t ≥ 0
F(t) = 1 − e^(−λt)
E[T] = 1/λ
Var(T) = 1/λ²`}
      </FormulaBlock>

      {/* Memoryless demo */}
      <Card>
        <CardHeader>
          <CardTitle>The Memoryless Property</CardTitle>
          <CardDescription>
            Does already having waited s days change the odds of waiting t more days?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Already waited (s days)</span>
              <span className="font-mono tabular-nums">{fmtNum(sClamped, 0)}</span>
            </div>
            <Slider value={[sClamped]} onValueChange={(v) => setS(v[0])} min={0} max={tMax} step={1} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Additional wait (t days)</span>
              <span className="font-mono tabular-nums">{fmtNum(tExtraClamped, 0)}</span>
            </div>
            <Slider value={[tExtraClamped]} onValueChange={(v) => setTExtra(v[0])} min={0} max={tMax} step={1} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={`P(T > ${fmtNum(tExtraClamped, 0)})`} value={fmtPct(memoryless.p_t_gt_t, 4)} sublabel="starting fresh" />
            <StatCard
              label={`P(T > ${fmtNum(sClamped + tExtraClamped, 0)} | T > ${fmtNum(sClamped, 0)})`}
              value={fmtPct(memoryless.p_conditional_given_survived_s, 4)}
              sublabel="given it already survived s days"
              accent={memoryless.matches_memoryless_property ? "var(--status-good)" : "var(--status-serious)"}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Both numbers match: {memoryless.matches_memoryless_property ? "yes" : "no"}. In plain business terms,
            memorylessness means the wait time <em>so far</em> tells you nothing about how much longer you&rsquo;ll
            wait &mdash; a customer who hasn&rsquo;t purchased in {fmtNum(sClamped, 0)} days is, under this model,
            exactly as likely to wait {fmtNum(tExtraClamped, 0)} more days as a brand-new customer is to wait{" "}
            {fmtNum(tExtraClamped, 0)} days from scratch. It is a distinctive, somewhat counter-intuitive property of
            the exponential distribution specifically &mdash; most real-world processes (including, likely, actual
            purchase behavior) are not memoryless.
          </p>
        </CardContent>
      </Card>

      <CaveatNote>
        Do not claim that real customer purchase intervals necessarily follow an exponential distribution &mdash;
        this is a modeling assumption, not a fact verified against the raw data. For comparison, the dataset&rsquo;s
        actual observed average days-since-last-order is{" "}
        <strong>{fmtNum(def.observed_mean_days_since_last_order, 1)}</strong> days, which is what seeded this tab&rsquo;s
        default rate (1/λ); the model&rsquo;s implied mean wait at the current slider position is{" "}
        <strong>{fmtNum(summary.mean, 1)}</strong> days. A close match does not prove the exponential shape is
        correct &mdash; many different distributions can share the same mean.
      </CaveatNote>
    </div>
  );
}
