"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { data, fmtPct, fmtNum } from "@/lib/data";
import { EVENT_LABELS, type EventKey, pEvent, pConditional } from "@/lib/analytics/probability";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_KEYS = Object.keys(EVENT_LABELS) as EventKey[];

export default function BayesPage() {
  const b = data.bayes;
  const numerator = b.p_cart_given_purchase * b.p_purchase;

  const [outcome, setOutcome] = useState<EventKey>("P");
  const [evidence, setEvidence] = useState<EventKey>("D");
  const sameEvent = outcome === evidence;

  const live = useMemo(() => {
    if (sameEvent) return null;
    const pA = pEvent(outcome);
    const pB = pEvent(evidence);
    const pBGivenA = pConditional([evidence], [outcome]);
    const bayesResult = pB > 0 ? (pBGivenA * pA) / pB : 0;
    const directResult = pConditional([outcome], [evidence]);
    return {
      pA,
      pB,
      pBGivenA,
      bayesResult,
      directResult,
      absoluteDifference: Math.abs(bayesResult - directResult),
    };
  }, [outcome, evidence, sameEvent]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Probability"
        title="Bayes' Theorem"
        description={`Worked example: given that a session contains an add-to-cart event, what is the probability it results in a purchase? Bayes' theorem lets us get there starting from P(Cart | Purchase) instead of measuring P(Purchase | Cart) directly.`}
        badge="Interactive"
      />

      <section>
        <h2 className="mb-4 text-lg font-medium">The Formula</h2>
        <FormulaBlock label="Bayes' Theorem">
          {"P(Purchase | Cart) = [ P(Cart | Purchase) · P(Purchase) ] / P(Cart)"}
        </FormulaBlock>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Plugging In the Numbers</h2>
        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step</CardTitle>
            <CardDescription>Every value below comes directly from data.bayes in the precomputed analytics payload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Step n={1} label="Start with P(Cart | Purchase)" value={`${fmtPct(b.p_cart_given_purchase)} — among sessions that purchased, this share also added to cart.`} />
            <Step n={2} label="Multiply by the base rate P(Purchase)" value={`${fmtPct(b.p_cart_given_purchase)} × ${fmtPct(b.p_purchase)} = ${fmtPct(numerator, 4)}`} />
            <Step n={3} label="Divide by P(Cart)" value={`${fmtPct(numerator, 4)} ÷ ${fmtPct(b.p_cart)} = ${fmtPct(b.p_purchase_given_cart_bayes)}`} />
            <Step n={4} label="Result" value={`P(Purchase | Cart) = ${fmtPct(b.p_purchase_given_cart_bayes)}, computed entirely via Bayes' theorem — without ever directly counting purchase-given-cart sessions.`} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Two Routes, Same Answer</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Direct Empirical Calculation"
            value={fmtPct(b.p_purchase_given_cart_direct)}
            sublabel="P(Purchase ∩ Cart) / P(Cart), counted straight from the data"
            accent="var(--series-1)"
          />
          <StatCard
            label="Bayes' Theorem Calculation"
            value={fmtPct(b.p_purchase_given_cart_bayes)}
            sublabel="[P(Cart|Purchase) · P(Purchase)] / P(Cart)"
            accent="var(--series-2)"
          />
          <StatCard
            label="Absolute Difference"
            value={fmtNum(b.absolute_difference, 6)}
            sublabel="Both routes agree, up to floating point"
            accent="var(--status-good)"
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          The two calculations agree because Bayes&rsquo; theorem is a mathematical identity, not a source of new
          information &mdash; it is simply a different way of arranging the same joint probabilities. It becomes
          genuinely useful in practice when you know P(B | A) from one source (for example, a subgroup study or a lab
          test&rsquo;s known false-positive rate) but cannot directly observe P(A | B).
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Try It Yourself: Any Two Events</h2>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Bayes Calculator</CardTitle>
            <CardDescription>
              Pick any outcome event A and evidence event B. We compute P(A | B) via Bayes&rsquo; theorem &mdash;
              starting only from P(B | A), P(A), and P(B) &mdash; and compare it against the direct empirical
              conditional probability, live from the underlying session-level data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Outcome (A)
                </div>
                <Select value={outcome} onValueChange={(v) => setOutcome(v as EventKey)}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Choose event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {EVENT_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Evidence (B)
                </div>
                <Select value={evidence} onValueChange={(v) => setEvidence(v as EventKey)}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Choose event" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {EVENT_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sameEvent ? (
              <p className="text-sm text-muted-foreground">
                Choose two different events &mdash; Bayes&rsquo; theorem relating an event to itself is not a
                meaningful example.
              </p>
            ) : (
              live && (
                <>
                  <FormulaBlock label="Bayes' Theorem">
                    {`P(${outcome} | ${evidence}) = [ P(${evidence} | ${outcome}) · P(${outcome}) ] / P(${evidence}) = [ ${fmtPct(
                      live.pBGivenA
                    )} × ${fmtPct(live.pA)} ] / ${fmtPct(live.pB)}`}
                  </FormulaBlock>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                      label="Direct Empirical Calculation"
                      value={fmtPct(live.directResult)}
                      sublabel={`P(${outcome} ∩ ${evidence}) / P(${evidence}), counted straight from the data`}
                      accent="var(--series-1)"
                    />
                    <StatCard
                      label="Bayes' Theorem Calculation"
                      value={fmtPct(live.bayesResult)}
                      sublabel={`[P(${evidence}|${outcome}) · P(${outcome})] / P(${evidence})`}
                      accent="var(--series-2)"
                    />
                    <StatCard
                      label="Absolute Difference"
                      value={fmtNum(live.absoluteDifference, 6)}
                      sublabel="Both routes agree, up to floating point"
                      accent="var(--status-good)"
                    />
                  </div>
                </>
              )
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Understanding Bayes&rsquo; Theorem</h2>
        <ExplainLevels
          simple={
            <p>
              Bayes&rsquo; theorem is a way to flip a conditional probability around. If you know how likely evidence
              is <em>given</em> an outcome, you can use it &mdash; together with how common the outcome and the
              evidence are on their own &mdash; to work out how likely the outcome is <em>given</em> the evidence.
              It is the mathematical backbone of updating a belief when new information arrives.
            </p>
          }
          math={
            <FormulaBlock label="General Form">
              {"P(A | B) = [ P(B | A) · P(A) ] / P(B)"}
            </FormulaBlock>
          }
          applied={
            <p>
              On this page, A = Purchase and B = Cart. We used the known values P(Cart | Purchase) ={" "}
              {fmtPct(b.p_cart_given_purchase)}, P(Purchase) = {fmtPct(b.p_purchase)}, and P(Cart) = {fmtPct(b.p_cart)}{" "}
              to derive P(Purchase | Cart) = {fmtPct(b.p_purchase_given_cart_bayes)}, matching the value computed
              directly on the{" "}
              <Link href="/probability" className="underline underline-offset-2">
                Probability Engine
              </Link>{" "}
              page.
            </p>
          }
        />
      </section>

      <CaveatNote>
        This page describes the observed sample. It does not claim that adding an item to a cart{" "}
        <strong>causes</strong> a purchase &mdash; only that the two events are strongly associated in the data.
        Confounding factors (purchase intent, browsing time, discount exposure) plausibly drive both.
      </CaveatNote>
    </div>
  );
}

function Step({ n, label, value }: { n: number; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: "var(--series-1)" }}
      >
        {n}
      </span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 font-mono text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}
