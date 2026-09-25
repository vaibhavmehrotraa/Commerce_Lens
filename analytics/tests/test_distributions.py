import math

from analytics import distributions as dist


def test_uniform_cdf_bounds():
    assert dist.uniform_cdf_le(0, 0, 10) == 0.0
    assert dist.uniform_cdf_le(10, 0, 10) == 1.0
    assert math.isclose(dist.uniform_cdf_le(5, 0, 10), 0.5)


def test_uniform_prob_between():
    assert math.isclose(dist.uniform_prob_between(2, 8, 0, 10), 0.6)


def test_uniform_summary_mean_variance():
    s = dist.uniform_summary(0, 12)
    assert math.isclose(s["mean"], 6.0)
    assert math.isclose(s["variance"], (12 - 0) ** 2 / 12, rel_tol=1e-9)


def test_triangular_cdf_at_bounds():
    assert math.isclose(dist.triangular_cdf_le(2, 2, 4, 9), 0.0, abs_tol=1e-9)
    assert math.isclose(dist.triangular_cdf_le(9, 2, 4, 9), 1.0, abs_tol=1e-9)


def test_triangular_cdf_monotonic():
    xs = [2, 3, 4, 5, 6, 7, 8, 9]
    cdfs = [dist.triangular_cdf_le(x, 2, 4, 9) for x in xs]
    assert all(cdfs[i] <= cdfs[i + 1] + 1e-9 for i in range(len(cdfs) - 1))


def test_triangular_summary_mean_formula():
    minimum, mode, maximum = 2, 4, 9
    s = dist.triangular_summary(minimum, mode, maximum)
    expected_mean = (minimum + mode + maximum) / 3
    assert math.isclose(s["mean"], expected_mean, rel_tol=1e-6)


def test_exponential_cdf_and_survival_complementary():
    rate = 0.1
    t = 5
    assert math.isclose(dist.exponential_cdf_le(t, rate) + dist.exponential_survival(t, rate), 1.0)


def test_exponential_mean_is_one_over_rate():
    rate = 0.25
    s = dist.exponential_summary(rate)
    assert math.isclose(s["mean"], 1 / rate, rel_tol=1e-9)


def test_exponential_memoryless_property_holds():
    result = dist.exponential_memoryless_check(rate=0.2, s=3, t=4)
    assert result["matches_memoryless_property"] is True
