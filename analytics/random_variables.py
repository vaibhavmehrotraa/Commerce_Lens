"""
Random variables: empirical PMF/CDF for a discrete variable, plus the
theoretical Bernoulli / Binomial / Hypergeometric models used for
forward-looking (model-based) business questions.

Naming convention: functions here are pure math and take plain floats/ints
so they can be unit tested without touching the dataset.
"""

from __future__ import annotations

from typing import Sequence

import numpy as np
from scipy import stats


# ---------------------------------------------------------------------
# Empirical discrete random variable (e.g. X = items_purchased)
# ---------------------------------------------------------------------

def empirical_pmf(values: Sequence[int]) -> dict:
    arr = np.asarray(values, dtype=int)
    total = arr.size
    unique, counts = np.unique(arr, return_counts=True)
    return {int(k): float(v) / total for k, v in zip(unique, counts)}


def empirical_cdf(values: Sequence[int]) -> dict:
    pmf = empirical_pmf(values)
    xs = sorted(pmf.keys())
    cdf = {}
    running = 0.0
    for x in xs:
        running += pmf[x]
        cdf[x] = running
    return cdf


def expected_value_discrete(pmf: dict) -> float:
    return float(sum(x * p for x, p in pmf.items()))


def variance_discrete(pmf: dict) -> float:
    ex = expected_value_discrete(pmf)
    ex2 = sum((x ** 2) * p for x, p in pmf.items())
    return float(ex2 - ex ** 2)


# ---------------------------------------------------------------------
# Expectation / variance / SD for a plain numeric sample
# ---------------------------------------------------------------------

def expected_value(values: Sequence[float]) -> float:
    return float(np.mean(values))


def variance(values: Sequence[float]) -> float:
    return float(np.var(values, ddof=1)) if len(values) > 1 else 0.0


def std_dev(values: Sequence[float]) -> float:
    return float(np.std(values, ddof=1)) if len(values) > 1 else 0.0


# ---------------------------------------------------------------------
# Bernoulli
# ---------------------------------------------------------------------

def bernoulli_stats(p: float) -> dict:
    if not (0 <= p <= 1):
        raise ValueError("p must be in [0, 1]")
    return {"p_success": p, "p_failure": 1 - p, "mean": p, "variance": p * (1 - p), "std": (p * (1 - p)) ** 0.5}


# ---------------------------------------------------------------------
# Binomial: n trials, success probability p
# ---------------------------------------------------------------------

def binomial_pmf(n: int, p: float, k: int) -> float:
    return float(stats.binom.pmf(k, n, p))


def binomial_cdf_le(n: int, p: float, k: int) -> float:
    """P(X <= k)"""
    return float(stats.binom.cdf(k, n, p))


def binomial_cdf_ge(n: int, p: float, k: int) -> float:
    """P(X >= k) = 1 - P(X <= k-1)"""
    return float(1 - stats.binom.cdf(k - 1, n, p))


def binomial_summary(n: int, p: float) -> dict:
    return {
        "n": n, "p": p,
        "mean": n * p,
        "variance": n * p * (1 - p),
        "std": (n * p * (1 - p)) ** 0.5,
    }


def binomial_pmf_curve(n: int, p: float) -> dict:
    """Full PMF over k=0..n for charting."""
    ks = list(range(n + 1))
    pmf = stats.binom.pmf(ks, n, p)
    return {"k": ks, "pmf": pmf.tolist()}


# ---------------------------------------------------------------------
# Hypergeometric: finite population sampling without replacement
# ---------------------------------------------------------------------

def hypergeometric_pmf(pop_size: int, n_success_in_pop: int, sample_size: int, k: int) -> float:
    """P(X = k): k = number of successes observed in the sample.
    scipy convention: hypergeom(M, n, N) where M=pop, n=successes-in-pop, N=sample_size."""
    return float(stats.hypergeom.pmf(k, pop_size, n_success_in_pop, sample_size))


def hypergeometric_summary(pop_size: int, n_success_in_pop: int, sample_size: int) -> dict:
    mean, var = stats.hypergeom.stats(pop_size, n_success_in_pop, sample_size, moments="mv")
    return {
        "N_population": pop_size,
        "K_successes_in_population": n_success_in_pop,
        "n_sample_size": sample_size,
        "expected_successes_in_sample": float(mean),
        "variance": float(var),
        "std": float(var) ** 0.5,
    }


def hypergeometric_pmf_curve(pop_size: int, n_success_in_pop: int, sample_size: int) -> dict:
    k_min = max(0, sample_size - (pop_size - n_success_in_pop))
    k_max = min(sample_size, n_success_in_pop)
    ks = list(range(k_min, k_max + 1))
    pmf = [hypergeometric_pmf(pop_size, n_success_in_pop, sample_size, k) for k in ks]
    return {"k": ks, "pmf": pmf}
