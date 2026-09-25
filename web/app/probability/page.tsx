"use client";

import { useMemo, useState } from "react";
import { data, fmtPct } from "@/lib/data";
import {
  EVENT_LABELS,
  type EventKey,
  pEvent,
  pComplement,
  pIntersection,
  pUnion,
  pConditional,
} from "@/lib/analytics/probability";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { CaveatNote } from "@/components/viz/business-question";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_KEYS = Object.keys(EVENT_LABELS) as EventKey[];

type Op = "single" | "complement" | "intersection" | "union" | "conditional";

const OP_LABELS: Record<Op, string> = {
  single: "P(A)",
  complement: "P(Aᶜ)",
  intersection: "P(A ∩ B)",
  union: "P(A ∪ B)",
  conditional: "P(A | B)",
};

const OPS_NEEDING_B: Op[] = ["intersection", "union", "conditional"];

const pe = data.probability_engine;

const REFERENCE_ROWS: { notation: string; value: number; sentence: string }[] = [
  { notation: "P(P)", value: pe.P_purchase, sentence: `About ${fmtPct(pe.P_purchase)} of all sessions result in a purchase.` },
  { notation: "P(C)", value: pe.P_cart, sentence: `About ${fmtPct(pe.P_cart)} of all sessions include an add-to-cart event.` },
  { notation: "P(D)", value: pe.P_discount, sentence: `About ${fmtPct(pe.P_discount)} of all sessions are exposed to a discount.` },
  { notation: "P(R)", value: pe.P_returning, sentence: `About ${fmtPct(pe.P_returning)} of all sessions come from a returning customer.` },
  { notation: "P(M)", value: pe.P_mobile, sentence: `About ${fmtPct(pe.P_mobile)} of all sessions come from a mobile device.` },
  { notation: "P(P ∩ C)", value: pe.P_purchase_and_cart, sentence: `About ${fmtPct(pe.P_purchase_and_cart)} of all sessions both add to cart and purchase.` },
  { notation: "P(P ∪ C)", value: pe.P_purchase_or_cart, sentence: `About ${fmtPct(pe.P_purchase_or_cart)} of all sessions either add to cart, purchase, or both.` },
  { notation: "Pᶜ(P)", value: pe.P_purchase_complement, sentence: `About ${fmtPct(pe.P_purchase_complement)} of all sessions do NOT result in a purchase.` },
  { notation: "P(P | C)", value: pe.P_purchase_given_cart, sentence: `Given a session added to cart, there is a ${fmtPct(pe.P_purchase_given_cart)} chance it also resulted in a purchase.` },
  { notation: "P(P | D)", value: pe.P_purchase_given_discount, sentence: `Given a session was exposed to a discount, there is a ${fmtPct(pe.P_purchase_given_discount)} chance it resulted in a purchase.` },
  { notation: "P(P | R)", value: pe.P_purchase_given_returning, sentence: `Given a session came from a returning customer, there is a ${fmtPct(pe.P_purchase_given_returning)} chance it resulted in a purchase.` },
  { notation: "P(P | M)", value: pe.P_purchase_given_mobile, sentence: `Given a session came from a mobile device, there is a ${fmtPct(pe.P_purchase_given_mobile)} chance it resulted in a purchase.` },
];

export default function ProbabilityPage() {
  const [op, setOp] = useState<Op>("conditional");
  const [eventA, setEventA] = useState<EventKey>("P");
  const [eventB, setEventB] = useState<EventKey>("C");

  const needsB = OPS_NEEDING_B.includes(op);

  const result = useMemo(() => {
    switch (op) {
      case "single":
        return pEvent(eventA);
      case "complement":
        return pComplement(eventA);
      case "intersection":
        return pIntersection([eventA, eventB]);
      case "union":
        return pUnion(eventA, eventB);
      case "conditional":
        return pConditional([eventA], [eventB]);
    }
  }, [op, eventA, eventB]);

  const labelA = EVENT_LABELS[eventA];
  const labelB = EVENT_LABELS[eventB];

  const formula = useMemo(() => {
    switch (op) {
      case "single":
        return `P(${eventA}) = P(${labelA})`;
      case "complement":
        return `P(${eventA}ᶜ) = 1 − P(${eventA}) = 1 − P(${labelA})`;
      case "intersection":
        return `P(${eventA} ∩ ${eventB}) = P(${labelA} AND ${labelB})`;
      case "union":
        return `P(${eventA} ∪ ${eventB}) = P(${eventA}) + P(${eventB}) − P(${eventA} ∩ ${eventB})`;
      case "conditional":
        return `P(${eventA} | ${eventB}) = P(${eventA} ∩ ${eventB}) / P(${eventB})`;
    }
  }, [op, eventA, eventB, labelA, labelB]);

  const sentence = useMemo(() => {
    switch (op) {
      case "single":
        return `About ${fmtPct(result)} of all sessions included the event "${labelA}".`;
      case "complement":
        return `About ${fmtPct(result)} of all sessions did NOT include the event "${labelA}".`;
      case "intersection":
        return `About ${fmtPct(result)} of all sessions included both "${labelA}" and "${labelB}".`;
      case "union":
        return `About ${fmtPct(result)} of all sessions included "${labelA}", "${labelB}", or both.`;
      case "conditional":
        return `Given a session included "${labelB}", there is a ${fmtPct(result)} chance it also included "${labelA}".`;
    }
  }, [op, result, labelA, labelB]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Probability"
        title="Probability Engine"
        description="Every figure below is computed live, client-side, from a real bit-packed record of five boolean events observed across all 60,000 sessions in the dataset."
        badge="Interactive"
      />

      <section>
        <h2 className="mb-4 text-lg font-medium">The Five Named Events</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {EVENT_KEYS.map((k) => (
            <div key={k} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event {k}</div>
              <div className="mt-1.5 text-base font-semibold">{EVENT_LABELS[k]}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Reference Table</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These are the core probability statements used elsewhere on the site, computed once from the full sample.
        </p>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Notation</TableHead>
                  <TableHead className="w-24">Value</TableHead>
                  <TableHead>Plain-language meaning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REFERENCE_ROWS.map((r) => (
                  <TableRow key={r.notation}>
                    <TableCell className="font-mono text-sm">{r.notation}</TableCell>
                    <TableCell className="font-mono tabular-nums">{fmtPct(r.value)}</TableCell>
                    <TableCell className="whitespace-normal text-sm text-muted-foreground">{r.sentence}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Build Your Own Probability</h2>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Calculator</CardTitle>
            <CardDescription>
              Pick an operation and one or two events. The result is computed live from the underlying session-level
              data &mdash; not looked up from a static table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Operation</div>
                <Select value={op} onValueChange={(v) => setOp(v as Op)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(OP_LABELS) as Op[]).map((o) => (
                      <SelectItem key={o} value={o}>
                        {OP_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {needsB && (
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
              )}
            </div>

            {needsB && eventA === eventB && (
              <p className="text-xs" style={{ color: "var(--status-warning)" }}>
                Event A and Event B are the same &mdash; the result below is still computed correctly, but it is not a
                meaningful comparison between two distinct behaviors.
              </p>
            )}

            <FormulaBlock label={OP_LABELS[op]}>{formula}</FormulaBlock>

            <div className="grid gap-4 md:grid-cols-2">
              <StatCard label={OP_LABELS[op]} value={fmtPct(result)} accent="var(--series-1)" />
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
                {sentence}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Understanding Conditional Probability</h2>
        <ExplainLevels
          simple={
            <p>
              Conditional probability asks: &ldquo;given that we already know one thing happened, how likely is a
              second thing?&rdquo; For example, once we know a customer added something to their cart, how likely are
              they to actually buy it? Restricting our view to a subgroup (cart sessions) often changes the odds
              compared to looking at all sessions.
            </p>
          }
          math={
            <FormulaBlock label="Definition">
              {"P(A | B) = P(A ∩ B) / P(B),  for P(B) > 0"}
            </FormulaBlock>
          }
          applied={
            <p>
              In this dataset, P(Purchase) across all sessions is {fmtPct(pe.P_purchase)}, but once we condition on
              having added to cart, P(Purchase | Cart) rises to {fmtPct(pe.P_purchase_given_cart)}. That is computed
              as P(Purchase ∩ Cart) / P(Cart) = {fmtPct(pe.P_purchase_and_cart)} / {fmtPct(pe.P_cart)}.
            </p>
          }
        />
      </section>

      <CaveatNote>
        All probabilities on this page are <strong>empirical</strong> &mdash; relative frequencies computed directly
        from the 60,000 sessions in this sample &mdash; not theoretical population parameters. They describe
        observed association, not causation, and would carry sampling uncertainty if estimated from a different
        sample of the same population.
      </CaveatNote>
    </div>
  );
}
