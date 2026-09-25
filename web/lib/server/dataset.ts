import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

/**
 * Server-only cached loader for the full 60k-row CSV. Never imported from
 * client code -- the Data Explorer route handlers use this so the browser
 * never receives more than a small filtered/aggregated slice.
 */

const CSV_PATH = path.join(process.cwd(), "data", "commerce_sessions.csv");

const BOOLEAN_COLUMNS = new Set([
  "add_to_cart", "wishlist_added", "discount_exposed", "free_shipping",
  "campaign_exposed", "purchase", "returned", "repeat_customer", "high_intent_session",
]);

const NUMERIC_COLUMNS = new Set([
  "hour", "customer_age", "previous_orders", "days_since_last_order",
  "session_duration_min", "pages_viewed", "products_viewed", "searches",
  "cart_items", "discount_pct", "offer_value", "estimated_delivery_days",
  "delivery_delay_days", "customer_rating_history", "items_purchased",
  "order_value", "return_days", "customer_satisfaction", "profit_margin_pct",
  "engagement_score", "discount_dependency", "cart_conversion",
  "customer_total_spend", "customer_avg_order_value", "customer_return_rate",
  "time_since_previous_purchase_days", "next_purchase_days",
]);

export const CATEGORICAL_FILTER_COLUMNS = [
  "gender", "income_level", "city_tier", "device", "acquisition_channel",
  "customer_segment", "payment_method", "category", "price_band", "season",
  "day_of_week", "customer_value_segment",
] as const;

export const BOOLEAN_FILTER_COLUMNS = [
  "purchase", "returned", "add_to_cart", "discount_exposed", "campaign_exposed",
  "repeat_customer",
] as const;

export type Row = Record<string, string | number | boolean | null>;

let cachedRows: Row[] | null = null;

export function loadDataset(): Row[] {
  if (cachedRows) return cachedRows;

  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  cachedRows = parsed.data.map((raw) => {
    const row: Row = {};
    for (const [key, value] of Object.entries(raw)) {
      if (BOOLEAN_COLUMNS.has(key)) {
        row[key] = value === "True";
      } else if (NUMERIC_COLUMNS.has(key)) {
        row[key] = value === "" ? null : Number(value);
      } else {
        row[key] = value;
      }
    }
    return row;
  });

  return cachedRows;
}

export type Filters = Partial<{
  gender: string;
  income_level: string;
  city_tier: string;
  device: string;
  acquisition_channel: string;
  customer_segment: string;
  payment_method: string;
  category: string;
  price_band: string;
  season: string;
  day_of_week: string;
  customer_value_segment: string;
  purchase: "true" | "false";
  returned: "true" | "false";
  add_to_cart: "true" | "false";
  discount_exposed: "true" | "false";
  campaign_exposed: "true" | "false";
  repeat_customer: "true" | "false";
  age_min: string;
  age_max: string;
}>;

export function applyFilters(rows: Row[], filters: Filters): Row[] {
  return rows.filter((row) => {
    for (const col of CATEGORICAL_FILTER_COLUMNS) {
      const want = filters[col];
      if (want && want !== "all" && row[col] !== want) return false;
    }
    for (const col of BOOLEAN_FILTER_COLUMNS) {
      const want = filters[col];
      if (want && want !== ("all" as never)) {
        const wantBool = want === "true";
        if (row[col] !== wantBool) return false;
      }
    }
    if (filters.age_min && Number(row.customer_age) < Number(filters.age_min)) return false;
    if (filters.age_max && Number(row.customer_age) > Number(filters.age_max)) return false;
    return true;
  });
}

export function summarize(rows: Row[]) {
  const n = rows.length;
  const purchased = rows.filter((r) => r.purchase === true);
  const revenue = purchased.reduce((s, r) => s + (Number(r.order_value) || 0), 0);
  const orders = purchased.length;
  const returns = purchased.filter((r) => r.returned === true).length;
  const uniqueCustomers = new Set(rows.map((r) => r.customer_id)).size;
  return {
    sessions: n,
    unique_customers: uniqueCustomers,
    orders,
    conversion_rate: n > 0 ? orders / n : 0,
    revenue,
    aov: orders > 0 ? revenue / orders : 0,
    return_rate: orders > 0 ? returns / orders : 0,
  };
}

let cachedMeta: {
  categorical: Record<string, string[]>;
  ageRange: { min: number; max: number };
  totalRows: number;
} | null = null;

export function getMeta() {
  if (cachedMeta) return cachedMeta;
  const rows = loadDataset();
  const categorical: Record<string, string[]> = {};
  for (const col of CATEGORICAL_FILTER_COLUMNS) {
    const values = new Set<string>();
    for (const row of rows) values.add(String(row[col]));
    categorical[col] = Array.from(values).sort();
  }
  let min = Infinity;
  let max = -Infinity;
  for (const row of rows) {
    const age = Number(row.customer_age);
    if (age < min) min = age;
    if (age > max) max = age;
  }
  cachedMeta = { categorical, ageRange: { min, max }, totalRows: rows.length };
  return cachedMeta;
}
