/**
 * Lightweight assertion-based test runner for the TypeScript analytics
 * mirrors (lib/analytics/*.ts) that power the site's live, client-side
 * calculators. Mirrors the coverage of analytics/tests/*.py on the Python
 * side: mean/median/quartiles/IQR, covariance/correlation, probability,
 * conditional probability, binomial, hypergeometric, expectation/variance,
 * uniform/triangular/exponential -- plus edge cases.
 *
 * Run with: npx tsx lib/analytics/__tests__/run.ts
 */

import * as d from "../descriptive";
import * as m from "../mathUtils";
import * as rv from "../randomVariables";
import * as dist from "../distributions";

let pass = 0;
let fail = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${name}`);
  }
}

function close(a: number, b: number, tol = 1e-6) {
  return Math.abs(a - b) < tol;
}

// ---- descriptive ----
assert("mean_basic", d.mean([1, 2, 3, 4, 5]) === 3);
assert("median_odd", d.median([1, 3, 2]) === 2);
assert("median_even", d.median([1, 2, 3, 4]) === 2.5);
assert("mode_most_frequent", d.mode([1, 1, 2, 3]) === 1);
assert("range_basic", d.range([5, 1, 9, 3]) === 8);
{
  const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
  const q = d.quartiles(values);
  assert("quartiles_q1", close(q.q1, 25.75, 1e-6));
  assert("quartiles_q3", close(q.q3, 75.25, 1e-6));
  assert("iqr_matches_q3_minus_q1", close(q.iqr, q.q3 - q.q1));
}
{
  const values = [10, 12, 11, 13, 12, 11, 1000];
  const bounds = d.outlierBounds(values);
  assert("outlier_bounds_flags_extreme_value", 1000 > bounds.upper);
  assert("outlier_bounds_does_not_flag_normal_value", !(10 < bounds.lower || 10 > bounds.upper));
}
assert("variance_single_value_no_crash", d.variance([42]) === 0);
assert("std_dev_single_value_no_crash", d.stdDev([42]) === 0);

// ---- association (covariance/correlation) ----
{
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];
  assert("covariance_perfect_positive", d.covariance(x, y) > 0);
  assert("correlation_perfect_positive", close(d.correlation(x, y), 1, 1e-9));
}
{
  const x = [1, 2, 3, 4, 5];
  const y = [10, 8, 6, 4, 2];
  assert("correlation_perfect_negative", close(d.correlation(x, y), -1, 1e-9));
}
assert("correlation_zero_variance_returns_zero_not_nan", d.correlation([5, 5, 5, 5], [1, 2, 3, 4]) === 0);

// ---- combinatorics ----
assert("factorial_basic", m.factorial(5) === 120);
assert("factorial_zero", m.factorial(0) === 1);
assert("permutations_basic", m.permutations(5, 2) === 20);
assert("combinations_basic", m.combinations(5, 2) === 10);
assert("combinations_symmetry", m.combinations(10, 3) === m.combinations(10, 7));
assert("permutations_with_repetition", m.permutationsWithRepetition(3, [2, 1]) === 3); // "AAB" -> 3
assert("counting_principle", m.countingPrinciple([3, 4, 2]) === 24);
{
  let threw = false;
  try {
    m.combinations(5, 6);
  } catch {
    threw = true;
  }
  assert("combinations_out_of_range_raises", threw);
}
{
  let threw = false;
  try {
    m.factorial(-1);
  } catch {
    threw = true;
  }
  assert("factorial_negative_raises", threw);
}

// ---- random variables: Bernoulli / Binomial / Hypergeometric ----
{
  const s = rv.bernoulliStats(0.3);
  assert("bernoulli_mean_equals_p", close(s.mean, 0.3));
  assert("bernoulli_variance_matches_formula", close(s.variance, 0.3 * 0.7));
}
{
  // P(X=2) for n=3, p=0.5 -> C(3,2)*0.5^3 = 3/8
  assert("binomial_pmf_matches_hand_calc", close(rv.binomialPMF(3, 0.5, 2), 3 / 8, 1e-9));
}
{
  const n = 10, p = 0.4;
  let ok = true;
  for (let k = 0; k <= n; k++) {
    const le = rv.binomialCdfLE(n, p, k);
    const ge = rv.binomialCdfGE(n, p, k + 1);
    if (!close(le + ge, 1, 1e-6)) ok = false;
  }
  assert("binomial_cdf_le_and_ge_complementary", ok);
}
{
  const s = rv.binomialSummary(100, 0.2);
  assert("binomial_summary_mean", close(s.mean, 20));
  assert("binomial_summary_variance", close(s.variance, 16));
}
{
  const curve = rv.binomialCurve(20, 0.3);
  const sum = curve.pmf.reduce((a, b) => a + b, 0);
  assert("binomial_pmf_curve_sums_to_one", close(sum, 1, 1e-6));
}
{
  // N=10, K=4, n=3, P(X=2) = C(4,2)*C(6,1)/C(10,3) = 6*6/120
  const expected = (6 * 6) / 120;
  assert("hypergeometric_pmf_matches_hand_calc", close(rv.hypergeometricPMF(10, 4, 3, 2), expected, 1e-9));
}
{
  const s = rv.hypergeometricSummary(100, 20, 10);
  assert("hypergeometric_expected_value", close(s.mean, 2, 1e-9)); // n*K/N = 10*20/100
}
{
  const curve = rv.hypergeometricCurve(50, 15, 10);
  const sum = curve.pmf.reduce((a, b) => a + b, 0);
  assert("hypergeometric_pmf_curve_sums_to_one", close(sum, 1, 1e-6));
}

// ---- continuous distributions ----
assert("uniform_cdf_at_a_is_zero", dist.uniformCdfLE(0, 0, 10) === 0);
assert("uniform_cdf_at_b_is_one", dist.uniformCdfLE(10, 0, 10) === 1);
assert("uniform_cdf_midpoint", close(dist.uniformCdfLE(5, 0, 10), 0.5));
assert("uniform_prob_between", close(dist.uniformProbBetween(2, 8, 0, 10), 0.6));
{
  const s = dist.uniformSummary(0, 12);
  assert("uniform_mean", close(s.mean, 6));
  assert("uniform_variance", close(s.variance, (12 * 12) / 12, 1e-9));
}
assert("triangular_cdf_at_min_is_zero", close(dist.triangularCdfLE(2, 2, 4, 9), 0, 1e-9));
assert("triangular_cdf_at_max_is_one", close(dist.triangularCdfLE(9, 2, 4, 9), 1, 1e-9));
{
  const s = dist.triangularSummary(2, 4, 9);
  assert("triangular_mean_formula", close(s.mean, (2 + 4 + 9) / 3, 1e-6));
}
assert(
  "exponential_cdf_survival_complementary",
  close(dist.exponentialCdfLE(5, 0.1) + dist.exponentialSurvival(5, 0.1), 1)
);
{
  const s = dist.exponentialSummary(0.25);
  assert("exponential_mean_is_one_over_rate", close(s.mean, 1 / 0.25, 1e-9));
}
{
  const check = dist.exponentialMemorylessCheck(0.2, 3, 4);
  assert("exponential_memoryless_property_holds", check.matches_memoryless_property);
}

// ---- summary ----
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
