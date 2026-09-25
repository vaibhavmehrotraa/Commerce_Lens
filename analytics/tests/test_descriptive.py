import math

import pytest

from analytics import descriptive as d


def test_mean_basic():
    assert d.mean([1, 2, 3, 4, 5]) == 3.0


def test_median_odd():
    assert d.median([1, 3, 2]) == 2.0


def test_median_even():
    assert d.median([1, 2, 3, 4]) == 2.5


def test_mode_most_frequent():
    assert d.mode([1, 1, 2, 3]) == 1


def test_range():
    assert d.value_range([5, 1, 9, 3]) == 8


def test_quartiles_and_iqr():
    values = list(range(1, 101))  # 1..100
    q = d.quartiles(values)
    assert math.isclose(q["q1"], 25.75, rel_tol=1e-6)
    assert math.isclose(q["q3"], 75.25, rel_tol=1e-6)
    assert math.isclose(q["iqr"], q["q3"] - q["q1"])


def test_outlier_bounds_flags_extreme_value():
    values = [10, 12, 11, 13, 12, 11, 1000]
    outliers = d.outliers(values)
    assert 1000 in outliers
    assert 10 not in outliers


def test_outliers_empty_when_no_extremes():
    values = [10, 11, 12, 13, 14]
    assert d.outliers(values) == []


def test_frequency_table_proportions_sum_to_one():
    freq = d.frequency_table(["a", "a", "b", "c", "c", "c"])
    total = sum(v["proportion"] for v in freq.values())
    assert math.isclose(total, 1.0, rel_tol=1e-9)
    assert freq["c"]["count"] == 3


def test_proportion_below_and_above():
    values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    assert d.proportion_below(values, 5) == 0.4
    assert d.proportion_above(values, 5) == 0.5


def test_summary_single_value_no_crash():
    s = d.summary([42])
    assert s["mean"] == 42
    assert s["std"] == 0.0
    assert s["variance"] == 0.0
