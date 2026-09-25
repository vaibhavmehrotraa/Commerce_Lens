"""
Empirical probability engine: set-theoretic operations (union, intersection,
complement, conditional) computed directly from observed session data.
"""

from __future__ import annotations

from typing import Sequence

import numpy as np


def _as_bool(a: Sequence) -> np.ndarray:
    return np.asarray(a, dtype=bool)


def p_event(event: Sequence[bool]) -> float:
    """P(A)"""
    a = _as_bool(event)
    return float(a.mean()) if a.size else 0.0


def p_complement(event: Sequence[bool]) -> float:
    """P(A^c) = 1 - P(A)"""
    return 1.0 - p_event(event)


def p_intersection(a: Sequence[bool], b: Sequence[bool]) -> float:
    """P(A ∩ B)"""
    a, b = _as_bool(a), _as_bool(b)
    return float((a & b).mean()) if a.size else 0.0


def p_union(a: Sequence[bool], b: Sequence[bool]) -> float:
    """P(A ∪ B) = P(A) + P(B) - P(A ∩ B)"""
    return p_event(a) + p_event(b) - p_intersection(a, b)


def p_conditional(a: Sequence[bool], given_b: Sequence[bool]) -> float:
    """P(A | B) = P(A ∩ B) / P(B). Returns 0.0 if P(B) == 0."""
    a, b = _as_bool(a), _as_bool(given_b)
    p_b = p_event(b)
    if p_b == 0:
        return 0.0
    return p_intersection(a, b) / p_b


def independence_check(a: Sequence[bool], b: Sequence[bool]) -> dict:
    """Compare P(A ∩ B) against P(A)*P(B). Events are 'empirically close to
    independent' if the two are nearly equal in this sample -- this is
    NOT a formal hypothesis test / statistical proof of independence."""
    a, b = _as_bool(a), _as_bool(b)
    p_a = p_event(a)
    p_b = p_event(b)
    p_and = p_intersection(a, b)
    p_product = p_a * p_b
    abs_diff = abs(p_and - p_product)
    rel_diff = abs_diff / p_product if p_product > 0 else float("inf")
    return {
        "p_a": p_a,
        "p_b": p_b,
        "p_a_and_b": p_and,
        "p_a_times_p_b": p_product,
        "absolute_difference": abs_diff,
        "relative_difference": rel_diff,
        "appears_independent_in_sample": abs_diff < 0.01,
    }
