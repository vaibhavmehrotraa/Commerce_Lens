/**
 * TypeScript mirror of analytics/random_variables.py: Bernoulli, Binomial,
 * Hypergeometric -- computed client-side so the Conversion Forecast
 * Simulator and Campaign Sampling tool respond instantly to slider input.
 */

import { logCombinations } from "./mathUtils";

export function bernoulliStats(p: number) {
  if (p < 0 || p > 1) throw new Error("p must be in [0, 1]");
  return { p_success: p, p_failure: 1 - p, mean: p, variance: p * (1 - p), std: Math.sqrt(p * (1 - p)) };
}

export function binomialPMF(n: number, p: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  const logP = logCombinations(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

export function binomialCdfLE(n: number, p: number, k: number): number {
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += binomialPMF(n, p, i);
  return Math.min(1, s);
}

export function binomialCdfGE(n: number, p: number, k: number): number {
  return 1 - binomialCdfLE(n, p, k - 1);
}

export function binomialSummary(n: number, p: number) {
  return { n, p, mean: n * p, variance: n * p * (1 - p), std: Math.sqrt(n * p * (1 - p)) };
}

export function binomialCurve(n: number, p: number) {
  const k = Array.from({ length: n + 1 }, (_, i) => i);
  const pmf = k.map((ki) => binomialPMF(n, p, ki));
  return { k, pmf };
}

export function hypergeometricPMF(popSize: number, successInPop: number, sampleSize: number, k: number): number {
  const kMin = Math.max(0, sampleSize - (popSize - successInPop));
  const kMax = Math.min(sampleSize, successInPop);
  if (k < kMin || k > kMax) return 0;
  const logP =
    logCombinations(successInPop, k) +
    logCombinations(popSize - successInPop, sampleSize - k) -
    logCombinations(popSize, sampleSize);
  return Math.exp(logP);
}

export function hypergeometricSummary(popSize: number, successInPop: number, sampleSize: number) {
  const mean = (sampleSize * successInPop) / popSize;
  const variance =
    sampleSize *
    (successInPop / popSize) *
    ((popSize - successInPop) / popSize) *
    ((popSize - sampleSize) / (popSize - 1));
  return { N: popSize, K: successInPop, n: sampleSize, mean, variance, std: Math.sqrt(Math.max(variance, 0)) };
}

export function hypergeometricCurve(popSize: number, successInPop: number, sampleSize: number) {
  const kMin = Math.max(0, sampleSize - (popSize - successInPop));
  const kMax = Math.min(sampleSize, successInPop);
  const k: number[] = [];
  const pmf: number[] = [];
  for (let i = kMin; i <= kMax; i++) {
    k.push(i);
    pmf.push(hypergeometricPMF(popSize, successInPop, sampleSize, i));
  }
  return { k, pmf };
}
