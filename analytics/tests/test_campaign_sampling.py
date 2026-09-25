import math

from analytics import campaign_sampling as cs


def test_campaign_sample_probability_sums_over_full_curve():
    result = cs.campaign_sample_probability(pool_size=200, high_value_count=40, sample_size=20, k=5)
    assert math.isclose(sum(result["pmf_curve"]["pmf"]), 1.0, rel_tol=1e-6)


def test_campaign_sample_expected_value_matches_hypergeometric_formula():
    # E[X] = n * K / N
    result = cs.campaign_sample_probability(pool_size=500, high_value_count=100, sample_size=50, k=10)
    expected = 50 * 100 / 500
    assert math.isclose(result["expected_high_value_in_sample"], expected, rel_tol=1e-9)


def test_invalid_high_value_count_raises():
    import pytest
    with pytest.raises(ValueError):
        cs.campaign_sample_probability(pool_size=10, high_value_count=20, sample_size=5, k=1)
