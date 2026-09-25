"use client";

import { data, fmtINR, fmtNum, fmtPct } from "@/lib/data";
import { PageHeader } from "@/components/viz/page-header";
import { CaveatNote } from "@/components/viz/business-question";
import { BarChartCard } from "@/components/charts/bar-chart";
import { LineChartCard } from "@/components/charts/line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

function WhyThisMisleads({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2 rounded-lg border px-4 py-3 text-sm"
      style={{
        borderColor: "var(--status-serious)",
        backgroundColor: "color-mix(in srgb, var(--status-serious) 8%, transparent)",
      }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--status-serious)" }} />
      <div>
        <div className="mb-1 font-medium" style={{ color: "var(--status-serious)" }}>
          Why this misleads
        </div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

export default function MisleadingChartsPage() {
  const mc = data.misleading_charts;

  // (a) Truncated y-axis
  const deviceRows = Object.entries(mc.conversion_by_device_true)
    .sort((a, b) => b[1].rate - a[1].rate)
    .map(([name, v]) => ({ name, value: v.rate, n: v.n }));
  const deviceMax = Math.max(...deviceRows.map((r) => r.value));
  const deviceMin = Math.min(...deviceRows.map((r) => r.value));
  const deviceGap = deviceMax - deviceMin;

  // (b) Inappropriate aggregation
  const channelRevenueRows = Object.entries(mc.channel_total_revenue)
    .sort((a, b) => b[1] - a[1])
    .map(([name, v]) => ({ name, value: v }));
  const channelRateRows = Object.entries(mc.channel_conversion_rate)
    .sort((a, b) => b[1].rate - a[1].rate)
    .map(([name, v]) => ({ name, value: v.rate, n: v.n }));
  const topRevenueChannel = channelRevenueRows[0];
  const topRateChannel = channelRateRows[0];
  const topRevenueChannelRate = mc.channel_conversion_rate[topRevenueChannel.name];
  const topRevenueChannelRateRank =
    channelRateRows.findIndex((r) => r.name === topRevenueChannel.name) + 1;
  const topRevenueChannelSessions = mc.channel_conversion_rate[topRevenueChannel.name].n;
  const maxSessionsChannel = Object.entries(mc.channel_conversion_rate).sort(
    (a, b) => b[1].n - a[1].n
  )[0];

  // (c) Distorted categorical comparison: circle-size (radius/area) encoding
  const incomeRows = Object.entries(data.descriptive_categorical.income_level)
    .sort((a, b) => b[1].proportion - a[1].proportion)
    .map(([name, v]) => ({ name, value: v.proportion }));
  const incomeMaxVal = incomeRows[0].value;
  const topIncome = incomeRows[0];
  const bottomIncome = incomeRows[incomeRows.length - 1];
  const incomeTrueRatio = topIncome.value / bottomIncome.value;
  const incomeAreaRatio = incomeTrueRatio * incomeTrueRatio;
  const MAX_DIAMETER = 140;
  const MIN_DIAMETER = 24;
  const misleadingDiameter = (v: number) =>
    Math.round(MIN_DIAMETER + (v / incomeMaxVal) * (MAX_DIAMETER - MIN_DIAMETER));
  const betterDiameter = (v: number) =>
    Math.round(MIN_DIAMETER + Math.sqrt(v / incomeMaxVal) * (MAX_DIAMETER - MIN_DIAMETER));

  // (d) Cherry-picked comparison
  const monthEntries = Object.entries(mc.revenue_by_month).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const lowest = monthEntries.reduce((min, e) => (e[1] < min[1] ? e : min), monthEntries[0]);
  const highest = monthEntries.reduce((max, e) => (e[1] > max[1] ? e : max), monthEntries[0]);
  const cherryPickedGrowth = (highest[1] - lowest[1]) / lowest[1];
  const cherryData = [lowest, highest]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => ({ name: formatMonth(k), value: v }));
  const fullSeriesData = monthEntries.map(([, v], idx) => ({ idx, revenue: v }));
  const monthLabels = monthEntries.map(([k]) => formatMonth(k));
  const avgRevenue =
    monthEntries.reduce((sum, [, v]) => sum + v, 0) / monthEntries.length;
  const overallGrowth =
    (monthEntries[monthEntries.length - 1][1] - monthEntries[0][1]) / monthEntries[0][1];

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Data → Customer Behavior → Data Visualization"
        title="How Charts Can Mislead"
        description="The same underlying numbers can tell very different stories depending on how they're charted. Each example below pairs a technically-accurate-but-misleading version against a better, honest version of the same data."
      />

      {/* (a) Truncated y-axis */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">1. Truncated Y-Axis</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Conversion Rate by Device</CardTitle>
                <Badge variant="destructive">Misleading version</Badge>
              </div>
              <CardDescription>Y-axis truncated to 20%&ndash;32%</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={deviceRows}
                valueFormatter={(v) => fmtPct(v)}
                color="var(--series-5)"
                yDomain={[0.2, 0.32]}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Highest ({deviceRows[0].name}): {fmtPct(deviceMax)} &middot; Lowest (
                {deviceRows[deviceRows.length - 1].name}): {fmtPct(deviceMin)} &middot; real gap:{" "}
                {fmtPct(deviceGap)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Conversion Rate by Device</CardTitle>
                <Badge variant="secondary">Better version</Badge>
              </div>
              <CardDescription>Y-axis honestly starts at 0%</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={deviceRows}
                valueFormatter={(v) => fmtPct(v)}
                color="var(--series-1)"
                yDomain={[0, 1]}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Highest ({deviceRows[0].name}): {fmtPct(deviceMax)} &middot; Lowest (
                {deviceRows[deviceRows.length - 1].name}): {fmtPct(deviceMin)} &middot; real gap:{" "}
                {fmtPct(deviceGap)}
              </p>
            </CardContent>
          </Card>
        </div>
        <WhyThisMisleads>
          Both charts plot the identical numbers &mdash; Desktop {fmtPct(mc.conversion_by_device_true.Desktop.rate)}
          , Tablet {fmtPct(mc.conversion_by_device_true.Tablet.rate)}, Mobile{" "}
          {fmtPct(mc.conversion_by_device_true.Mobile.rate)} &mdash; but truncating the y-axis to a narrow 20%&ndash;32%
          band inflates the visual size of the gap between bars, making a real difference of {fmtPct(deviceGap)}{" "}
          percentage points look like Mobile converts at roughly a third of Desktop&rsquo;s rate, when the honest,
          zero-baseline chart shows all three devices convert in a fairly similar range. Axis truncation is one of
          the most common ways a real but modest effect gets visually exaggerated into a dramatic one.
        </WhyThisMisleads>
      </section>

      {/* (b) Inappropriate aggregation */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">2. Inappropriate Aggregation (Volume vs. Rate)</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>&ldquo;Which Channel Performs Best?&rdquo;</CardTitle>
                <Badge variant="destructive">Misleading version</Badge>
              </div>
              <CardDescription>Ranked by raw total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={channelRevenueRows}
                valueFormatter={(v) => fmtINR(v, 0)}
                color="var(--series-5)"
                horizontal
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Conversion Rate by Channel</CardTitle>
                <Badge variant="secondary">Better version</Badge>
              </div>
              <CardDescription>Normalized: purchases per session, by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard
                data={channelRateRows}
                valueFormatter={(v) => fmtPct(v)}
                color="var(--series-1)"
                horizontal
              />
            </CardContent>
          </Card>
        </div>
        <WhyThisMisleads>
          Raw total revenue conflates channel <em>volume</em> with channel <em>quality</em>.{" "}
          <strong>{topRevenueChannel.name}</strong> tops the revenue chart with {fmtINR(topRevenueChannel.value, 0)}
          , but its conversion rate is only {fmtPct(topRevenueChannelRate.rate)} &mdash; ranked #
          {topRevenueChannelRateRank} of {channelRateRows.length} by rate. It leads in revenue mainly because it
          drives the most sessions ({topRevenueChannelSessions.toLocaleString("en-IN")}, the highest of any channel
          &mdash; confirmed as {maxSessionsChannel[0]}). Meanwhile <strong>{topRateChannel.name}</strong> converts
          best per session ({fmtPct(topRateChannel.value)}) but ranks lower on total revenue because it has fewer
          sessions. In this dataset the ranks genuinely diverge: a channel can look like the &ldquo;best
          performer&rdquo; on a totals chart purely by having more traffic, while converting that traffic at a
          below-average rate. The normalized, per-session metric is the appropriate one for judging channel quality;
          raw totals are the appropriate one for judging channel scale &mdash; they answer different questions.
        </WhyThisMisleads>
      </section>

      {/* (c) Distorted categorical comparison: circle-size (radius vs. area) encoding */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">3. Distorted Categorical Comparison</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Customer Share by Income Level</CardTitle>
                <Badge variant="destructive">Misleading version</Badge>
              </div>
              <CardDescription>Circle diameter scaled directly to proportion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] items-end justify-center gap-8 py-6">
                {incomeRows.map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-2">
                    <div
                      className="rounded-full"
                      style={{
                        width: misleadingDiameter(r.value),
                        height: misleadingDiameter(r.value),
                        backgroundColor: "var(--series-5)",
                        opacity: 0.75,
                      }}
                    />
                    <div className="text-xs text-muted-foreground">{r.name}</div>
                    <div className="text-sm font-medium">{fmtPct(r.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Customer Share by Income Level</CardTitle>
                <Badge variant="secondary">Better version</Badge>
              </div>
              <CardDescription>Circle area (not diameter) scaled to proportion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] items-end justify-center gap-8 py-6">
                {incomeRows.map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-2">
                    <div
                      className="rounded-full"
                      style={{
                        width: betterDiameter(r.value),
                        height: betterDiameter(r.value),
                        backgroundColor: "var(--series-1)",
                        opacity: 0.75,
                      }}
                    />
                    <div className="text-xs text-muted-foreground">{r.name}</div>
                    <div className="text-sm font-medium">{fmtPct(r.value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <WhyThisMisleads>
          <strong>{topIncome.name}</strong> customers ({fmtPct(topIncome.value)}) are only about{" "}
          {fmtNum(incomeTrueRatio, 2)}&times; as numerous as <strong>{bottomIncome.name}</strong> customers (
          {fmtPct(bottomIncome.value)}). But human perception of a circle&rsquo;s size is dominated by its{" "}
          <em>area</em>, not its diameter. Scaling diameter directly to the proportion (the misleading version) makes
          the area ratio blow up to roughly {fmtNum(incomeAreaRatio, 2)}&times; &mdash; visually implying {" "}
          {topIncome.name} customers outnumber {bottomIncome.name} customers by far more than the real{" "}
          {fmtNum(incomeTrueRatio, 2)}&times; gap. The better version scales the circle&rsquo;s <em>area</em> (so
          diameter grows with the square root of the proportion), so the visual size ratio matches the true data
          ratio. This same distortion appears whenever bubble charts, icon arrays, or 3D pie/donut charts scale a
          linear dimension (radius, height, side length) directly to a data value instead of scaling area to value.
        </WhyThisMisleads>
      </section>

      {/* (d) Cherry-picked comparison */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">4. Cherry-Picked Comparison</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Revenue Growth Story</CardTitle>
                <Badge variant="destructive">Misleading version</Badge>
              </div>
              <CardDescription>
                Only the lowest month ({formatMonth(lowest[0])}) and highest month ({formatMonth(highest[0])}) shown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard data={cherryData} valueFormatter={(v) => fmtINR(v, 0)} color="var(--series-5)" />
              <p className="mt-2 text-xs text-muted-foreground">
                Implied growth between the two bars: +{fmtPct(cherryPickedGrowth)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center justify-between">
                <CardTitle>Monthly Revenue, Full Series</CardTitle>
                <Badge variant="secondary">Better version</Badge>
              </div>
              <CardDescription>All {monthEntries.length} months, chronological order</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChartCard
                x="idx"
                series={[{ key: "revenue", label: "Revenue", color: "var(--series-1)" }]}
                data={fullSeriesData}
                xFormatter={(v) => monthLabels[Math.round(v)] ?? ""}
                yFormatter={(v) => fmtINR(v, 0)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Average monthly revenue: {fmtINR(avgRevenue, 0)} &middot; first-to-last month change:{" "}
                {overallGrowth >= 0 ? "+" : ""}
                {fmtPct(overallGrowth)}
              </p>
            </CardContent>
          </Card>
        </div>
        <WhyThisMisleads>
          Picking only the single lowest month ({formatMonth(lowest[0])}, {fmtINR(lowest[1], 0)}) and the single
          highest month ({formatMonth(highest[0])}, {fmtINR(highest[1], 0)}) and presenting them as adjacent bars
          manufactures a growth story of +{fmtPct(cherryPickedGrowth)} that the two points alone cannot support
          &mdash; it ignores every month in between and implies a sustained upward trend. The full {monthEntries.length}-month
          series tells a different story: revenue fluctuates in a fairly narrow, seasonal-looking band around{" "}
          {fmtINR(avgRevenue, 0)} per month, {formatMonth(highest[0])} stands out as a single spike (likely a
          seasonal or promotional event) rather than the start of a trend, and revenue from the first month to the
          last month actually changed by only {overallGrowth >= 0 ? "+" : ""}
          {fmtPct(overallGrowth)}. Cherry-picking two non-adjacent, favorably-chosen points is one of the clearest
          ways to imply a trend that doesn&rsquo;t exist in the full data.
        </WhyThisMisleads>
      </section>

      <CaveatNote>
        These three examples use the same real, precomputed figures as the rest of this site &mdash; only the
        presentation choices differ. The lesson generalizes: always check the axis baseline, prefer normalized
        (rate) metrics over raw totals when comparing groups of different size, and look at a full time series
        before trusting a two-point comparison.
      </CaveatNote>
    </div>
  );
}
