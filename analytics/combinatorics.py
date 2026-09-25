"""
Campaign & recommendation combinatorics: counting principles applied to
campaign design and product bundling decisions.
"""

from __future__ import annotations

import math


def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("factorial is undefined for negative n")
    return math.factorial(n)


def permutations(n: int, r: int) -> int:
    """Number of ways to arrange r distinct objects chosen from n, order matters."""
    if r < 0 or r > n or n < 0:
        raise ValueError("require 0 <= r <= n")
    return math.perm(n, r)


def combinations(n: int, r: int) -> int:
    """Number of ways to choose r objects from n, order does not matter."""
    if r < 0 or r > n or n < 0:
        raise ValueError("require 0 <= r <= n")
    return math.comb(n, r)


def permutations_with_repetition(n: int, counts: list[int]) -> int:
    """Distinct arrangements of n objects where groups of identical objects
    have sizes given in `counts` (must sum to n). E.g. arranging campaign
    slots where several slots share the same offer type."""
    if sum(counts) != n:
        raise ValueError("counts must sum to n")
    denom = 1
    for c in counts:
        denom *= math.factorial(c)
    return math.factorial(n) // denom


def counting_principle(choices_per_step: list[int]) -> int:
    """Multiplication principle: total combinations across independent steps."""
    total = 1
    for c in choices_per_step:
        total *= c
    return total


def campaign_assignment_count(n_offer_types: int, n_segments: int) -> dict:
    """How many ways can we assign one offer type to each customer segment
    (order matters -- each segment gets a distinct role)?"""
    perm = permutations(n_offer_types, n_segments) if n_offer_types >= n_segments else None
    total_pairings = counting_principle([n_offer_types] * n_segments)
    return {
        "n_offer_types": n_offer_types,
        "n_segments": n_segments,
        "distinct_offer_per_segment_permutations": perm,
        "any_offer_any_segment_total": total_pairings,
    }


def choose_k_customers(pool_size: int, k: int) -> int:
    """How many distinct k-customer campaign samples can be drawn from a pool (order irrelevant)."""
    return combinations(pool_size, k)


def product_bundle_count(assortment_size: int, bundle_size: int) -> int:
    """How many distinct product bundles of `bundle_size` items can be formed
    from an assortment of `assortment_size` products (order irrelevant)."""
    return combinations(assortment_size, bundle_size)
