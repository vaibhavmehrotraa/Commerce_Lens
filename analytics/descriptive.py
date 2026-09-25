"""
Descriptive statistics: the numbers a business stakeholder reads first.

Pure functions operating on plain lists/arrays so they are trivially
testable and reusable from both run_all.py and the test suite.
"""

from __future__ import annotations

from collections import Counter
from typing import Sequence

import numpy as np


def mean(values: Sequence[float]) -> float:
    return float(np.mean(values))


def median(values: Sequence[float]) -> float:
    return float(np.median(values))


def mode(values: Sequence) -> object:
    counts = Counter(values)
    return counts.most_common(1)[0][0]


def value_range(values: Sequence[float]) -> float:
    return float(np.max(values) - np.min(values))


def percentile(values: Sequence[float], p: float) -> float:
    """p in [0, 100]."""
    return float(np.percentile(values, p))


def quartiles(values: Sequence[float]) -> dict:
    q1 = percentile(values, 25)
    q2 = percentile(values, 50)
    q3 = percentile(values, 75)
    return {"q1": q1, "q2": q2, "q3": q3, "iqr": q3 - q1}


def iqr(values: Sequence[float]) -> float:
    q = quartiles(values)
    return q["iqr"]


def outlier_bounds(values: Sequence[float], k: float = 1.5) -> dict:
    """Tukey IQR fence: values outside [Q1 - k*IQR, Q3 + k*IQR] are outliers."""
    q = quartiles(values)
    lower = q["q1"] - k * q["iqr"]
    upper = q["q3"] + k * q["iqr"]
    return {"lower": lower, "upper": upper}


def outliers(values: Sequence[float], k: float = 1.5) -> list:
    bounds = outlier_bounds(values, k)
    arr = np.asarray(values, dtype=float)
    mask = (arr < bounds["lower"]) | (arr > bounds["upper"])
    return arr[mask].tolist()


def summary(values: Sequence[float]) -> dict:
    arr = np.asarray(values, dtype=float)
    q = quartiles(arr)
    bounds = outlier_bounds(arr)
    n_outliers = int(((arr < bounds["lower"]) | (arr > bounds["upper"])).sum())
    return {
        "n": int(arr.size),
        "mean": mean(arr),
        "median": median(arr),
        "std": float(np.std(arr, ddof=1)) if arr.size > 1 else 0.0,
        "variance": float(np.var(arr, ddof=1)) if arr.size > 1 else 0.0,
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "range": value_range(arr),
        "q1": q["q1"],
        "q2": q["q2"],
        "q3": q["q3"],
        "iqr": q["iqr"],
        "p90": percentile(arr, 90),
        "p95": percentile(arr, 95),
        "p99": percentile(arr, 99),
        "outlier_lower_bound": bounds["lower"],
        "outlier_upper_bound": bounds["upper"],
        "n_outliers": n_outliers,
        "pct_outliers": n_outliers / arr.size if arr.size else 0.0,
    }


def frequency_table(values: Sequence) -> dict:
    """Frequency + relative frequency for a categorical variable."""
    counts = Counter(values)
    total = sum(counts.values())
    return {
        str(k): {"count": int(v), "proportion": v / total}
        for k, v in sorted(counts.items(), key=lambda kv: -kv[1])
    }


def proportion_below(values: Sequence[float], threshold: float) -> float:
    arr = np.asarray(values, dtype=float)
    return float((arr < threshold).mean())


def proportion_above(values: Sequence[float], threshold: float) -> float:
    arr = np.asarray(values, dtype=float)
    return float((arr > threshold).mean())
