"""
Association between variables: categorical x categorical, numerical x
numerical, categorical x numerical. Every function here answers "how
strongly do these two things move together" -- never "does one cause
the other."
"""

from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd


def crosstab_relative_freq(a: Sequence, b: Sequence) -> dict:
    """Categorical x categorical: contingency table + relative frequencies
    (proportion of b within each level of a)."""
    df = pd.DataFrame({"a": a, "b": b})
    ct = pd.crosstab(df["a"], df["b"])
    rel = pd.crosstab(df["a"], df["b"], normalize="index")
    return {
        "counts": ct.to_dict(orient="index"),
        "row_relative_freq": rel.to_dict(orient="index"),
    }


def covariance(x: Sequence[float], y: Sequence[float]) -> float:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    return float(np.cov(x, y, ddof=1)[0, 1])


def correlation(x: Sequence[float], y: Sequence[float]) -> float:
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    if np.std(x) == 0 or np.std(y) == 0:
        return 0.0
    return float(np.corrcoef(x, y)[0, 1])


def fitted_line(x: Sequence[float], y: Sequence[float]) -> dict:
    """Simple OLS: y = slope*x + intercept."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    y_hat = slope * x + intercept
    ss_res = float(np.sum((y - y_hat) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0
    return {"slope": float(slope), "intercept": float(intercept), "r_squared": r_squared}


def group_means(category: Sequence, value: Sequence[float]) -> dict:
    """Categorical x numerical: mean (and n) of `value` within each level of `category`."""
    df = pd.DataFrame({"cat": category, "val": value})
    g = df.groupby("cat")["val"].agg(["mean", "median", "std", "count"])
    return {
        str(idx): {
            "mean": float(row["mean"]),
            "median": float(row["median"]),
            "std": float(row["std"]) if pd.notna(row["std"]) else 0.0,
            "n": int(row["count"]),
        }
        for idx, row in g.iterrows()
    }


def rate_by_group(category: Sequence, binary_outcome: Sequence) -> dict:
    """P(outcome=1 | category=level) for each level -- used for purchase-rate breakdowns."""
    df = pd.DataFrame({"cat": category, "y": np.asarray(binary_outcome, dtype=float)})
    g = df.groupby("cat")["y"].agg(["mean", "count"])
    return {
        str(idx): {"rate": float(row["mean"]), "n": int(row["count"])}
        for idx, row in g.iterrows()
    }


def scatter_sample(x: Sequence[float], y: Sequence[float], max_points: int = 800, seed: int = 42) -> dict:
    """Downsampled points for scatterplot rendering (avoid shipping 60k points to the browser)."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    n = len(x)
    if n > max_points:
        rng = np.random.default_rng(seed)
        idx = rng.choice(n, max_points, replace=False)
        x, y = x[idx], y[idx]
    return {"x": x.tolist(), "y": y.tolist()}
