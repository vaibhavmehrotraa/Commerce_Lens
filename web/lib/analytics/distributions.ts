/**
 * TypeScript mirror of analytics/distributions.py: Uniform, Triangular,
 * Exponential -- the Continuous Distribution Lab's live calculators.
 */

// ---------------------------------------------------------------------
// Uniform(a, b)
// ---------------------------------------------------------------------
export function uniformPdf(x: number, a: number, b: number): number {
  return x >= a && x <= b ? 1 / (b - a) : 0;
}
export function uniformCdfLE(x: number, a: number, b: number): number {
  if (x <= a) return 0;
  if (x >= b) return 1;
  return (x - a) / (b - a);
}
export function uniformProbBetween(x1: number, x2: number, a: number, b: number): number {
  return uniformCdfLE(x2, a, b) - uniformCdfLE(x1, a, b);
}
export function uniformSummary(a: number, b: number) {
  const mean = (a + b) / 2;
  const variance = (b - a) ** 2 / 12;
  return { a, b, mean, variance, std: Math.sqrt(variance) };
}
export function uniformCurve(a: number, b: number, n = 200) {
  const pad = (b - a) * 0.15;
  const x: number[] = [];
  const pdf: number[] = [];
  const cdf: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = a - pad + ((b + pad - (a - pad)) * i) / (n - 1);
    x.push(xi);
    pdf.push(uniformPdf(xi, a, b));
    cdf.push(uniformCdfLE(xi, a, b));
  }
  return { x, pdf, cdf };
}

// ---------------------------------------------------------------------
// Triangular(min, mode, max)
// ---------------------------------------------------------------------
export function triangularPdf(x: number, min: number, mode: number, max: number): number {
  if (x < min || x > max) return 0;
  if (x < mode) return (2 * (x - min)) / ((max - min) * (mode - min));
  if (x > mode) return (2 * (max - x)) / ((max - min) * (max - mode));
  return 2 / (max - min);
}
export function triangularCdfLE(x: number, min: number, mode: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  if (x <= mode) return ((x - min) ** 2) / ((max - min) * (mode - min));
  return 1 - ((max - x) ** 2) / ((max - min) * (max - mode));
}
export function triangularSummary(min: number, mode: number, max: number) {
  const mean = (min + mode + max) / 3;
  const variance = (min ** 2 + mode ** 2 + max ** 2 - min * mode - min * max - mode * max) / 18;
  return { min, mode, max, mean, variance, std: Math.sqrt(variance) };
}
export function triangularCurve(min: number, mode: number, max: number, n = 200) {
  const x: number[] = [];
  const pdf: number[] = [];
  const cdf: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = min + ((max - min) * i) / (n - 1);
    x.push(xi);
    pdf.push(triangularPdf(xi, min, mode, max));
    cdf.push(triangularCdfLE(xi, min, mode, max));
  }
  return { x, pdf, cdf };
}

// ---------------------------------------------------------------------
// Exponential(rate)
// ---------------------------------------------------------------------
export function exponentialCdfLE(t: number, rate: number): number {
  return t < 0 ? 0 : 1 - Math.exp(-rate * t);
}
export function exponentialSurvival(t: number, rate: number): number {
  return t < 0 ? 1 : Math.exp(-rate * t);
}
export function exponentialSummary(rate: number) {
  const mean = 1 / rate;
  const variance = 1 / rate ** 2;
  return { rate, mean, variance, std: Math.sqrt(variance) };
}
export function exponentialCurve(rate: number, xMax?: number, n = 200) {
  const max = xMax ?? 5 / rate;
  const x: number[] = [];
  const pdf: number[] = [];
  const cdf: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = (max * i) / (n - 1);
    x.push(xi);
    pdf.push(rate * Math.exp(-rate * xi));
    cdf.push(exponentialCdfLE(xi, rate));
  }
  return { x, pdf, cdf };
}
export function exponentialMemorylessCheck(rate: number, s: number, t: number) {
  const pGtT = exponentialSurvival(t, rate);
  const pGtS = exponentialSurvival(s, rate);
  const pGtSPlusT = exponentialSurvival(s + t, rate);
  const pConditional = pGtS > 0 ? pGtSPlusT / pGtS : 0;
  return {
    p_t_gt_t: pGtT,
    p_conditional_given_survived_s: pConditional,
    matches_memoryless_property: Math.abs(pGtT - pConditional) < 1e-9,
  };
}
