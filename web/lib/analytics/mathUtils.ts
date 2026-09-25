/**
 * Numerically-stable helpers shared by the combinatorics / binomial /
 * hypergeometric TS calculators. We work in log-space so n up to a few
 * thousand doesn't overflow a 64-bit float.
 */

const LANCZOS_G = 7;
const LANCZOS_COEF = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** log(Gamma(x)) via the Lanczos approximation. Gamma(n+1) = n!. */
export function logGamma(x: number): number {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = LANCZOS_COEF[0];
  const t = x + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_G + 2; i++) a += LANCZOS_COEF[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function logFactorial(n: number): number {
  return logGamma(n + 1);
}

export function factorial(n: number): number {
  if (n < 0) throw new Error("factorial is undefined for negative n");
  if (n <= 170) {
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  return Math.exp(logFactorial(n));
}

export function logCombinations(n: number, r: number): number {
  if (r < 0 || r > n) return -Infinity;
  return logFactorial(n) - logFactorial(r) - logFactorial(n - r);
}

export function combinations(n: number, r: number): number {
  if (r < 0 || r > n || n < 0) throw new Error("require 0 <= r <= n");
  return Math.round(Math.exp(logCombinations(n, r)));
}

export function logPermutations(n: number, r: number): number {
  if (r < 0 || r > n) return -Infinity;
  return logFactorial(n) - logFactorial(n - r);
}

export function permutations(n: number, r: number): number {
  if (r < 0 || r > n || n < 0) throw new Error("require 0 <= r <= n");
  return Math.round(Math.exp(logPermutations(n, r)));
}

export function permutationsWithRepetition(n: number, counts: number[]): number {
  if (counts.reduce((a, b) => a + b, 0) !== n) throw new Error("counts must sum to n");
  let logDenom = 0;
  for (const c of counts) logDenom += logFactorial(c);
  return Math.round(Math.exp(logFactorial(n) - logDenom));
}

export function countingPrinciple(choicesPerStep: number[]): number {
  return choicesPerStep.reduce((a, b) => a * b, 1);
}
