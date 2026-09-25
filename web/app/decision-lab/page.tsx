"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Eye, FlaskConical, Lightbulb, Target } from "lucide-react";
import { data, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { CaveatNote } from "@/components/viz/business-question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DecisionLabPage() {
  const discountTrue = data.association.discount_x_purchase["True"]?.rate ?? 0;
  const discountFalse = data.association.discount_x_purchase["False"]?.rate ?? 0;
  const pPurchase = data.probability_engine.P_purchase;

  const pCart = data.probability_engine.P_purchase_given_cart;

  const loyal = data.conversion_by_segment["Loyal"];
  const newSeg = data.conversion_by_segment["New"];
  const regular = data.conversion_by_segment["Regular"];
  const occasional = data.conversion_by_segment["Occasional"];

  const categoryEntries = Object.entries(data.customer_value_by_category);
  const highestReturn = categoryEntries.reduce((a, b) => (b[1].return_rate > a[1].return_rate ? b : a));
  const lowestReturn = categoryEntries.reduce((a, b) => (b[1].return_rate < a[1].return_rate ? b : a));

  const channelEntries = Object.entries(data.association.channel_x_purchase).sort((a, b) => b[1].rate - a[1].rate);
  const highestChannel = channelEntries[0];
  const lowestChannel = channelEntries[channelEntries.length - 1];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Business"
        title="Decision Lab"
        badge="Observational, not causal"
        description="This page translates five statistical findings from elsewhere on the site into business decisions, without claiming causation."
      />

      <Card className="border-border/80">
        <CardContent className="flex gap-3 pt-6 text-sm leading-relaxed">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--series-1)" }} />
          <div>
            <p>
              Every finding below is a real, observational pattern in this dataset. None of it was produced by a
              randomized experiment, so none of it should be read as proof that changing one variable causes a change
              in another. The governing rule for this entire page:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--status-critical)", backgroundColor: "color-mix(in srgb, var(--status-critical) 8%, transparent)" }}>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--status-critical)" }}>Forbidden phrasing</div>
                <div className="mt-1 font-mono text-sm">&ldquo;Discounts cause purchases.&rdquo;</div>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--status-good)", backgroundColor: "color-mix(in srgb, var(--status-good) 8%, transparent)" }}>
                <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--status-good)" }}>Correct phrasing</div>
                <div className="mt-1 font-mono text-sm">
                  &ldquo;Purchase probability is higher among discount-exposed sessions in this observational dataset.&rdquo;
                </div>
              </div>
            </div>
            <p className="mt-3 text-muted-foreground">
              Every finding below follows this same pattern: an observed, quantified difference, paired with an
              explicit statement of what would have to be true for a causal read to hold &mdash; and usually isn&rsquo;t.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <FindingCard
          index={1}
          title="Discount exposure and purchase"
          observation={
            <>
              Sessions exposed to a discount purchased at a rate of <Metric>{fmtPct(discountTrue)}</Metric>, versus{" "}
              <Metric>{fmtPct(discountFalse)}</Metric> for sessions with no discount exposure &mdash; purchase
              probability is higher among discount-exposed sessions in this observational dataset.
            </>
          }
          concept="Conditional probability / two-group comparison: P(Purchase | Discount) vs. P(Purchase | No Discount)."
          meaning="Discount exposure and purchase move together in the data we have: sessions where a discount was shown are more likely to end in a purchase than sessions where it wasn't."
          decision="Worth testing (e.g. via a randomized holdout or A/B test) whether proactively surfacing discounts to under-converting segments lifts purchase rate, before committing to a broad discount-allocation strategy."
          limitation={
            <>
              Discount exposure was not randomly assigned in this dataset. Customers who were already more interested
              in buying may have been more likely to seek out or qualify for a discount (self-selection). We cannot
              conclude &ldquo;discounts cause purchases&rdquo; from this comparison alone &mdash; only that the two are
              associated.
            </>
          }
        />

        <FindingCard
          index={2}
          title="Add-to-cart and purchase"
          observation={
            <>
              P(Purchase | Added to Cart) is <Metric>{fmtPct(pCart)}</Metric>, far above the baseline P(Purchase) of{" "}
              <Metric>{fmtPct(pPurchase)}</Metric> across all sessions.
            </>
          }
          concept="Bayes' theorem / conditional probability, comparing a conditional rate against its unconditional baseline."
          meaning="Once a session includes an add-to-cart action, the odds that it ends in a purchase rise sharply compared to a session picked at random."
          decision="Prioritize cart-abandonment interventions (reminder emails, retargeting, saved-cart nudges) for sessions that reach the cart stage but stall, since this subgroup already carries much higher intent than the general session population."
          limitation="A higher conditional purchase rate reflects stronger intent among cart-adding sessions, not a guarantee that any individual cart will convert, or that an intervention will change the outcome for that individual."
        />

        <FindingCard
          index={3}
          title="Customer segment differences in conversion"
          observation={
            <>
              Conversion rate rises across behavioral segments: New <Metric>{fmtPct(newSeg?.rate ?? 0)}</Metric>,
              Occasional <Metric>{fmtPct(occasional?.rate ?? 0)}</Metric>, Regular <Metric>{fmtPct(regular?.rate ?? 0)}</Metric>,
              Loyal <Metric>{fmtPct(loyal?.rate ?? 0)}</Metric>.
            </>
          }
          concept="Categorical association / group comparison across a multi-level segment variable."
          meaning="Sessions from customers with more purchase history convert at a higher rate than sessions from newer customers, in this dataset."
          decision="Allocate marketing spend and messaging by lifecycle stage &mdash; e.g. heavier trust-building and incentive content for New/Occasional segments, retention-focused content for Regular/Loyal &mdash; rather than a single blanket campaign."
          limitation="The segment itself is defined by past order count (previous_orders), so part of this gap is definitional: Loyal customers have already demonstrated repeat buying behavior. This is not evidence that a New customer would convert at Loyal-segment rates if simply given a Loyal-segment treatment."
        />

        <FindingCard
          index={4}
          title="Return rate differences across categories"
          observation={
            <>
              <Metric>{highestReturn[0]}</Metric> has the highest observed return rate at{" "}
              <Metric>{fmtPct(highestReturn[1].return_rate)}</Metric>, while <Metric>{lowestReturn[0]}</Metric> has the
              lowest at <Metric>{fmtPct(lowestReturn[1].return_rate)}</Metric>.
            </>
          }
          concept="Categorical association / comparison of proportions across product category."
          meaning={`Return likelihood is not uniform across categories: ${highestReturn[0]} orders in this dataset are returned meaningfully more often than ${lowestReturn[0]} orders.`}
          decision={`Prioritize return-reduction investment (sizing guides, clearer product imagery/descriptions, tighter quality checks) toward ${highestReturn[0]}, where the return-rate gap suggests the largest potential recovery.`}
          limitation="Return rate here is descriptive of this sample's mix of price bands and products within each category, not a controlled, product-quality-adjusted comparison. Differences could partly reflect price point, sizing complexity, or product mix rather than category-level quality alone."
        />

        <FindingCard
          index={5}
          title="Acquisition channel differences in conversion"
          observation={
            <>
              <Metric>{highestChannel[0]}</Metric> sessions convert at <Metric>{fmtPct(highestChannel[1].rate)}</Metric>,
              compared with <Metric>{fmtPct(lowestChannel[1].rate)}</Metric> for <Metric>{lowestChannel[0]}</Metric> &mdash; the
              highest and lowest converting channels in this dataset.
            </>
          }
          concept="Categorical association across acquisition channel, a multi-level categorical variable."
          meaning="Sessions acquired through different channels convert at meaningfully different rates in this dataset."
          decision="Use channel-level conversion as one input (alongside cost-per-session and margin) when reallocating acquisition budget across channels, rather than optimizing purely on traffic volume."
          limitation={
            <>
              Channel conversion differences may reflect audience intent differences at acquisition rather than
              channel effectiveness in isolation &mdash; e.g. {highestChannel[0]} traffic often already carries higher
              purchase intent than colder discovery channels, so this comparison should not be read as a pure measure
              of channel quality.
            </>
          }
        />
      </div>

      <CaveatNote>
        Across all five findings on this page, the underlying data is observational: variables were not randomly
        assigned by an experiment, so every relationship described above is an association, not a demonstrated causal
        effect. Decisions informed by these findings should ideally be validated with a controlled test before being
        scaled.
      </CaveatNote>
    </div>
  );
}

function Metric({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono font-medium tabular-nums" style={{ color: "var(--series-1)" }}>
      {children}
    </span>
  );
}

function FindingCard({
  index,
  title,
  observation,
  concept,
  meaning,
  decision,
  limitation,
}: {
  index: number;
  title: string;
  observation: ReactNode;
  concept: ReactNode;
  meaning: ReactNode;
  decision: ReactNode;
  limitation: ReactNode;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Badge variant="secondary" className="shrink-0">
          Finding {index}
        </Badge>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiveRow icon={<Eye className="h-4 w-4" />} label="What did we observe?">
          {observation}
        </FiveRow>
        <FiveRow icon={<FlaskConical className="h-4 w-4" />} label="What statistical concept supports this?">
          {concept}
        </FiveRow>
        <FiveRow icon={<Lightbulb className="h-4 w-4" />} label="What does it mean?">
          {meaning}
        </FiveRow>
        <FiveRow icon={<Target className="h-4 w-4" />} label="What business decision could it inform?">
          {decision}
        </FiveRow>
        <FiveRow icon={<AlertTriangle className="h-4 w-4" />} label="What assumption or limitation should a decision-maker know?" muted>
          {limitation}
        </FiveRow>
      </CardContent>
    </Card>
  );
}

function FiveRow({
  icon,
  label,
  children,
  muted,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={muted ? "text-sm text-muted-foreground" : "text-sm leading-relaxed"}>{children}</div>
    </div>
  );
}
