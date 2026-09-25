"use client";

import { useMemo, useState } from "react";
import { data, fmtPct, fmtNum } from "@/lib/data";
import { EVENT_LABELS, type EventKey, independenceCheck } from "@/lib/analytics/probability";
import { PageHeader } from "@/components/viz/page-header";
import { CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_KEYS = Object.keys(EVENT_LABELS) as EventKey[];

const FIXED_COMPARISONS: { key: keyof typeof data.independence; label: string; a: string; b: string }[] = [
  { key: "discount_and_purchase", label: "Discount Exposure × Purchase", a: "Discount Exposure", b: "Purchase" },
  { key: "device_mobile_and_purchase", label: "Mobile Device × Purchase", a: "Mobile User", b: "Purchase" },
  { key: "returning_and_purchase", label: "Returning Customer × Purchase", a: "Returning Customer", b: "Purchase" },
];

type IndependenceResult = {
  p_a: number;
  p_b: number;
  p_a_and_b: number;
  p_a_times_p_b: number;
  absolute_difference: number;
  relative_difference: number;
  appears_independent_in_sample: boolean;
};

function ComparisonCard({
  title,
  labelA,
  labelB,
  result,
}: {
  title: string;
  labelA: string;
  labelB: string;
  result: IndependenceResult;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge
            variant="outline"
            style={{
              borderColor: result.appears_independent_in_sample ? "var(--status-good)" : "var(--status-serious)",
              color: result.appears_independent_in_sample ? "var(--status-good)" : "var(--status-serious)",
            }}
          >
            {result.appears_independent_in_sample ? "Appears independent in sample" : "Departs from independence in sample"}
          </Badge>
        </div>
        <CardDescription>
          A = {labelA}, B = {labelB}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">P(A ∩ B) &mdash; observed</div>
            <div className="mt-1 font-mono text-lg tabular-nums">{fmtPct(result.p_a_and_b, 3)}</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">P(A) · P(B) &mdash; expected if independent</div>
            <div className="mt-1 font-mono text-lg tabular-nums">{fmtPct(result.p_a_times_p_b, 3)}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>P(A) = {fmtPct(result.p_a, 3)}</span>
          <span>P(B) = {fmtPct(result.p_b, 3)}</span>
          <span>Absolute difference = {fmtNum(result.absolute_difference, 4)}</span>
          <span>
            Relative difference ={" "}
            {Number.isFinite(result.relative_difference) ? fmtPct(result.relative_difference, 1) : "n/a"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IndependencePage() {
  const [eventA, setEventA] = useState<EventKey>("P");
  const [eventB, setEventB] = useState<EventKey>("C");

  const sameEvent = eventA === eventB;
  const liveResult = useMemo(() => (sameEvent ? null : independenceCheck(eventA, eventB)), [eventA, eventB, sameEvent]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Probability"
        title="Independence Check"
        description="Two events A and B are independent when knowing one happened tells you nothing about the other. Formally, that means P(A ∩ B) should equal the product P(A) · P(B). We check that against the observed sample for several event pairs."
        badge="Interactive"
      />

      <section>
        <h2 className="mb-4 text-lg font-medium">Three Required Comparisons</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {FIXED_COMPARISONS.map((c) => (
            <ComparisonCard key={c.key} title={c.label} labelA={c.a} labelB={c.b} result={data.independence[c.key]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Check Any Two Events</h2>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Independence Checker</CardTitle>
            <CardDescription>
              Pick any two of the five named events and compute the same comparison live from the underlying
              session-level data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event A</div>
                <Select value={eventA} onValueChange={(v) => setEventA(v as EventKey)}>
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
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event B</div>
                <Select value={eventB} onValueChange={(v) => setEventB(v as EventKey)}>
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
                Choose two different events &mdash; comparing an event with itself is not a meaningful independence
                test.
              </p>
            ) : (
              <>
                <FormulaBlock label="Independence Test">
                  {`P(${eventA} ∩ ${eventB}) =? P(${eventA}) · P(${eventB})`}
                </FormulaBlock>
                {liveResult && (
                  <ComparisonCard
                    title={`${EVENT_LABELS[eventA]} × ${EVENT_LABELS[eventB]}`}
                    labelA={EVENT_LABELS[eventA]}
                    labelB={EVENT_LABELS[eventB]}
                    result={liveResult}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Understanding Independence</h2>
        <ExplainLevels
          simple={
            <p>
              Two behaviors are independent if seeing one gives you no extra information about the other. If mobile
              usage and purchasing were perfectly independent, the mobile purchase rate would equal the overall
              purchase rate exactly. In real data, small gaps between the observed and expected joint probability are
              normal even under independence, purely from sampling noise.
            </p>
          }
          math={
            <FormulaBlock label="Definition">{"A ⟂ B  ⟺  P(A ∩ B) = P(A) · P(B)"}</FormulaBlock>
          }
          applied={
            <p>
              For discount exposure and purchase, P(A ∩ B) = {fmtPct(data.independence.discount_and_purchase.p_a_and_b, 3)}{" "}
              versus an expected P(A)·P(B) = {fmtPct(data.independence.discount_and_purchase.p_a_times_p_b, 3)} if
              independent &mdash; a gap large enough that the sample departs from independence. By contrast, mobile
              device and purchase are much closer: {fmtPct(data.independence.device_mobile_and_purchase.p_a_and_b, 3)}{" "}
              observed versus {fmtPct(data.independence.device_mobile_and_purchase.p_a_times_p_b, 3)} expected.
            </p>
          }
        />
      </section>

      <CaveatNote>
        This is an empirical comparison under the observed dataset &mdash; a small absolute difference does{" "}
        <strong>not</strong> constitute a formal statistical proof of independence, and should not be presented as
        such. A proper test (e.g. a chi-squared test of independence) would need to account for sample size and
        sampling variability before drawing that conclusion.
      </CaveatNote>
    </div>
  );
}
