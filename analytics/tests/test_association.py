import math

from analytics import association as a


def test_covariance_perfect_positive():
    x = [1, 2, 3, 4, 5]
    y = [2, 4, 6, 8, 10]
    assert a.covariance(x, y) > 0
    assert math.isclose(a.correlation(x, y), 1.0, rel_tol=1e-9)


def test_correlation_perfect_negative():
    x = [1, 2, 3, 4, 5]
    y = [10, 8, 6, 4, 2]
    assert math.isclose(a.correlation(x, y), -1.0, rel_tol=1e-9)


def test_correlation_zero_variance_returns_zero_not_nan():
    x = [5, 5, 5, 5]
    y = [1, 2, 3, 4]
    assert a.correlation(x, y) == 0.0


def test_fitted_line_recovers_known_slope():
    x = [0, 1, 2, 3, 4]
    y = [1, 3, 5, 7, 9]  # y = 2x + 1
    fit = a.fitted_line(x, y)
    assert math.isclose(fit["slope"], 2.0, rel_tol=1e-6)
    assert math.isclose(fit["intercept"], 1.0, rel_tol=1e-6)
    assert math.isclose(fit["r_squared"], 1.0, rel_tol=1e-6)


def test_group_means_basic():
    cat = ["A", "A", "B", "B"]
    val = [10, 20, 100, 200]
    means = a.group_means(cat, val)
    assert means["A"]["mean"] == 15
    assert means["B"]["mean"] == 150


def test_rate_by_group_basic():
    cat = ["mobile", "mobile", "desktop"]
    y = [1, 0, 1]
    rates = a.rate_by_group(cat, y)
    assert math.isclose(rates["mobile"]["rate"], 0.5)
    assert rates["desktop"]["rate"] == 1.0


def test_crosstab_relative_freq_rows_sum_to_one():
    a_vals = ["x", "x", "y", "y", "y"]
    b_vals = [1, 0, 1, 1, 0]
    ct = a.crosstab_relative_freq(a_vals, b_vals)
    for row in ct["row_relative_freq"].values():
        assert math.isclose(sum(row.values()), 1.0, rel_tol=1e-9)
