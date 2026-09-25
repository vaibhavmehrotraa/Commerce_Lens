"""
Customer value analysis: revenue, orders, AOV, return rate, margin and
repeat-purchase rate, sliced by whichever grouping column the caller asks for.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def value_metrics(df: pd.DataFrame) -> dict:
    purchased = df[df["purchase"]]
    revenue = float(purchased["order_value"].sum())
    orders = int(len(purchased))
    aov = float(purchased["order_value"].mean()) if orders else 0.0
    median_ov = float(purchased["order_value"].median()) if orders else 0.0
    return_rate = float(purchased["returned"].mean()) if orders else 0.0
    margin = float(purchased["profit_margin_pct"].mean()) if orders else 0.0
    repeat_rate = float(df.drop_duplicates("customer_id")["repeat_customer"].mean()) if len(df) else 0.0
    conversion_rate = float(df["purchase"].mean()) if len(df) else 0.0
    return {
        "sessions": int(len(df)),
        "unique_customers": int(df["customer_id"].nunique()),
        "orders": orders,
        "revenue": revenue,
        "aov": aov,
        "median_order_value": median_ov,
        "return_rate": return_rate,
        "avg_profit_margin_pct": margin,
        "repeat_customer_rate": repeat_rate,
        "conversion_rate": conversion_rate,
    }


def value_by_group(df: pd.DataFrame, group_col: str) -> dict:
    out = {}
    for level, sub in df.groupby(group_col, observed=True):
        out[str(level)] = value_metrics(sub)
    return out


def order_value_distribution(df: pd.DataFrame, group_col: str | None = None, max_points: int = 600) -> dict:
    """Downsampled order-value points (for box plots) grouped by an optional column."""
    purchased = df[df["purchase"]]
    rng = np.random.default_rng(7)
    if group_col is None:
        vals = purchased["order_value"].to_numpy()
        if len(vals) > max_points:
            vals = rng.choice(vals, max_points, replace=False)
        return {"all": vals.tolist()}
    out = {}
    for level, sub in purchased.groupby(group_col, observed=True):
        vals = sub["order_value"].to_numpy()
        if len(vals) > max_points:
            vals = rng.choice(vals, max_points, replace=False)
        out[str(level)] = vals.tolist()
    return out
