"use client";

import Link from "next/link";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const SKILLS = [
  "Business Analytics", "Product Analytics", "Statistics", "Probability",
  "Data Visualization", "Python (pandas, numpy, scipy)",
  "SQL-style analytical thinking (filtering, grouping, aggregation)",
  "Data Storytelling", "Decision Making",
];

const STATS_COVERED = [
  "Descriptive statistics (mean, median, mode, percentiles, IQR, outliers)",
  "Categorical & numerical association, covariance, correlation, fitted lines",
  "Set-theoretic probability (union, intersection, complement, conditional)",
  "Bayes' theorem",
  "Empirical independence checks",
  "Permutations, combinations, counting principles",
  "Discrete random variables: PMF, CDF, expectation, variance, SD",
  "Bernoulli & Binomial distributions",
  "Hypergeometric distribution (sampling without replacement)",
  "Uniform, Triangular & Exponential continuous distributions",
];

const ANALYSES = [
  { title: "Descriptive Statistics", href: "/descriptive", desc: "Central tendency, spread, and outlier detection on order value and session behavior." },
  { title: "Association", href: "/association", desc: "Correlation and group comparisons between behavior, marketing exposure, and purchase." },
  { title: "Probability Engine", href: "/probability", desc: "Live conditional-probability calculator over 5 named business events." },
  { title: "Bayes' Theorem", href: "/bayes", desc: "P(Purchase | Cart) derived two independent ways, shown to agree." },
  { title: "Independence Check", href: "/independence", desc: "Empirical test of whether marketing exposure and purchase behave independently." },
  { title: "Campaign Combinatorics", href: "/combinatorics", desc: "Counting principles applied to campaign design and customer sampling." },
  { title: "Random Variables", href: "/random-variables", desc: "PMF/CDF, expectation, and variance for items purchased and order value." },
  { title: "Conversion Forecast Simulator", href: "/binomial", desc: "Binomial model for forecasting conversions across future sessions." },
  { title: "Campaign Sampling", href: "/hypergeometric", desc: "Hypergeometric model for finite-pool sampling without replacement." },
  { title: "Continuous Distribution Lab", href: "/distributions", desc: "Uniform, triangular, and exponential models for business uncertainty." },
  { title: "Customer Segmentation & Value", href: "/customer-value", desc: "Rule-based segments with full revenue, AOV, and return-rate breakdowns." },
  { title: "Decision Lab", href: "/decision-lab", desc: "Every finding translated into a decision, with its limitation stated." },
];

export default function CaseStudyPage() {
  const es = data.executive_summary;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Case Study"
        title="CommerceLens: Turning Customer Behavior Into a Probability Problem"
        description="A portfolio analytics product demonstrating the full path from raw session data to business decisions — descriptive statistics, association, conditional probability, Bayes' theorem, random variables, and distribution modeling, all computed live from a 60,000-session synthetic dataset."
      />

      {/* Problem */}
      <Section title="Problem">
        <p>
          E-commerce teams generate huge volumes of session-level behavioral data, but most internal dashboards stop
          at descriptive reporting: conversion rate, revenue, AOV. They rarely go further to ask the harder,
          probability-shaped questions a business actually needs answered to act with confidence under uncertainty:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>What is the probability a given type of session converts, and how does that change conditional on observed behavior?</li>
          <li>How many conversions should we expect from N future sessions, and how much should that estimate vary?</li>
          <li>If we sample a fixed number of customers from a finite campaign pool, what&rsquo;s the chance we land enough high-value customers?</li>
          <li>Which behavioral signals are genuinely associated with purchase, and which are just noise or a confound?</li>
        </ul>
        <p>
          CommerceLens builds a small analytics product that answers these questions directly, with every chart tied
          to an explicit business question and every number computed live from data rather than asserted.
        </p>
      </Section>

      {/* Dataset */}
      <Section title="Dataset">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Sessions" value={fmtNum(data.dataset_meta.n_rows, 0)} />
          <StatCard label="Columns" value={fmtNum(data.dataset_meta.n_columns, 0)} />
          <StatCard label="Unique Customers" value={fmtNum(data.dataset_meta.n_customers, 0)} />
          <StatCard label="Date Range" value={`${data.dataset_meta.date_min} – ${data.dataset_meta.date_max}`} />
        </div>
        <p>
          A synthetic but statistically realistic session-level e-commerce dataset, generated by a seeded,
          reproducible Python script (<code className="font-mono text-xs">data/generate_dataset.py</code>). Variables
          are intentionally correlated the way a real marketplace would be — add-to-cart raises purchase probability
          but doesn&rsquo;t guarantee it; order value is right-skewed with a small tail of legitimately large orders;
          returning customers behave differently from new ones — with irreducible random noise layered on top so
          nothing is deterministic. Every relationship discussed on this site is verified against{" "}
          <Link href="/limitations" className="underline underline-offset-2">documented limitations</Link>, not
          presented as a real-world finding.
        </p>
      </Section>

      {/* Approach */}
      <Section title="Approach">
        <ol className="ml-5 list-decimal space-y-2">
          <li><strong>Generate</strong> the dataset from scratch with a fixed seed (Python, numpy, pandas) and validate it (33 automated integrity checks — see <Link href="#tech" className="underline underline-offset-2">Technical Implementation</Link>).</li>
          <li><strong>Analyze</strong> with reusable, unit-tested Python modules — descriptive statistics, association, probability, Bayes, combinatorics, random variables, distributions, campaign sampling, and customer value — never inline math in the UI layer.</li>
          <li><strong>Compute once, ship everywhere</strong>: a single script (<code className="font-mono text-xs">analytics/run_all.py</code>) runs every module against the real data and writes one JSON payload. The website reads that payload — nothing on the site is hand-typed.</li>
          <li><strong>Build the product</strong> in Next.js/TypeScript with a parallel TypeScript analytics layer (mirroring the Python modules) so the interactive calculators — the Probability Engine, Conversion Forecast Simulator, Campaign Sampling tool, Distribution Lab — compute live, client-side, in response to user input.</li>
          <li><strong>Frame every result as a business question</strong>: Business Question → Metric → Observation → Interpretation → Caveat, on every major chart.</li>
        </ol>
      </Section>

      {/* Key analyses */}
      <Section title="Key Analyses">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ANALYSES.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    {a.title}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{a.desc}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Key findings */}
      <Section title="Key Findings">
        <div className="grid gap-4 md:grid-cols-2">
          <Finding
            stat={fmtPct(data.probability_engine.P_purchase_given_cart)}
            label="P(Purchase | Add to Cart)"
            body={`vs. a baseline conversion rate of ${fmtPct(data.probability_engine.P_purchase)} — sessions with a cart event convert at roughly ${(data.probability_engine.P_purchase_given_cart / data.probability_engine.P_purchase).toFixed(1)}x the baseline rate in this sample.`}
          />
          <Finding
            stat={fmtINR(es.aov)}
            label="Average Order Value"
            body={`vs. a median of ${fmtINR(es.median_order_value)} — the gap reflects a right-skewed order-value distribution with a small tail of large orders.`}
          />
          <Finding
            stat={fmtPct(es.return_rate)}
            label="Overall Return Rate"
            body="Return propensity varies materially by product category — see Customer Value for the full breakdown."
          />
          <Finding
            stat={fmtPct(es.repeat_customer_rate)}
            label="Repeat Customer Rate"
            body="Share of sessions from customers with at least one prior order, by the dataset's rule-based segment definition."
          />
        </div>
      </Section>

      {/* Business implications */}
      <Section title="Business Implications">
        <p>
          Every finding on this site is deliberately translated into a business decision with its assumptions made
          explicit — see the <Link href="/decision-lab" className="underline underline-offset-2">Decision Lab</Link>{" "}
          for the full What-did-we-observe / What-does-it-mean / What-decision-could-it-inform / What&rsquo;s-the-limitation
          treatment applied to five real findings (discount exposure, cart behavior, segment differences, category
          return rates, and channel performance). The throughline: an observed association can inform where to test
          or invest next, but it does not by itself justify a causal claim or a guaranteed outcome.
        </p>
      </Section>

      {/* Limitations */}
      <Section title="Limitations">
        <p>
          This is a demonstration of analytical method on a synthetic, observational dataset — not a real-world
          research finding. See the dedicated{" "}
          <Link href="/limitations" className="underline underline-offset-2">Limitations page</Link> for the full
          list: synthetic data, observational (non-experimental) design, distributional and independence assumptions,
          sample-dependent empirical probabilities, and the specific caveats for the binomial, hypergeometric,
          uniform, triangular, and exponential models used throughout.
        </p>
      </Section>

      {/* Technical implementation */}
      <Section title="Technical Implementation" id="tech">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Data & Analytics (Python)</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm text-muted-foreground">
              <TechRow>pandas, numpy, scipy for generation and analysis</TechRow>
              <TechRow>9 reusable analytics modules, no inline math in the UI</TechRow>
              <TechRow>60 pytest unit tests covering every module, including edge cases</TechRow>
              <TechRow>33 automated dataset validation checks</TechRow>
              <TechRow>One script (run_all.py) computes every number the site displays</TechRow>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Product (Next.js / TypeScript)</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm text-muted-foreground">
              <TechRow>Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui</TechRow>
              <TechRow>Recharts-based chart components on a validated, accessible color system</TechRow>
              <TechRow>TypeScript mirrors of the Python analytics for live client-side calculators</TechRow>
              <TechRow>Server-side filtering API for the Data Explorer — the full dataset never reaches the browser</TechRow>
              <TechRow>Every chart-bearing section follows Business Question → Metric → Observation → Interpretation → Caveat</TechRow>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Statistics covered */}
      <Section title="Statistics & Probability Covered">
        <div className="flex flex-wrap gap-2">
          {STATS_COVERED.map((s) => (
            <Badge key={s} variant="secondary" className="font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </Section>

      {/* Skills demonstrated */}
      <Section title="Skills Demonstrated">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--status-good)" }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      {/* Interactive demo CTA */}
      <Section title="Interactive Demo">
        <p>The whole point of CommerceLens is that it&rsquo;s not a static report — try it directly:</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({})}>
            Executive Dashboard <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
          <Link href="/probability" className={buttonVariants({ variant: "outline" })}>
            Probability Engine
          </Link>
          <Link href="/binomial" className={buttonVariants({ variant: "outline" })}>
            Conversion Forecast Simulator
          </Link>
          <Link href="/data-explorer" className={buttonVariants({ variant: "outline" })}>
            Data Explorer
          </Link>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Finding({ stat, label, body }: { stat: string; label: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-semibold tabular-nums" style={{ color: "var(--series-1)" }}>
          {stat}
        </div>
        <div className="mt-1 text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{body}</div>
      </CardContent>
    </Card>
  );
}

function TechRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--series-1)" }} />
      <span>{children}</span>
    </div>
  );
}
