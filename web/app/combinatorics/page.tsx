"use client";

import { useMemo, useState, type ReactNode } from "react";
import { data, fmtNum } from "@/lib/data";
import {
  factorial,
  permutations,
  combinations,
  permutationsWithRepetition,
  countingPrinciple,
} from "@/lib/analytics/mathUtils";
import { PageHeader } from "@/components/viz/page-header";
import { StatCard } from "@/components/viz/stat-card";
import { ExplainLevels } from "@/components/viz/explain-levels";
import { FormulaBlock } from "@/components/viz/formula-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const ce = data.combinatorics_examples;

/** Large combinatorial counts can run into the hundreds of digits; render
 * them in scientific notation past a reasonable display threshold. */
function formatBig(x: number): string {
  if (!Number.isFinite(x)) return "too large to represent";
  if (Math.abs(x) < 1e15) return fmtNum(x, 0);
  const exp = x.toExponential(4);
  const [mantissa, power] = exp.split("e");
  const sign = power.startsWith("-") ? "-" : "";
  return `${mantissa} × 10^${sign}${power.replace("+", "").replace("-", "")}`;
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--status-serious)" }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</div>;
}

export default function CombinatoricsPage() {
  // --- Factorial calculator ---
  const [factN, setFactN] = useState(5);
  const factResult = useMemo(() => {
    try {
      if (!Number.isInteger(factN) || factN < 0) throw new Error("n must be a non-negative integer");
      if (factN > 170) throw new Error("n must be at most 170 to avoid numeric overflow");
      return { value: factorial(factN), error: null as string | null };
    } catch (e) {
      return { value: null as number | null, error: (e as Error).message };
    }
  }, [factN]);

  // --- Campaign offer assignment (permutations) ---
  const [nOfferTypes, setNOfferTypes] = useState(ce.campaign_assignment.n_offer_types);
  const [nSegments, setNSegments] = useState(ce.campaign_assignment.n_segments);
  const assignmentResult = useMemo(() => {
    try {
      if (!Number.isInteger(nOfferTypes) || !Number.isInteger(nSegments) || nOfferTypes < 0 || nSegments < 0) {
        throw new Error("both values must be non-negative integers");
      }
      if (nSegments > nOfferTypes) throw new Error("number of segments (r) cannot exceed number of offer types (n)");
      return { value: permutations(nOfferTypes, nSegments), error: null as string | null };
    } catch (e) {
      return { value: null as number | null, error: (e as Error).message };
    }
  }, [nOfferTypes, nSegments]);
  const unrestrictedTotal = useMemo(() => {
    if (!Number.isInteger(nOfferTypes) || !Number.isInteger(nSegments) || nOfferTypes < 0 || nSegments < 0) return null;
    return countingPrinciple(Array(nSegments).fill(nOfferTypes));
  }, [nOfferTypes, nSegments]);

  // --- Campaign sample (combinations, large N) ---
  const [poolN, setPoolN] = useState(1000);
  const [sampleK, setSampleK] = useState(20);
  const sampleResult = useMemo(() => {
    try {
      if (!Number.isInteger(poolN) || !Number.isInteger(sampleK) || poolN < 0 || sampleK < 0) {
        throw new Error("N and k must be non-negative integers");
      }
      if (sampleK > poolN) throw new Error("k cannot exceed N");
      return { value: combinations(poolN, sampleK), error: null as string | null };
    } catch (e) {
      return { value: null as number | null, error: (e as Error).message };
    }
  }, [poolN, sampleK]);

  // --- Product bundle design (combinations, small n) ---
  const [assortmentN, setAssortmentN] = useState(12);
  const [bundleK, setBundleK] = useState(3);
  const bundleResult = useMemo(() => {
    try {
      if (!Number.isInteger(assortmentN) || !Number.isInteger(bundleK) || assortmentN < 0 || bundleK < 0) {
        throw new Error("n and k must be non-negative integers");
      }
      if (bundleK > assortmentN) throw new Error("k cannot exceed n");
      return { value: combinations(assortmentN, bundleK), error: null as string | null };
    } catch (e) {
      return { value: null as number | null, error: (e as Error).message };
    }
  }, [assortmentN, bundleK]);

  // --- Permutations with repetition (interactive: slot rotation of two
  // indistinguishable-within-group offer types) ---
  const [repCountA, setRepCountA] = useState(3);
  const [repCountB, setRepCountB] = useState(2);
  const repSlots = repCountA + repCountB;
  const repResult = useMemo(() => {
    try {
      if (
        !Number.isInteger(repCountA) ||
        !Number.isInteger(repCountB) ||
        repCountA < 0 ||
        repCountB < 0
      ) {
        throw new Error("both group sizes must be non-negative integers");
      }
      if (repSlots === 0) throw new Error("at least one slot is required");
      return {
        value: permutationsWithRepetition(repSlots, [repCountA, repCountB]),
        error: null as string | null,
      };
    } catch (e) {
      return { value: null as number | null, error: (e as Error).message };
    }
  }, [repCountA, repCountB, repSlots]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Probability"
        title="Campaign & Recommendation Combinatorics"
        description="Counting problems show up constantly in campaign design: how many ways can offers be assigned to segments, how many distinct samples can a targeting list draw, how many bundle variants exist? The key distinction throughout is whether order matters (permutations) or doesn't (combinations)."
        badge="Interactive"
      />

      {/* Counting principle & factorials */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Counting Principle &amp; Factorials</h2>
        <Card>
          <CardHeader>
            <CardTitle>Factorial</CardTitle>
            <CardDescription>
              n! counts the number of ways to arrange n distinct items in a sequence &mdash; order matters at every
              step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormulaBlock label={`Worked example: ${ce.factorial_5}! `}>
              {"5! = 5 × 4 × 3 × 2 × 1 = 120"}
            </FormulaBlock>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-64 space-y-1.5">
                <FieldLabel>n (0&ndash;15)</FieldLabel>
                <Slider value={[factN]} onValueChange={(v) => setFactN((v as number[])[0])} min={0} max={15} step={1} />
              </div>
              <Input
                type="number"
                className="w-24"
                min={0}
                max={170}
                value={factN}
                onChange={(e) => setFactN(Number(e.target.value))}
              />
            </div>
            {factResult.error ? (
              <ErrorNote>{factResult.error}</ErrorNote>
            ) : (
              <StatCard label={`${factN}!`} value={formatBig(factResult.value!)} accent="var(--series-1)" />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Campaign offer assignment — permutations */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Campaign Offer Assignment</h2>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Order Matters &mdash; Permutations</CardTitle>
              <Badge variant="outline">Order matters</Badge>
            </div>
            <CardDescription>
              Assigning a distinct offer to each segment is an ordered arrangement: giving Segment 1 the &ldquo;10%
              off&rdquo; offer and Segment 2 &ldquo;free shipping&rdquo; is a different assignment than swapping
              them. Each segment plays a distinct role, so we use permutations, not combinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Offer types (n)</FieldLabel>
                <Input
                  type="number"
                  className="w-28"
                  min={0}
                  value={nOfferTypes}
                  onChange={(e) => setNOfferTypes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Segments (r)</FieldLabel>
                <Input
                  type="number"
                  className="w-28"
                  min={0}
                  value={nSegments}
                  onChange={(e) => setNSegments(Number(e.target.value))}
                />
              </div>
            </div>
            <FormulaBlock label="Distinct offer per segment">
              {`P(n, r) = n! / (n − r)! = ${nOfferTypes}! / (${nOfferTypes} − ${nSegments})!`}
            </FormulaBlock>
            {assignmentResult.error ? (
              <ErrorNote>{assignmentResult.error}</ErrorNote>
            ) : (
              <StatCard
                label={`Distinct assignments (P(${nOfferTypes}, ${nSegments}))`}
                value={formatBig(assignmentResult.value!)}
                accent="var(--series-2)"
              />
            )}
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Unrestricted case: any offer can repeat across segments
              </div>
              <div className="font-mono">
                Counting principle: {nOfferTypes}
                {Array(Math.max(nSegments - 1, 0)).fill(` × ${nOfferTypes}`).join("")} ={" "}
                {unrestrictedTotal !== null ? formatBig(unrestrictedTotal) : "—"}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Choosing a campaign sample — combinations */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Choosing a Campaign Sample</h2>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Order Does Not Matter &mdash; Combinations</CardTitle>
              <Badge variant="outline">Order doesn&rsquo;t matter</Badge>
            </div>
            <CardDescription>
              Choosing which k customers out of a pool of N receive a campaign is a selection, not a sequence &mdash;
              two different customers picked in either order form the same sample. We use combinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>Pool size (N)</FieldLabel>
                <Slider value={[poolN]} onValueChange={(v) => setPoolN((v as number[])[0])} min={1} max={5000} step={1} />
                <Input type="number" className="w-28" min={0} value={poolN} onChange={(e) => setPoolN(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Sample size (k)</FieldLabel>
                <Slider value={[sampleK]} onValueChange={(v) => setSampleK((v as number[])[0])} min={0} max={Math.max(poolN, 1)} step={1} />
                <Input type="number" className="w-28" min={0} value={sampleK} onChange={(e) => setSampleK(Number(e.target.value))} />
              </div>
            </div>
            <FormulaBlock label="Combinations">{`C(N, k) = N! / [k! (N − k)!] = ${poolN}! / [${sampleK}! (${poolN} − ${sampleK})!]`}</FormulaBlock>
            {sampleResult.error ? (
              <ErrorNote>{sampleResult.error}</ErrorNote>
            ) : (
              <StatCard
                label={`Distinct samples (C(${poolN}, ${sampleK}))`}
                value={formatBig(sampleResult.value!)}
                accent="var(--series-3)"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Reference value from the precomputed payload: choosing 20 from a pool of 1,000 gives{" "}
              {formatBig(ce.choose_20_from_pool_1000)} distinct samples.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Product bundle design — combinations */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Product Bundle Design</h2>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Order Does Not Matter &mdash; Combinations</CardTitle>
              <Badge variant="outline">Order doesn&rsquo;t matter</Badge>
            </div>
            <CardDescription>
              A bundle of k products chosen from an assortment of n is an unordered set &mdash; a bundle of {"{A, B, C}"} is
              the same bundle regardless of the order the products were added.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>Assortment size (n)</FieldLabel>
                <Slider value={[assortmentN]} onValueChange={(v) => setAssortmentN((v as number[])[0])} min={1} max={50} step={1} />
                <Input type="number" className="w-28" min={0} value={assortmentN} onChange={(e) => setAssortmentN(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Bundle size (k)</FieldLabel>
                <Slider value={[bundleK]} onValueChange={(v) => setBundleK((v as number[])[0])} min={0} max={Math.max(assortmentN, 1)} step={1} />
                <Input type="number" className="w-28" min={0} value={bundleK} onChange={(e) => setBundleK(Number(e.target.value))} />
              </div>
            </div>
            <FormulaBlock label="Combinations">{`C(n, k) = n! / [k! (n − k)!] = ${assortmentN}! / [${bundleK}! (${assortmentN} − ${bundleK})!]`}</FormulaBlock>
            {bundleResult.error ? (
              <ErrorNote>{bundleResult.error}</ErrorNote>
            ) : (
              <StatCard
                label={`Distinct bundles (C(${assortmentN}, ${bundleK}))`}
                value={formatBig(bundleResult.value!)}
                accent="var(--series-4)"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Reference value: choosing a bundle of 3 from an assortment of 12 gives {formatBig(ce.bundle_3_from_12)}{" "}
              distinct bundles.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Permutations with repetition */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Arranging a Campaign Slot Sequence with Repeats</h2>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Order Matters, with Repeated Items</CardTitle>
              <Badge variant="outline">Order matters</Badge>
            </div>
            <CardDescription>
              A campaign banner rotation fills a sequence of slots with copies of two offers &mdash; by default 3
              copies of &ldquo;Offer A&rdquo; and 2 copies of &ldquo;Offer B&rdquo;. Because the copies of the same
              offer are indistinguishable from one another, we divide out the repeated arrangements. Adjust the group
              sizes below to see the count update live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>Copies of Offer A (n₁)</FieldLabel>
                <Slider value={[repCountA]} onValueChange={(v) => setRepCountA((v as number[])[0])} min={0} max={10} step={1} />
                <Input type="number" className="w-28" min={0} value={repCountA} onChange={(e) => setRepCountA(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Copies of Offer B (n₂)</FieldLabel>
                <Slider value={[repCountB]} onValueChange={(v) => setRepCountB((v as number[])[0])} min={0} max={10} step={1} />
                <Input type="number" className="w-28" min={0} value={repCountB} onChange={(e) => setRepCountB(Number(e.target.value))} />
              </div>
            </div>
            <FormulaBlock label="Permutations with repetition">
              {`n! / (n₁! · n₂!) = ${repSlots}! / (${repCountA}! · ${repCountB}!) = ${repResult.error ? "—" : formatBig(repResult.value!)}`}
            </FormulaBlock>
            {repResult.error ? (
              <ErrorNote>{repResult.error}</ErrorNote>
            ) : (
              <StatCard
                label="Distinct slot sequences"
                value={formatBig(repResult.value!)}
                sublabel={`${repSlots} slots: ${repCountA}× Offer A, ${repCountB}× Offer B`}
                accent="var(--series-5)"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Permutations vs. Combinations</h2>
        <ExplainLevels
          simple={
            <p>
              Ask yourself one question: if I rearranged the chosen items, would I get something different?
              Assigning offer &ldquo;10% off&rdquo; to Segment A and &ldquo;free shipping&rdquo; to Segment B is not
              the same as the reverse &mdash; <strong>order matters</strong>, so that&rsquo;s a permutation. But
              picking the same 20 customers for a campaign, regardless of the order you clicked their names &mdash;{" "}
              <strong>order doesn&rsquo;t matter</strong> &mdash; is a combination.
            </p>
          }
          math={
            <div className="space-y-3">
              <FormulaBlock label="Permutations">{"P(n, r) = n! / (n − r)!"}</FormulaBlock>
              <FormulaBlock label="Combinations">{"C(n, r) = n! / [r! (n − r)!] = P(n, r) / r!"}</FormulaBlock>
            </div>
          }
          applied={
            <p>
              Reference values from the precomputed payload: P(5, 2) = {ce.permutations_5_choose_2} and{" "}
              C(5, 2) = {ce.combinations_5_choose_2} &mdash; the combination count is smaller because it doesn&rsquo;t
              double-count the two orderings of each pair.
            </p>
          }
        />
      </section>
    </div>
  );
}
