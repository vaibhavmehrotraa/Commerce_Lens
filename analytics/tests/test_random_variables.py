import math

from analytics import random_variables as rv


def test_empirical_pmf_sums_to_one():
    values = [0, 1, 1, 2, 2, 2, 3]
    pmf = rv.empirical_pmf(values)
    assert math.isclose(sum(pmf.values()), 1.0, rel_tol=1e-9)


def test_empirical_cdf_is_monotonic_and_ends_at_one():
    values = [0, 1, 1, 2, 2, 2, 3]
    cdf = rv.empirical_cdf(values)
    xs = sorted(cdf.keys())
    prev = 0
    for x in xs:
        assert cdf[x] >= prev - 1e-12
        prev = cdf[x]
    assert math.isclose(cdf[xs[-1]], 1.0, rel_tol=1e-9)


def test_expected_value_discrete_matches_manual():
    pmf = {0: 0.5, 1: 0.5}
    assert math.isclose(rv.expected_value_discrete(pmf), 0.5)


def test_variance_discrete_bernoulli_matches_formula():
    p = 0.3
    pmf = {0: 1 - p, 1: p}
    assert math.isclose(rv.variance_discrete(pmf), p * (1 - p), rel_tol=1e-9)


def test_bernoulli_stats_invalid_p_raises():
    import pytest
    with pytest.raises(ValueError):
        rv.bernoulli_stats(1.5)


def test_binomial_pmf_matches_hand_calc():
    # P(X=2) for n=3, p=0.5 -> C(3,2)*0.5^3 = 3/8
    assert math.isclose(rv.binomial_pmf(3, 0.5, 2), 3 / 8, rel_tol=1e-9)


def test_binomial_cdf_le_and_ge_complementary():
    n, p = 10, 0.4
    for k in range(n + 1):
        le = rv.binomial_cdf_le(n, p, k)
        ge = rv.binomial_cdf_ge(n, p, k + 1)
        assert math.isclose(le + ge, 1.0, rel_tol=1e-6)


def test_binomial_summary_mean_variance():
    s = rv.binomial_summary(100, 0.2)
    assert math.isclose(s["mean"], 20)
    assert math.isclose(s["variance"], 16)


def test_binomial_pmf_curve_sums_to_one():
    curve = rv.binomial_pmf_curve(20, 0.3)
    assert math.isclose(sum(curve["pmf"]), 1.0, rel_tol=1e-6)


def test_hypergeometric_pmf_matches_hand_calc():
    # N=10, K=4 successes, n=3 sample, P(X=2) = C(4,2)C(6,1)/C(10,3)
    expected = (6 * 6) / 120
    assert math.isclose(rv.hypergeometric_pmf(10, 4, 3, 2), expected, rel_tol=1e-9)


def test_hypergeometric_summary_expected_value():
    s = rv.hypergeometric_summary(100, 20, 10)
    # E[X] = n*K/N = 10*20/100 = 2
    assert math.isclose(s["expected_successes_in_sample"], 2.0, rel_tol=1e-9)


def test_hypergeometric_pmf_curve_sums_to_one():
    curve = rv.hypergeometric_pmf_curve(50, 15, 10)
    assert math.isclose(sum(curve["pmf"]), 1.0, rel_tol=1e-6)
