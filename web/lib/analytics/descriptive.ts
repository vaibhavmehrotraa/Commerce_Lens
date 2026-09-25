/**
 * TypeScript mirror of analytics/descriptive.py, used for the client-side
 * Interactive Statistics Calculator so results update instantly without a
 * server round trip. Kept intentionally symmetric with the Python module.
 */

export function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function mode(values: (number | string)[]): number | string {
  const counts = new Map<number | string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: number | string = values[0];
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

export function range(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

export function percentile(values: number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

export function quartiles(values: number[]) {
  const q1 = percentile(values, 25);
  const q2 = percentile(values, 50);
  const q3 = percentile(values, 75);
  return { q1, q2, q3, iqr: q3 - q1 };
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sumSq = values.reduce((a, v) => a + (v - m) ** 2, 0);
  return sumSq / (values.length - 1);
}

export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function covariance(x: number[], y: number[]): number {
  const mx = mean(x);
  const my = mean(y);
  let s = 0;
  for (let i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my);
  return s / (x.length - 1);
}

export function correlation(x: number[], y: number[]): number {
  const sx = stdDev(x);
  const sy = stdDev(y);
  if (sx === 0 || sy === 0) return 0;
  return covariance(x, y) / (sx * sy);
}

export function outlierBounds(values: number[], k = 1.5) {
  const { q1, q3, iqr } = quartiles(values);
  return { lower: q1 - k * iqr, upper: q3 + k * iqr };
}

export function summary(values: number[]) {
  const q = quartiles(values);
  const bounds = outlierBounds(values);
  const n_outliers = values.filter((v) => v < bounds.lower || v > bounds.upper).length;
  return {
    n: values.length,
    mean: mean(values),
    median: median(values),
    std: stdDev(values),
    variance: variance(values),
    min: Math.min(...values),
    max: Math.max(...values),
    range: range(values),
    ...q,
    outlier_lower_bound: bounds.lower,
    outlier_upper_bound: bounds.upper,
    n_outliers,
  };
}
