"""
Campaign Sampling Without Replacement: a thin, business-framed wrapper
around the hypergeometric model in random_variables.py.

Scenario: a campaign pool of N customers contains K high-value customers.
We randomly select n customers (without replacement) for a limited-slot
campaign. What is the probability that exactly k of the selected
customers are high-value?
"""

from __future__ import annotations

from . import random_variables as rv


def campaign_sample_probability(pool_size: int, high_value_count: int, sample_size: int, k: int) -> dict:
    if not (0 <= high_value_count <= pool_size):
        raise ValueError("high_value_count must be between 0 and pool_size")
    if not (0 <= sample_size <= pool_size):
        raise ValueError("sample_size must be between 0 and pool_size")
    p_exact_k = rv.hypergeometric_pmf(pool_size, high_value_count, sample_size, k)
    summary = rv.hypergeometric_summary(pool_size, high_value_count, sample_size)
    curve = rv.hypergeometric_pmf_curve(pool_size, high_value_count, sample_size)

    # Naive (incorrect) binomial approximation using p = K/N, sampling WITH replacement,
    # shown side-by-side to illustrate why it understates/overstates variance here.
    from . import random_variables as rv2
    p_hat = high_value_count / pool_size
    binomial_approx = rv2.binomial_pmf(sample_size, p_hat, k)

    return {
        "N_pool_size": pool_size,
        "K_high_value": high_value_count,
        "n_sample_size": sample_size,
        "k_target": k,
        "p_exact_k": p_exact_k,
        "expected_high_value_in_sample": summary["expected_successes_in_sample"],
        "variance": summary["variance"],
        "std": summary["std"],
        "pmf_curve": curve,
        "binomial_approx_p_exact_k": binomial_approx,
    }
