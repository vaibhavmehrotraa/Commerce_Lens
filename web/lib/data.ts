import raw from "./data/analytics.json";

/**
 * Typed access to the precomputed analytics payload produced by
 * analytics/run_all.py. Every number on the CommerceLens site flows
 * through this file -- nothing here is hand-typed.
 */

export type GroupRate = { rate: number; n: number };
export type GroupStat = { mean: number; median: number; std: number; n: number };
export type FreqEntry = { count: number; proportion: number };

export type NumericSummary = {
  n: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  p90: number;
  p95: number;
  p99: number;
  outlier_lower_bound: number;
  outlier_upper_bound: number;
  n_outliers: number;
  pct_outliers: number;
};

export type ValueMetrics = {
  sessions: number;
  unique_customers: number;
  orders: number;
  revenue: number;
  aov: number;
  median_order_value: number;
  return_rate: number;
  avg_profit_margin_pct: number;
  repeat_customer_rate: number;
  conversion_rate: number;
};

export type FittedLine = { slope: number; intercept: number; r_squared: number };
export type Scatter = { x: number[]; y: number[] };

export type AnalyticsData = {
  executive_summary: ValueMetrics;
  funnel: { sessions: number; viewed_products: number; added_to_cart: number; purchased: number };
  segment_distribution: Record<string, FreqEntry>;
  conversion_by_segment: Record<string, GroupRate>;
  value_segment_distribution: Record<string, FreqEntry>;

  descriptive_numeric: Record<string, NumericSummary>;
  descriptive_order_value: NumericSummary;
  order_value_outliers_sample: number[];
  descriptive_categorical: Record<string, Record<string, FreqEntry>>;
  business_questions_descriptive: {
    pct_orders_below_1000: number;
    pct_orders_above_5000: number;
    median_order_value: number;
    modal_category: string;
    modal_device: string;
  };

  association: {
    device_x_purchase: Record<string, GroupRate>;
    income_x_purchase: Record<string, GroupRate>;
    discount_x_purchase: Record<string, GroupRate>;
    segment_x_purchase: Record<string, GroupRate>;
    channel_x_purchase: Record<string, GroupRate>;
    campaign_x_purchase: Record<string, GroupRate>;
    duration_x_products: { correlation: number; covariance: number; fitted_line: FittedLine; scatter: Scatter };
    products_viewed_x_order_value: { correlation: number; covariance: number; fitted_line: FittedLine; scatter: Scatter };
    previous_orders_x_total_spend: { correlation: number; covariance: number; fitted_line: FittedLine; scatter: Scatter };
    category_x_device: { counts: Record<string, Record<string, number>>; row_relative_freq: Record<string, Record<string, number>> };
  };

  misleading_charts: {
    conversion_by_device_true: Record<string, GroupRate>;
    revenue_by_month: Record<string, number>;
    revenue_by_month_and_category_sample: Record<string, Record<string, number>>;
    channel_total_revenue: Record<string, number>;
    channel_conversion_rate: Record<string, GroupRate>;
  };

  probability_engine: Record<string, number>;

  bayes: {
    p_purchase: number;
    p_cart: number;
    p_cart_given_purchase: number;
    p_purchase_given_cart_direct: number;
    p_purchase_given_cart_bayes: number;
    absolute_difference: number;
  };

  independence: Record<
    string,
    {
      p_a: number; p_b: number; p_a_and_b: number; p_a_times_p_b: number;
      absolute_difference: number; relative_difference: number; appears_independent_in_sample: boolean;
    }
  >;

  combinatorics_examples: {
    campaign_assignment: {
      n_offer_types: number; n_segments: number;
      distinct_offer_per_segment_permutations: number | null; any_offer_any_segment_total: number;
    };
    choose_20_from_pool_1000: number;
    bundle_3_from_12: number;
    factorial_5: number;
    permutations_5_choose_2: number;
    combinations_5_choose_2: number;
  };

  random_variable_items_purchased: {
    pmf: Record<string, number>;
    cdf: Record<string, number>;
    expected_value: number;
    variance: number;
    std: number;
  };

  expectation_variance: {
    expected_items_per_purchase: number;
    expected_order_value: number;
    order_value_variance: number;
    order_value_std: number;
    expected_conversions_per_1000_sessions: number;
    segment_value_mean_var_std: Record<string, { mean: number; variance: number; std: number; n: number }>;
  };

  bernoulli: { p_success: number; p_failure: number; mean: number; variance: number; std: number };
  binomial_default: { n: number; p: number; summary: { n: number; p: number; mean: number; variance: number; std: number }; curve: { k: number[]; pmf: number[] } };

  hypergeometric_default: {
    N_pool_size: number; K_high_value: number; n_sample_size: number; k_target: number;
    p_exact_k: number; expected_high_value_in_sample: number; variance: number; std: number;
    pmf_curve: { k: number[]; pmf: number[] };
    binomial_approx_p_exact_k: number;
  };
  observed_high_value_share: number;

  uniform_default: { params: { a: number; b: number }; summary: { a: number; b: number; mean: number; variance: number; std: number }; curve: { x: number[]; pdf: number[]; cdf: number[] } };
  triangular_default: {
    params: { min: number; mode: number; max: number };
    summary: { min: number; mode: number; max: number; mean: number; variance: number; std: number };
    curve: { x: number[]; pdf: number[]; cdf: number[] };
    p_le_5: number; p_gt_7: number;
  };
  exponential_default: {
    params: { rate: number };
    summary: { rate: number; mean: number; variance: number; std: number };
    curve: { x: number[]; pdf: number[]; cdf: number[] };
    memoryless_check: { p_t_gt_t: number; p_conditional_given_survived_s: number; matches_memoryless_property: boolean };
    observed_mean_days_since_last_order: number;
  };

  customer_value_by_segment: Record<string, ValueMetrics>;
  customer_value_by_category: Record<string, ValueMetrics>;
  customer_value_by_channel: Record<string, ValueMetrics>;
  customer_value_by_income: Record<string, ValueMetrics>;
  customer_value_by_device: Record<string, ValueMetrics>;
  customer_value_by_season: Record<string, ValueMetrics>;
  order_value_distribution_by_segment: Record<string, number[]>;

  dataset_meta: {
    n_rows: number; n_columns: number; n_customers: number;
    date_min: string; date_max: string; columns: string[];
  };

  probability_events_bitpacked: {
    n: number;
    events: { P: string; C: string; D: string; R: string; M: string };
    labels: Record<string, string>;
  };
};

export const data = raw as unknown as AnalyticsData;

export const SERIES_COLORS = [
  "var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)",
  "var(--series-5)", "var(--series-6)", "var(--series-7)", "var(--series-8)",
];

// Every formatter is defensive against undefined/NaN input: a transient bad
// value (e.g. a slider mid-drag) should render a placeholder, never crash
// the page with "Cannot read properties of undefined".
export function fmtPct(x: number, digits = 1): string {
  if (typeof x !== "number" || !Number.isFinite(x)) return "–";
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmtINR(x: number, digits = 0): string {
  if (typeof x !== "number" || !Number.isFinite(x)) return "–";
  return `₹${x.toLocaleString("en-IN", { maximumFractionDigits: digits })}`;
}

export function fmtNum(x: number, digits = 2): string {
  if (typeof x !== "number" || !Number.isFinite(x)) return "–";
  return x.toLocaleString("en-IN", { maximumFractionDigits: digits });
}
