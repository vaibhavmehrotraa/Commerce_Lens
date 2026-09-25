import { NextRequest, NextResponse } from "next/server";
import { loadDataset, applyFilters, summarize, type Filters, type Row } from "@/lib/server/dataset";
import { summary as numericSummary, percentile } from "@/lib/analytics/descriptive";

const PREVIEW_COLUMNS = [
  "session_id", "customer_id", "session_date", "device", "category",
  "customer_segment", "acquisition_channel", "discount_exposed", "add_to_cart",
  "purchase", "order_value", "returned",
];

const NUMERIC_STAT_COLUMNS = new Set([
  "customer_age", "session_duration_min", "pages_viewed", "products_viewed",
  "searches", "cart_items", "order_value", "engagement_score",
  "customer_total_spend", "estimated_delivery_days",
]);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const filters: Filters = {};
  for (const key of [
    "gender", "income_level", "city_tier", "device", "acquisition_channel",
    "customer_segment", "payment_method", "category", "price_band", "season",
    "day_of_week", "customer_value_segment", "purchase", "returned",
    "add_to_cart", "discount_exposed", "campaign_exposed", "repeat_customer",
    "age_min", "age_max",
  ] as const) {
    const v = sp.get(key);
    if (v) (filters as Record<string, string>)[key] = v;
  }

  const limit = Math.min(200, Math.max(1, Number(sp.get("limit") ?? 50)));
  const statCol = sp.get("stat_col");

  const rows = loadDataset();
  const filtered = applyFilters(rows, filters);
  const summary = summarize(filtered);

  const sample = filtered.slice(0, limit).map((row) => {
    const out: Row = {};
    for (const c of PREVIEW_COLUMNS) out[c] = row[c];
    return out;
  });

  let stat = null;
  let histogram: { bin_start: number; bin_end: number; count: number }[] | null = null;
  if (statCol && NUMERIC_STAT_COLUMNS.has(statCol)) {
    const values = filtered
      .map((r) => Number(r[statCol]))
      .filter((v) => Number.isFinite(v));
    if (values.length > 0) {
      stat = { column: statCol, ...numericSummary(values) };
      // Bin over [min, p95] and fold the long right tail into the final bin,
      // so a right-skewed field like order_value stays legible.
      const nBins = 16;
      const min = Math.min(...values);
      const p95 = percentile(values, 95);
      const cap = p95 > min ? p95 : Math.max(...values);
      const width = (cap - min) / nBins || 1;
      const counts = new Array(nBins).fill(0);
      for (const v of values) {
        const idx = Math.min(nBins - 1, Math.max(0, Math.floor((v - min) / width)));
        counts[idx]++;
      }
      histogram = counts.map((count, i) => ({
        bin_start: min + i * width,
        bin_end: min + (i + 1) * width,
        count,
      }));
    }
  }

  return NextResponse.json({
    matched_rows: filtered.length,
    total_rows: rows.length,
    summary,
    sample,
    stat,
    histogram,
  });
}
