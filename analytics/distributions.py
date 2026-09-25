"""
Continuous Distribution Lab: Uniform, Triangular, Exponential.

These model business processes for which we have assumptions (a bounded
promo window, a delivery-time estimate, an average purchase rate) rather
than raw observed data -- clearly labeled as Model Simulations wherever
they're presented on the site.
"""

from __future__ import annotations

from scipy import stats


# ---------------------------------------------------------------------
# Uniform: session arrival time within a bounded promotional window [a, b]
# ---------------------------------------------------------------------

def uniform_pdf(x: float, a: float, b: float) -> float:
    return float(stats.uniform.pdf(x, loc=a, scale=b - a))


def uniform_cdf_le(x: float, a: float, b: float) -> float:
    """P(X <= x)"""
    return float(stats.uniform.cdf(x, loc=a, scale=b - a))


def uniform_prob_between(x1: float, x2: float, a: float, b: float) -> float:
    """P(x1 <= X <= x2)"""
    return float(stats.uniform.cdf(x2, loc=a, scale=b - a) - stats.uniform.cdf(x1, loc=a, scale=b - a))


def uniform_summary(a: float, b: float) -> dict:
    mean, var = stats.uniform.stats(loc=a, scale=b - a, moments="mv")
    return {"a": a, "b": b, "mean": float(mean), "variance": float(var), "std": float(var) ** 0.5}


def uniform_curve(a: float, b: float, n_points: int = 200) -> dict:
    import numpy as np
    xs = np.linspace(a - (b - a) * 0.15, b + (b - a) * 0.15, n_points)
    pdf = stats.uniform.pdf(xs, loc=a, scale=b - a)
    cdf = stats.uniform.cdf(xs, loc=a, scale=b - a)
    return {"x": xs.tolist(), "pdf": pdf.tolist(), "cdf": cdf.tolist()}


# ---------------------------------------------------------------------
# Triangular: delivery time uncertainty (min, mode, max)
# ---------------------------------------------------------------------

def _triang_params(minimum: float, mode: float, maximum: float):
    scale = maximum - minimum
    c = (mode - minimum) / scale if scale > 0 else 0.5
    return minimum, c, scale


def triangular_pdf(x: float, minimum: float, mode: float, maximum: float) -> float:
    loc, c, scale = _triang_params(minimum, mode, maximum)
    return float(stats.triang.pdf(x, c, loc=loc, scale=scale))


def triangular_cdf_le(x: float, minimum: float, mode: float, maximum: float) -> float:
    loc, c, scale = _triang_params(minimum, mode, maximum)
    return float(stats.triang.cdf(x, c, loc=loc, scale=scale))


def triangular_summary(minimum: float, mode: float, maximum: float) -> dict:
    loc, c, scale = _triang_params(minimum, mode, maximum)
    mean, var = stats.triang.stats(c, loc=loc, scale=scale, moments="mv")
    return {
        "min": minimum, "mode": mode, "max": maximum,
        "mean": float(mean), "variance": float(var), "std": float(var) ** 0.5,
    }


def triangular_curve(minimum: float, mode: float, maximum: float, n_points: int = 200) -> dict:
    import numpy as np
    loc, c, scale = _triang_params(minimum, mode, maximum)
    xs = np.linspace(minimum, maximum, n_points)
    pdf = stats.triang.pdf(xs, c, loc=loc, scale=scale)
    cdf = stats.triang.cdf(xs, c, loc=loc, scale=scale)
    return {"x": xs.tolist(), "pdf": pdf.tolist(), "cdf": cdf.tolist()}


# ---------------------------------------------------------------------
# Exponential: time between purchases, parameterized by rate lambda
# ---------------------------------------------------------------------

def exponential_cdf_le(t: float, rate: float) -> float:
    """P(T <= t)"""
    return float(stats.expon.cdf(t, scale=1 / rate))


def exponential_survival(t: float, rate: float) -> float:
    """P(T > t) = 1 - CDF"""
    return float(stats.expon.sf(t, scale=1 / rate))


def exponential_summary(rate: float) -> dict:
    mean, var = stats.expon.stats(scale=1 / rate, moments="mv")
    return {"rate": rate, "mean": float(mean), "variance": float(var), "std": float(var) ** 0.5}


def exponential_curve(rate: float, x_max: float | None = None, n_points: int = 200) -> dict:
    import numpy as np
    if x_max is None:
        x_max = 5 / rate
    xs = np.linspace(0, x_max, n_points)
    pdf = stats.expon.pdf(xs, scale=1 / rate)
    cdf = stats.expon.cdf(xs, scale=1 / rate)
    return {"x": xs.tolist(), "pdf": pdf.tolist(), "cdf": cdf.tolist()}


def exponential_memoryless_check(rate: float, s: float, t: float) -> dict:
    """Verify P(T > s+t | T > s) == P(T > t)."""
    p_gt_t = exponential_survival(t, rate)
    p_gt_s = exponential_survival(s, rate)
    p_gt_s_plus_t = exponential_survival(s + t, rate)
    p_conditional = p_gt_s_plus_t / p_gt_s if p_gt_s > 0 else 0.0
    return {"p_t_gt_t": p_gt_t, "p_conditional_given_survived_s": p_conditional,
            "matches_memoryless_property": abs(p_gt_t - p_conditional) < 1e-9}
